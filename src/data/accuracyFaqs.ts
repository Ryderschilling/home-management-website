// src/data/accuracyFaqs.ts
/* Straight answers to the questions AI engines were getting wrong about CHM
 * (AI Syndicate Hallucination Watch, 10/6/26: a Boca Raton office address,
 * "vacation rental management", no $35/day mail rate). Rendered in the visible
 * FAQ AND in the FAQPage schema below from this one array, so they never drift.
 * Facts come from offerings in siteData.ts and src/data/protection.ts. */
export const ACCURACY_FAQS: { q: string; a: string }[] = [
  {
    q: "What is included in the Coastal Elite plan?",
    a: "Coastal Elite is our highest tier at $600/month ($570 on a 6-month rate lock, $540 on a 12-month rate lock, billed monthly). It includes visits tailored to your home's needs rather than locked to every week, with photos and a written report every visit, every Home Watch check, storm and freeze checks, HVAC filter changes, pre-arrival prep, contractor coordination, guaranteed 2-hour emergency response, and Ryder's direct line. It is limited to 8 homes.",
  },
  {
    q: "Do you manage vacation rentals?",
    a: "No. Coastal Home Management 30A does not manage vacation rentals: no bookings, no guest turnovers, no rental cleaning coordination. We look after second homes for owners who are away, on a weekly or bi-weekly home watch schedule, in Watersound Origins, Alys, Rosemary, and scenic 30A.",
  },
  {
    q: "Where is Coastal Home Management 30A located?",
    a: "Coastal Home Management 30A is based in Inlet Beach, Florida 32461, and owner Ryder Schilling lives in Watersound Origins. The business has no other office. Every visit is made locally across Watersound Origins, Alys, Rosemary, and scenic 30A.",
  },
  {
    q: "Do you handle mail and trash while I'm away?",
    a: "Yes. Mail collection and trash takeout and return are $35/day as an add-on, and mail pickup is already part of the Essential and Home Watch plans.",
  },
  {
    q: "Do you offer water shutoff protection?",
    a: "Yes. Water Shutoff Protection is a smart shutoff valve installed on your main water line by a licensed plumber. It closes the line by itself when it detects a burst or a running leak, and the alert comes to us so someone local goes to the house. It is $1,295 installed, then $35/month for alert response. Several carriers publish a premium credit for an automatic shutoff device. Ask your agent whether yours is one of them.",
  },
  {
    q: "What is the Annual Coverage Record?",
    a: "Once a year we compile every visit to your home into one dated document: what was checked, what was found, and the photos, in order, including the areas that were dry and fine. It comes as one PDF you can forward to your agent. It is $195/year.",
  },
];
