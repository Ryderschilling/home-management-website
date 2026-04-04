"use client";

import { useEffect, useState } from "react";
import { siteData, Service } from "@/data/siteData";
import { nanoid } from "nanoid";

// ── Types ──────────────────────────────────────────────────────────────────
interface Lead {
  id: string;
  email: string;
  first_name: string | null;
  status: string;
  source_page: string | null;
  campaign_code: string | null;
  drip_suppressed_at: string | null;
  created_at: string;
}

export default function AdminPage() {
  const [data, setData] = useState(siteData);
  const [services, setServices] = useState<Service[]>([]);
  const [saved, setSaved] = useState(false);

  // ── Leads state ────────────────────────────────────────────────────────
  const [adminPassword, setAdminPassword] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsError, setLeadsError] = useState("");
  const [suppressingId, setSuppressingId] = useState<string | null>(null);
  const [suppressMessages, setSuppressMessages] = useState<Record<string, string>>({});

  async function loadLeads() {
    if (!adminPassword) {
      setLeadsError("Enter your admin password first.");
      return;
    }
    setLeadsLoading(true);
    setLeadsError("");
    try {
      const res = await fetch("/api/marketing/lead", {
        headers: { "x-admin-password": adminPassword },
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Failed");
      setLeads(json.data.leads);
    } catch (e) {
      setLeadsError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLeadsLoading(false);
    }
  }

  async function suppressLead(email: string, id: string) {
    setSuppressingId(id);
    try {
      const res = await fetch("/api/marketing/lead/suppress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error?.message || "Suppress failed");
      const { cancelled, errors } = json.data;
      setSuppressMessages((prev) => ({
        ...prev,
        [id]: `Suppressed — ${cancelled} email(s) cancelled${errors > 0 ? `, ${errors} error(s)` : ""}`,
      }));
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id
            ? { ...l, status: "suppressed", drip_suppressed_at: new Date().toISOString() }
            : l
        )
      );
    } catch (e) {
      setSuppressMessages((prev) => ({
        ...prev,
        [id]: e instanceof Error ? e.message : "Suppress failed",
      }));
    } finally {
      setSuppressingId(null);
    }
  }

  // ── Site/service state ─────────────────────────────────────────────────
  useEffect(() => {
    const storedSite = localStorage.getItem("site-data");
    const storedServices = localStorage.getItem("services");

    if (storedSite) setData(JSON.parse(storedSite));
    setServices(storedServices ? JSON.parse(storedServices) : siteData.services);
  }, []);

  const saveChanges = () => {
    localStorage.setItem("site-data", JSON.stringify(data));
    localStorage.setItem("services", JSON.stringify(services));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updateSiteField = (key: string, value: string) => {
    setSaved(false);
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const updateService = (id: string, key: keyof Service, value: string) => {
    setSaved(false);
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [key]: value } : s))
    );
  };

  const addService = () => {
    setSaved(false);
    setServices((prev) => [
      ...prev,
      { id: nanoid(), title: "New Service", description: "", price: "", image: "" },
    ]);
  };

  const removeService = (id: string) => {
    setSaved(false);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <main className="min-h-screen bg-white px-10 py-14 text-black">
      <div className="max-w-5xl mx-auto space-y-16">

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif">Site Control Center</h1>
            <p className="text-sm text-gray-600">Manage website content and services.</p>
          </div>
          <div className="flex items-center space-x-4">
            {saved && (
              <span className="text-xs uppercase tracking-widest text-green-600">Saved ✓</span>
            )}
            <button
              onClick={saveChanges}
              className="border px-6 py-2 text-xs uppercase tracking-widest hover:bg-black hover:text-white transition"
            >
              Save Changes
            </button>
          </div>
        </header>

        {/* Email Leads */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-medium">Email Leads</h2>
            <p className="text-sm text-gray-500 mt-1">
              View leads from the site popup. Suppress a lead to cancel their drip emails when they convert to a paying client.
            </p>
          </div>

          {/* Password + Load */}
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <label className="block text-xs uppercase tracking-widest text-gray-500">Admin Password</label>
              <input
                type="password"
                className="w-full border px-3 py-2 text-sm"
                placeholder="Enter admin password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadLeads()}
              />
            </div>
            <button
              onClick={loadLeads}
              disabled={leadsLoading}
              className="border px-6 py-2 text-xs uppercase tracking-widest hover:bg-black hover:text-white transition disabled:opacity-40"
            >
              {leadsLoading ? "Loading…" : "Load Leads"}
            </button>
          </div>

          {leadsError && (
            <p className="text-sm text-red-600">{leadsError}</p>
          )}

          {leads.length > 0 && (
            <div className="border divide-y">
              {/* Table header */}
              <div className="grid grid-cols-12 px-4 py-2 bg-gray-50 text-xs uppercase tracking-widest text-gray-500">
                <span className="col-span-3">Email</span>
                <span className="col-span-2">Name</span>
                <span className="col-span-2">Status</span>
                <span className="col-span-2">Source</span>
                <span className="col-span-2">Date</span>
                <span className="col-span-1"></span>
              </div>

              {leads.map((lead) => {
                const isSuppressed = lead.status === "suppressed";
                const msg = suppressMessages[lead.id];
                const isBusy = suppressingId === lead.id;

                return (
                  <div key={lead.id} className="grid grid-cols-12 px-4 py-3 items-center text-sm gap-y-1">
                    <span className="col-span-3 truncate font-mono text-xs">{lead.email}</span>
                    <span className="col-span-2 text-gray-700">{lead.first_name || "—"}</span>
                    <span className="col-span-2">
                      <span
                        className={`text-xs uppercase tracking-wide px-2 py-0.5 ${
                          isSuppressed
                            ? "bg-gray-100 text-gray-400"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {lead.status}
                      </span>
                    </span>
                    <span className="col-span-2 text-gray-500 text-xs">{lead.source_page || "—"}</span>
                    <span className="col-span-2 text-gray-400 text-xs">
                      {new Date(lead.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="col-span-1 text-right">
                      {!isSuppressed ? (
                        <button
                          onClick={() => suppressLead(lead.email, lead.id)}
                          disabled={isBusy}
                          className="text-xs uppercase tracking-wide text-red-600 hover:text-red-800 disabled:opacity-40"
                          title="Cancel their drip emails and mark suppressed"
                        >
                          {isBusy ? "…" : "Suppress"}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">Done</span>
                      )}
                    </span>

                    {msg && (
                      <div className="col-span-12 text-xs text-green-700 pl-0 pt-1">{msg}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {leads.length === 0 && !leadsLoading && !leadsError && (
            <p className="text-sm text-gray-400">No leads loaded yet.</p>
          )}
        </section>

        {/* Site Info */}
        <section className="space-y-6">
          <h2 className="text-xl font-medium">Site Information</h2>

          {Object.entries({
            businessName: data.businessName,
            serviceArea: data.serviceArea,
            startingPrice: data.startingPrice,
            contactEmail: data.contactEmail,
          }).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <label className="block text-sm capitalize">{key}</label>
              <input
                className="w-full border px-3 py-2 text-sm"
                value={value}
                onChange={(e) => updateSiteField(key, e.target.value)}
              />
            </div>
          ))}
        </section>

        {/* Services */}
        <section className="space-y-6">
          <h2 className="text-xl font-medium">Services</h2>

          {services.map((service) => (
            <div key={service.id} className="border p-6 space-y-3">
              <input
                className="w-full border px-3 py-2 text-sm"
                value={service.title}
                onChange={(e) => updateService(service.id, "title", e.target.value)}
                placeholder="Service title"
              />
              <textarea
                className="w-full border px-3 py-2 text-sm"
                value={service.description}
                onChange={(e) => updateService(service.id, "description", e.target.value)}
                placeholder="Description"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="border px-3 py-2 text-sm"
                  value={service.price}
                  onChange={(e) => updateService(service.id, "price", e.target.value)}
                  placeholder="Price"
                />
                <input
                  className="border px-3 py-2 text-sm"
                  value={service.image}
                  onChange={(e) => updateService(service.id, "image", e.target.value)}
                  placeholder="/image.png"
                />
              </div>
              <button
                onClick={() => removeService(service.id)}
                className="text-xs uppercase tracking-wide text-red-600"
              >
                Remove service
              </button>
            </div>
          ))}

          <button
            onClick={addService}
            className="border px-6 py-2 text-xs uppercase tracking-widest hover:bg-black hover:text-white transition"
          >
            Add Service
          </button>
        </section>

        {/* Footer */}
        <a
          href="/"
          className="block text-xs uppercase tracking-widest text-gray-500 hover:text-black"
        >
          ← Back to Website
        </a>
      </div>
    </main>
  );
}
