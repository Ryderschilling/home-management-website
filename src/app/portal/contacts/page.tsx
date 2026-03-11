"use client";

import { useEffect, useMemo, useState } from "react";

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

type Order = {
  id: string;
  client_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  total_amount_cents?: number | null;
  created_at?: string | null;
  fulfillment_status?: string | null;
};

type ContactRow = {
  email: string;
  name: string;
  phone: string;
  source: "CLIENT" | "ORDER" | "CLIENT+ORDER";
  totalSpendCents: number;
  orderCount: number;
  lastOrderDate: string | null;
};

function cardClass() {
  return "rounded-[28px] border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]";
}

function inputClassName() {
  return "w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-sm text-stone-900";
}

function money(cents: number | null | undefined) {
  const n = typeof cents === "number" ? cents : 0;
  return `$${(n / 100).toFixed(2)}`;
}

function fmtDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function csvEscape(value: string) {
  const v = value ?? "";
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export default function PortalContactsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const [clientsRes, ordersRes] = await Promise.all([
        fetch("/api/admin/clients"),
        fetch("/api/admin/orders"),
      ]);

      const clientsJson = await clientsRes.json();
      const ordersJson = await ordersRes.json();

      if (!clientsRes.ok || !clientsJson.ok) {
        throw new Error(clientsJson?.error?.message ?? "Failed to load clients");
      }

      if (!ordersRes.ok || !ordersJson.ok) {
        throw new Error(ordersJson?.error?.message ?? "Failed to load orders");
      }

      setClients(clientsJson.data ?? []);
      setOrders(ordersJson.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const contacts = useMemo(() => {
    const map = new Map<string, ContactRow>();

    for (const client of clients) {
      const email = String(client.email ?? "").trim().toLowerCase();
      if (!email) continue;

      map.set(email, {
        email,
        name: client.name?.trim() || "—",
        phone: client.phone?.trim() || "—",
        source: "CLIENT",
        totalSpendCents: 0,
        orderCount: 0,
        lastOrderDate: null,
      });
    }

    for (const order of orders) {
      const email = String(order.customer_email ?? "").trim().toLowerCase();
      if (!email) continue;

      const existing = map.get(email);

      const orderAmount =
        typeof order.total_amount_cents === "number" ? order.total_amount_cents : 0;

      const orderDate = order.created_at ?? null;

      if (!existing) {
        map.set(email, {
          email,
          name: String(order.customer_name ?? "").trim() || "—",
          phone: String(order.customer_phone ?? "").trim() || "—",
          source: "ORDER",
          totalSpendCents: orderAmount,
          orderCount: 1,
          lastOrderDate: orderDate,
        });
        continue;
      }

      const nextName =
        existing.name === "—" && String(order.customer_name ?? "").trim()
          ? String(order.customer_name ?? "").trim()
          : existing.name;

      const nextPhone =
        existing.phone === "—" && String(order.customer_phone ?? "").trim()
          ? String(order.customer_phone ?? "").trim()
          : existing.phone;

      const existingTime = existing.lastOrderDate
        ? new Date(existing.lastOrderDate).getTime()
        : 0;

      const incomingTime = orderDate ? new Date(orderDate).getTime() : 0;

      map.set(email, {
        ...existing,
        name: nextName,
        phone: nextPhone,
        source: existing.source === "CLIENT" ? "CLIENT+ORDER" : existing.source,
        totalSpendCents: existing.totalSpendCents + orderAmount,
        orderCount: existing.orderCount + 1,
        lastOrderDate: incomingTime > existingTime ? orderDate : existing.lastOrderDate,
      });
    }

    return Array.from(map.values()).sort((a, b) => {
      const aSpend = a.totalSpendCents ?? 0;
      const bSpend = b.totalSpendCents ?? 0;
      if (bSpend !== aSpend) return bSpend - aSpend;
      return a.email.localeCompare(b.email);
    });
  }, [clients, orders]);

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;

    return contacts.filter((contact) => {
      const haystack = [
        contact.name,
        contact.email,
        contact.phone,
        contact.source,
        String(contact.orderCount),
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" • ");

      return haystack.includes(q);
    });
  }, [contacts, search]);

  const stats = useMemo(() => {
    return {
      totalContacts: contacts.length,
      buyers: contacts.filter((c) => c.orderCount > 0).length,
      clientOnly: contacts.filter((c) => c.source === "CLIENT").length,
      totalRevenue: contacts.reduce((sum, c) => sum + (c.totalSpendCents ?? 0), 0),
    };
  }, [contacts]);

  function downloadCsv() {
    const rows = [
      [
        "Name",
        "Email",
        "Phone",
        "Source",
        "Order Count",
        "Total Spend",
        "Last Order Date",
      ],
      ...filteredContacts.map((contact) => [
        contact.name,
        contact.email,
        contact.phone,
        contact.source,
        String(contact.orderCount),
        (contact.totalSpendCents / 100).toFixed(2),
        contact.lastOrderDate ?? "",
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => csvEscape(cell)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts-export.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <section className={`${cardClass()} px-7 py-7`}>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
              Contacts
            </div>
            <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-900">
              Email list
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
              View all known customer and client emails in one place and export them for outreach.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Total contacts
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {stats.totalContacts}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Buyers
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {stats.buyers}
              </div>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                Revenue tracked
              </div>
              <div className="mt-2 text-2xl font-semibold text-stone-900">
                {money(stats.totalRevenue)}
              </div>
            </div>

            <button
              onClick={downloadCsv}
              className="rounded-full bg-stone-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-white transition hover:bg-stone-700"
            >
              Download CSV
            </button>
          </div>
        </div>

        <div className="mt-6">
          <input
            className={inputClassName()}
            placeholder="Search name, email, phone, source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <section className={cardClass()}>
        <div className="border-b border-stone-200 px-7 py-5">
          <h2 className="text-lg font-semibold text-stone-900">Contacts</h2>
          <p className="text-sm text-stone-500">
            {loading ? "Loading..." : `${filteredContacts.length} visible contacts`}
          </p>
        </div>

        {filteredContacts.length === 0 ? (
          <div className="px-7 py-10 text-sm text-stone-500">
            {loading ? "Loading contacts..." : "No contacts found."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full text-left">
              <thead className="border-b border-stone-200 bg-stone-50">
                <tr className="text-[11px] uppercase tracking-[0.22em] text-stone-500">
                  <th className="px-5 py-4 font-medium">Name</th>
                  <th className="px-5 py-4 font-medium">Email</th>
                  <th className="px-5 py-4 font-medium">Phone</th>
                  <th className="px-5 py-4 font-medium">Source</th>
                  <th className="px-5 py-4 font-medium">Orders</th>
                  <th className="px-5 py-4 font-medium">Total Spend</th>
                  <th className="px-5 py-4 font-medium">Last Order</th>
                </tr>
              </thead>

              <tbody>
                {filteredContacts.map((contact) => (
                  <tr key={contact.email} className="border-b border-stone-100 align-top">
                    <td className="px-5 py-5 text-sm font-medium text-stone-900">
                      {contact.name}
                    </td>

                    <td className="px-5 py-5 text-sm text-stone-700">
                      {contact.email}
                    </td>

                    <td className="px-5 py-5 text-sm text-stone-700">
                      {contact.phone}
                    </td>

                    <td className="px-5 py-5">
                      <span className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-stone-700">
                        {contact.source}
                      </span>
                    </td>

                    <td className="px-5 py-5 text-sm text-stone-700">
                      {contact.orderCount}
                    </td>

                    <td className="px-5 py-5 text-sm font-medium text-stone-900">
                      {money(contact.totalSpendCents)}
                    </td>

                    <td className="px-5 py-5 text-sm text-stone-700">
                      {fmtDate(contact.lastOrderDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}