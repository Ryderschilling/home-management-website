"use client";

import { useActionState, useState } from "react";
import { saveProperty } from "@/app/portal/actions/account";
import type { ActionState } from "@/app/portal/actions/auth";
import { SubmitButton, FormMessage, Field } from "@/components/portal/FormBits";
import { SERVICE_NOTE_FIELDS, type ServiceNotes } from "@/lib/portal/serviceNotes";

export type PropertyInput = {
  id: string;
  label: string;
  address: string;
  gateCode: string;
  doorCode: string;
  alarmCode: string;
  wifiName: string;
  wifiPassword: string;
  keyLocation: string;
  trashDay: string;
  hvacNotes: string;
  notes: string;
  serviceNotes: ServiceNotes;
};

function SecretInput({ name, defaultValue, label, help }: { name: string; defaultValue: string; label: string; help?: string }) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} help={help}>
      <div style={{ position: "relative" }}>
        <input
          name={name}
          defaultValue={defaultValue}
          type={show ? "text" : "password"}
          autoComplete="off"
          className="pt-field pt-secret"
          style={{ paddingRight: 84 }}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="pt-btn pt-btn--ghost pt-btn--sm"
          style={{ position: "absolute", right: 6, top: 6, minHeight: 44, width: "auto" }}
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </Field>
  );
}

export default function PropertyEditor({ property }: { property: PropertyInput | null }) {
  const [state, action] = useActionState<ActionState, FormData>(saveProperty, {});
  const [open, setOpen] = useState(Boolean(property));
  const p = property ?? {
    id: "",
    label: "",
    address: "",
    gateCode: "",
    doorCode: "",
    alarmCode: "",
    wifiName: "",
    wifiPassword: "",
    keyLocation: "",
    trashDay: "",
    hvacNotes: "",
    notes: "",
    serviceNotes: {},
  };

  if (!property && !open) {
    return (
      <button type="button" className="pt-btn" onClick={() => setOpen(true)}>
        + Add another home
      </button>
    );
  }

  return (
    <form action={action} className="pt-card pt-form">
      <input type="hidden" name="id" value={p.id} />
      <div>
        <h3 className="pt-h3">{property ? property.label || property.address : "New home"}</h3>
        {property && property.label ? <p className="pt-small">{property.address}</p> : null}
      </div>
      <FormMessage state={state} />

      <div className="pt-grid-2">
        <Field label="Address">
          <input name="address" defaultValue={p.address} required className="pt-field" autoComplete="street-address" placeholder="123 Street Name, Inlet Beach, FL" />
        </Field>
        <Field label="Nickname (optional)" help="Beach house, the condo, Mom's place.">
          <input name="label" defaultValue={p.label} className="pt-field" />
        </Field>
      </div>

      <div>
        <h3 className="pt-h3" style={{ marginTop: 6 }}>How we get in</h3>
        <p className="pt-small">Only Ryder and the crew member assigned to your visit can see these.</p>
      </div>
      <div className="pt-grid-2">
        <SecretInput name="gateCode" defaultValue={p.gateCode} label="Gate or community code" />
        <SecretInput name="doorCode" defaultValue={p.doorCode} label="Door or lockbox code" />
        <SecretInput name="alarmCode" defaultValue={p.alarmCode} label="Alarm code" help="And the alarm company, if there is one." />
        <Field label="Where is the key?" help="Lockbox by the garage, under the blue pot, we hold one.">
          <input name="keyLocation" defaultValue={p.keyLocation} className="pt-field" />
        </Field>
        <Field label="Wifi network">
          <input name="wifiName" defaultValue={p.wifiName} className="pt-field" />
        </Field>
        <SecretInput name="wifiPassword" defaultValue={p.wifiPassword} label="Wifi password" />
      </div>

      <div>
        <h3 className="pt-h3" style={{ marginTop: 6 }}>Helpful things about your home</h3>
        <p className="pt-small">All optional. Whatever you fill in shows up for the crew on every visit.</p>
      </div>
      <div className="pt-grid-2">
        {SERVICE_NOTE_FIELDS.map((f) => (
          <Field key={f.key} label={f.label} help={f.hint}>
            <input name={`sn_${f.key}`} defaultValue={p.serviceNotes[f.key] ?? ""} className="pt-field" />
          </Field>
        ))}
        <Field label="Trash day">
          <input name="trashDay" defaultValue={p.trashDay} className="pt-field" placeholder="Tuesday" />
        </Field>
        <Field label="A/C and HVAC notes">
          <input name="hvacNotes" defaultValue={p.hvacNotes} className="pt-field" placeholder="Filter is in the hall ceiling, 20x25x1" />
        </Field>
      </div>
      <Field label="Anything else">
        <textarea name="notes" defaultValue={p.notes} className="pt-field" rows={3} />
      </Field>

      <div className="pt-btn-row">
        <SubmitButton pending="Saving">{property ? "Save home details" : "Add this home"}</SubmitButton>
        {!property && (
          <button type="button" className="pt-btn pt-btn--ghost" onClick={() => setOpen(false)}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
