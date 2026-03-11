"use client";

function cardClass() {
  return "rounded-[28px] border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]";
}

const exportsList = [
  {
    title: "Orders CSV",
    description: "All order records with customer details, status, totals, dates, and addresses.",
    href: "/api/admin/orders/export.csv",
  },
  {
    title: "Customer Emails CSV",
    description: "Email-first customer list for follow-up, future marketing, and audience building.",
    href: "/api/admin/orders/export.csv?type=emails",
  },
  {
    title: "Customer Contacts CSV",
    description: "Names, emails, phone numbers, and addresses for customer record keeping.",
    href: "/api/admin/orders/export.csv?type=contacts",
  },
  {
    title: "Installed Orders CSV",
    description: "Only completed installs for fulfillment history and proof of completed work.",
    href: "/api/admin/orders/export.csv?status=INSTALLED",
  },
];

export default function PortalExportsPage() {
  return (
    <div className="space-y-8">
      <section className={`${cardClass()} px-7 py-7`}>
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-stone-500">
            Exports
          </div>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-stone-900">
            Data downloads
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            Download clean CSV files for orders, contacts, customer email lists, and fulfillment records.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {exportsList.map((item) => (
          <div key={item.title} className={`${cardClass()} p-7`}>
            <h2 className="font-serif text-2xl text-stone-900">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              {item.description}
            </p>

            <div className="mt-6">
              <a
                href={item.href}
                className="inline-flex items-center justify-center rounded-full bg-stone-900 px-6 py-3 text-xs font-medium uppercase tracking-[0.24em] text-white transition hover:bg-stone-700"
              >
                Download CSV
              </a>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}