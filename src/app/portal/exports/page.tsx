"use client";

const exportsList = [
  { title: "Orders CSV", description: "All order records with customer details, status, totals, dates, and addresses.", href: "/api/admin/orders/export.csv" },
  { title: "Customer Emails CSV", description: "Email-first customer list for follow-up, future marketing, and audience building.", href: "/api/admin/orders/export.csv?type=emails" },
  { title: "Customer Contacts CSV", description: "Names, emails, phone numbers, and addresses for customer record keeping.", href: "/api/admin/orders/export.csv?type=contacts" },
  { title: "Installed Orders CSV", description: "Only completed installs for fulfillment history and proof of completed work.", href: "/api/admin/orders/export.csv?status=INSTALLED" },
];

export default function PortalExportsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-7 py-7">
        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>Exports</div>
        <h1 style={{ fontFamily: "var(--font-serif), 'Instrument Serif', serif", fontSize: 32, color: "var(--text-primary)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>Data downloads</h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8, fontWeight: 300, maxWidth: 480 }}>Download clean CSV files for orders, contacts, customer email lists, and fulfillment records.</p>
      </section>
      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {exportsList.map((item) => (
          <div key={item.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7">
            <h2 style={{ fontFamily: "var(--font-serif), 'Instrument Serif', serif", fontSize: 22, color: "var(--text-primary)" }}>{item.title}</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 10, lineHeight: 1.6, fontWeight: 300 }}>{item.description}</p>
            <div className="mt-6">
              <a href={item.href} className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-[#0e0e0f] transition hover:brightness-110">Download CSV</a>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
