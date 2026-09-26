"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import PortalModal from "./PortalModal";
import DayPicker from "./DayPicker";
import { addPlanToCart, addAddonToCart, previewPattern } from "@/app/portal/actions/orders";
import { addPropertyQuick } from "@/app/portal/actions/account";
import { fmtLong, fmtMonth, WEEKDAY_NAMES } from "@/lib/portal/dates";
import { SERVICE_NOTE_FIELDS, type ServiceNotes } from "@/lib/portal/serviceNotes";
import type { CatalogItem, CalendarData } from "./types";

type Props = {
  service: CatalogItem;
  data: CalendarData;
  presetDay: string | null;
  /** Renewing: lock the term and open the picker on this month. */
  presetTerm?: "MONTHLY" | "LOCK12";
  presetMonth?: string;
  onClose: () => void;
  onAdded: (count: number) => void;
};

const money = (n: number) => `$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;

export default function OrderModal({ service, data, presetDay, presetTerm, presetMonth, onClose, onAdded }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isPlan = service.kind === "PLAN";
  const needsDate = service.unit !== "EACH";
  const maxDays = isPlan ? service.visitsPerMonth ?? 1 : service.unit === "DAY" ? 31 : 1;
  const onPlanPrice = service.planPrice != null && data.onPlan ? service.planPrice : null;
  const unitPrice = service.kind === "REQUEST" ? null : onPlanPrice ?? service.price;

  // ----- state
  const [propertyId, setPropertyId] = useState<string>(data.properties.length === 1 ? data.properties[0].id : "");
  const [newAddress, setNewAddress] = useState("");
  const [term, setTerm] = useState<"MONTHLY" | "LOCK12">(presetTerm ?? "MONTHLY");
  const [days, setDays] = useState<string[]>(presetDay ? [presetDay] : []);
  // 12-month plans: a usual day and which weeks, not individual dates.
  const [weekday, setWeekday] = useState<number | null>(null);
  const [ordinals, setOrdinals] = useState<number[]>([1, 3]);
  const [preview, setPreview] = useState<{ month: string; days: string[] } | null>(null);
  const [previewing, startPreview] = useTransition();
  const property = data.properties.find((p) => p.id === propertyId) ?? null;
  const [access, setAccess] = useState({ gateCode: "", doorCode: "", alarmCode: "", keyLocation: "" });
  const [notes, setNotes] = useState<ServiceNotes>({});
  const [answer, setAnswer] = useState("");
  const [accessLoadedFor, setAccessLoadedFor] = useState<string | null>(null);

  if (property && accessLoadedFor !== property.id) {
    setAccess({ gateCode: property.gateCode, doorCode: property.doorCode, alarmCode: property.alarmCode, keyLocation: property.keyLocation });
    setNotes(property.serviceNotes);
    setAccessLoadedFor(property.id);
  }

  // ----- steps
  const steps = useMemo(() => {
    const list: string[] = [];
    if (data.properties.length !== 1) list.push("home");
    if (isPlan && !presetTerm) list.push("term");
    if (isPlan && term === "LOCK12") list.push("pattern");
    else if (needsDate) list.push("days");
    if (isPlan) list.push("access");
    if (service.questionLabel) list.push("question");
    list.push("review");
    return list;
  }, [data.properties.length, isPlan, needsDate, service.questionLabel, term, presetTerm]);
  const [stepIdx, setStepIdx] = useState(0);
  const step = steps[stepIdx];
  const stepLabel = `Step ${stepIdx + 1} of ${steps.length}`;

  const takenDays = data.jobs.filter((j) => j.status === "SCHEDULED").map((j) => j.day);
  const rate = isPlan ? (term === "LOCK12" && service.lock12Price != null ? service.lock12Price : service.price) : 0;
  const everyWeek = (service.visitsPerMonth ?? 1) >= 4;
  const effectiveOrdinals = everyWeek ? [] : ordinals;
  const openWeekdays = data.openWeekdays;
  const startMonth = presetMonth ?? data.month;

  // Show the client which dates their pattern lands on before they commit.
  useEffect(() => {
    if (!isPlan || term !== "LOCK12" || weekday == null) return;
    startPreview(async () => {
      const r = await previewPattern({ weekday, ordinals: effectiveOrdinals, month: startMonth });
      setPreview(r);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekday, ordinals.join(","), term, isPlan, startMonth]);

  const canNext = (): string | null => {
    if (step === "home" && !propertyId) return "Pick which home this is for.";
    if (step === "pattern" && weekday == null) return "Pick your usual visit day.";
    if (step === "pattern" && preview && preview.days.length === 0) return "We are not on the route that day. Pick another.";
    if (step === "days" && days.length === 0) return isPlan ? "Pick your visit days." : "Pick at least one day.";
    if (step === "days" && isPlan && new Set(days.map((d) => d.slice(0, 7))).size > 1) return "Pick days in one month. You renew month by month.";
    return null;
  };

  const next = () => {
    const p = canNext();
    if (p) return setError(p);
    setError(null);
    setStepIdx((i) => Math.min(steps.length - 1, i + 1));
  };
  const back = () => {
    setError(null);
    setStepIdx((i) => Math.max(0, i - 1));
  };

  const addHome = () => {
    if (!newAddress.trim()) return setError("Type the address first.");
    start(async () => {
      const r = await addPropertyQuick({ address: newAddress });
      if (!r.ok || !r.id) return setError(r.error ?? "Could not add that home.");
      setPropertyId(r.id);
      setError(null);
      router.refresh();
      next();
    });
  };

  const submit = () => {
    start(async () => {
      const r = isPlan
        ? await addPlanToCart({
            serviceCode: service.code,
            term,
            propertyId,
            days: term === "MONTHLY" ? days : undefined,
            pattern: term === "LOCK12" && weekday != null ? { weekday, ordinals: effectiveOrdinals, startMonth } : undefined,
            answer,
            access: { ...access, serviceNotes: notes },
          })
        : await addAddonToCart({ serviceCode: service.code, propertyId, days: needsDate ? days : [], answer, serviceNotes: Object.keys(notes).length ? notes : undefined });
      if (!r.ok) return setError(r.error);
      onAdded(r.count);
    });
  };

  return (
    <PortalModal title={service.name} step={stepLabel} onClose={onClose}>
      <div className="pt-stack">
        {error && <div className="pt-alert pt-alert--error" role="alert">{error}</div>}

        {step === "home" && (
          <div className="pt-stack">
            <p className="pt-lede" style={{ marginBottom: 0 }}>Which home is this for?</p>
            <div className="pt-choice-grid">
              {data.properties.map((p) => (
                <button key={p.id} type="button" className={`pt-choice ${propertyId === p.id ? "pt-choice--on" : ""}`} onClick={() => setPropertyId(p.id)}>
                  <div className="pt-choice-title">{p.label || p.address}</div>
                  {p.label && <div className="pt-choice-sub">{p.address}</div>}
                </button>
              ))}
            </div>
            <div className="pt-card pt-card--tight">
              <label className="pt-label">{data.properties.length ? "Or add another home" : "Add your home"}</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input className="pt-field" style={{ flex: 1, minWidth: 220 }} placeholder="123 Street Name, Inlet Beach, FL" value={newAddress} onChange={(e) => setNewAddress(e.target.value)} />
                <button type="button" className="pt-btn" style={{ width: "auto" }} onClick={addHome} disabled={pending}>Add home</button>
              </div>
            </div>
          </div>
        )}

        {step === "term" && (
          <div className="pt-stack">
            <p className="pt-lede" style={{ marginBottom: 0 }}>Monthly, or lock in 12 months and save?</p>
            <div className="pt-choice-grid">
              <button type="button" className={`pt-choice ${term === "MONTHLY" ? "pt-choice--on" : ""}`} onClick={() => setTerm("MONTHLY")}>
                <div className="pt-choice-title">One month at a time</div>
                <div className="pt-choice-sub">Pick your days, pay for the month. We remind you to renew. No contract.</div>
                <div className="pt-choice-price">{money(service.price)}<span className="pt-small"> /month</span></div>
              </button>
              {service.lock12Price != null && (
                <button type="button" className={`pt-choice ${term === "LOCK12" ? "pt-choice--on" : ""}`} onClick={() => setTerm("LOCK12")}>
                  <div className="pt-choice-title">12 months, rate locked</div>
                  <div className="pt-choice-sub">Save {Math.round((1 - service.lock12Price / service.price) * 100)}%. Tell us your usual day, we schedule every month for you. $150 to end early.</div>
                  <div className="pt-choice-price">{money(service.lock12Price)}<span className="pt-small"> /month</span></div>
                </button>
              )}
            </div>
            <p className="pt-small">{service.visitsPerMonth} visit{service.visitsPerMonth === 1 ? "" : "s"} a month either way. The 12-month plan bills your card on the same day each month.</p>
          </div>
        )}

        {step === "pattern" && (
          <div className="pt-stack">
            <p className="pt-lede" style={{ marginBottom: 0 }}>What day should we come?</p>
            <div className="pt-choice-grid pt-choice-grid--3">
              {openWeekdays.map((w) => (
                <button key={w} type="button" className={`pt-choice pt-choice--center ${weekday === w ? "pt-choice--on" : ""}`} onClick={() => setWeekday(w)}>
                  <div className="pt-choice-title">{WEEKDAY_NAMES[w]}s</div>
                </button>
              ))}
            </div>
            {!everyWeek && (
              <div>
                <label className="pt-label">Which weeks?</label>
                <div className="pt-choice-grid">
                  <button type="button" className={`pt-choice ${ordinals.join() === "1,3" ? "pt-choice--on" : ""}`} onClick={() => setOrdinals([1, 3])}>
                    <div className="pt-choice-title">1st and 3rd {weekday != null ? WEEKDAY_NAMES[weekday] : "week"}</div>
                  </button>
                  <button type="button" className={`pt-choice ${ordinals.join() === "2,4" ? "pt-choice--on" : ""}`} onClick={() => setOrdinals([2, 4])}>
                    <div className="pt-choice-title">2nd and 4th {weekday != null ? WEEKDAY_NAMES[weekday] : "week"}</div>
                  </button>
                </div>
              </div>
            )}
            {everyWeek && weekday != null && <p className="pt-small">Every {WEEKDAY_NAMES[weekday]}, {service.visitsPerMonth} visits a month.</p>}
            {weekday != null && (
              <div className={`pt-alert ${preview && preview.days.length ? "pt-alert--ok" : "pt-alert--note"}`}>
                {previewing || !preview
                  ? "Checking the route..."
                  : preview.days.length
                    ? `Your first visits: ${preview.days.map((d) => fmtLong(d).replace(/^\w+, /, "")).join(", ")} (${fmtMonth(preview.month)}). After that we place them every month and email you the dates. Move any visit up to 3 days before.`
                    : "We are not on the route that day. Pick another."}
              </div>
            )}
          </div>
        )}

        {step === "days" && (
          <div className="pt-stack">
            <p className="pt-lede" style={{ marginBottom: 0 }}>
              {isPlan
                ? `Pick your ${maxDays} visit day${maxDays === 1 ? "" : "s"}${days.length ? ` for ${fmtMonth(days[0].slice(0, 7))}` : ", all in one month"}.`
                : service.unit === "DAY"
                  ? "Pick the days you want."
                  : "Pick the day."}{" "}
              <span className="pt-muted">Open route days are white. The earliest you can book is {fmtLong(data.earliest)}.</span>
            </p>
            {isPlan && (
              <div className="pt-alert pt-alert--note" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <span>{days.length} of {maxDays} picked</span>
                {days.length > 0 && <span className="pt-small">{days.map((d) => fmtLong(d).replace(/^\w+, /, "")).join(" and ")}</span>}
              </div>
            )}
            <DayPicker month={startMonth} minMonth={data.minMonth} maxMonth={data.maxMonth} initialDays={startMonth === data.month ? data.days : []} picked={days} onChange={setDays} max={maxDays} takenDays={isPlan ? takenDays : []} />
            {isPlan && <p className="pt-small">One month at a time. Before the month ends we email you to pick next month&apos;s days.</p>}
          </div>
        )}

        {step === "access" && (
          <div className="pt-stack">
            <p className="pt-lede" style={{ marginBottom: 0 }}>How do we get in?</p>
            <p className="pt-small">Only Ryder and the crew member assigned to your visit can see these. Leave anything blank that does not apply.</p>
            <div className="pt-grid-2">
              <div>
                <label className="pt-label">Gate or community code</label>
                <input className="pt-field pt-secret" value={access.gateCode} onChange={(e) => setAccess({ ...access, gateCode: e.target.value })} autoComplete="off" />
              </div>
              <div>
                <label className="pt-label">Door or lockbox code</label>
                <input className="pt-field pt-secret" value={access.doorCode} onChange={(e) => setAccess({ ...access, doorCode: e.target.value })} autoComplete="off" />
              </div>
              <div>
                <label className="pt-label">Alarm code</label>
                <input className="pt-field pt-secret" value={access.alarmCode} onChange={(e) => setAccess({ ...access, alarmCode: e.target.value })} autoComplete="off" />
              </div>
              <div>
                <label className="pt-label">Where is the key?</label>
                <input className="pt-field" value={access.keyLocation} onChange={(e) => setAccess({ ...access, keyLocation: e.target.value })} placeholder="Lockbox by the garage, or we hold one" />
              </div>
            </div>
          </div>
        )}

        {step === "question" && (
          <div className="pt-stack">
            <p className="pt-lede" style={{ marginBottom: 0 }}>{service.questionLabel}</p>
            <textarea className="pt-field" rows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={service.questionHint ?? ""} />
            {isPlan && (
              <div>
                <p className="pt-small" style={{ marginBottom: 10 }}>Quick ones, all optional:</p>
                <div className="pt-grid-2">
                  {SERVICE_NOTE_FIELDS.filter((f) => ["mailLocation", "pets", "plants", "waterShutoff"].includes(f.key)).map((f) => (
                    <div key={f.key}>
                      <label className="pt-label" style={{ fontSize: 14.5 }}>{f.label}</label>
                      <input className="pt-field" value={notes[f.key] ?? ""} onChange={(e) => setNotes({ ...notes, [f.key]: e.target.value })} placeholder={f.hint} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {service.code === "MAIL_TRASH_DAY" && (
              <p className="pt-small">We save this on your home so you never have to type it again.</p>
            )}
          </div>
        )}

        {step === "review" && (
          <div className="pt-stack">
            <p className="pt-lede" style={{ marginBottom: 0 }}>Here is what we will add to your order.</p>
            <div className="pt-card pt-card--tight">
              <div className="pt-list">
                {property && (
                  <div className="pt-row"><span className="pt-muted">Home</span><span style={{ textAlign: "right" }}>{property.label || property.address}</span></div>
                )}
                {isPlan && (
                  <div className="pt-row">
                    <span className="pt-muted">Plan</span>
                    <span style={{ textAlign: "right" }}>
                      {service.name}, {term === "LOCK12" ? "12-month locked rate" : `${fmtMonth(startMonth)} only`}
                      <br />
                      <strong>{money(rate)}{term === "LOCK12" ? "/month" : ""}</strong>
                      {term === "LOCK12" ? ", billed automatically" : ", charged today"}
                    </span>
                  </div>
                )}
                {isPlan && term === "LOCK12" && weekday != null && (
                  <div className="pt-row"><span className="pt-muted">Usual day</span><span>{everyWeek ? `Every ${WEEKDAY_NAMES[weekday]}` : `${ordinals[0] === 1 ? "1st and 3rd" : "2nd and 4th"} ${WEEKDAY_NAMES[weekday]}`}</span></div>
                )}
                {(term === "LOCK12" && isPlan ? preview?.days ?? [] : needsDate ? days : []).map((d) => (
                  <div key={d} className="pt-row">
                    <span>{fmtLong(d)}</span>
                    <span className="pt-row-amt">{isPlan ? "Included" : unitPrice == null ? "Quote" : money(unitPrice)}</span>
                  </div>
                ))}
                {!needsDate && (
                  <div className="pt-row"><span>{service.name}</span><span className="pt-row-amt">{unitPrice == null ? "Quote" : money(unitPrice)}</span></div>
                )}

              </div>
            </div>
            {service.kind === "REQUEST" && (
              <div className="pt-alert pt-alert--note">Nothing is charged for this. Ryder looks at your request and texts you a price first.</div>
            )}
            {onPlanPrice != null && <p className="pt-small">Plan member price applied.</p>}
          </div>
        )}

        <div className="pt-btn-row" style={{ justifyContent: "space-between", marginTop: 6 }}>
          {stepIdx > 0 ? (
            <button type="button" className="pt-btn pt-btn--ghost" onClick={back} disabled={pending}>Back</button>
          ) : (
            <span />
          )}
          {step === "review" ? (
            <button type="button" className="pt-btn pt-btn--primary" onClick={submit} disabled={pending}>
              {pending ? <><span className="pt-spinner" /> Adding</> : "Add to my order"}
            </button>
          ) : step === "home" && !propertyId ? (
            <span />
          ) : (
            <button type="button" className="pt-btn pt-btn--primary" onClick={next} disabled={pending}>Continue</button>
          )}
        </div>
      </div>
    </PortalModal>
  );
}
