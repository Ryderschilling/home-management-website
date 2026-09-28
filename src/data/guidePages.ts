// src/data/guidePages.ts
//
// Answer-first guide pages, added 9/27/26 from the GSC query review and a live
// check of Google AI Overviews and Bing. Each page targets a question real 30A
// owners search where the AI answer currently cites a generic national source
// (an HVAC company, a Facebook thread) or no 30A source at all.
//
// Rendered by src/components/GuidePage.tsx. sitemap.ts and llms.txt read
// allGuidePages, so adding a record here adds it everywhere.
//
// Copy rules that apply to every record (see src/data/protection.ts):
// - never call a visit an inspection, never give insurance coverage advice
// - never say CHM does vacation rental management
// - directAnswer is lifted whole by answer engines: standalone, names the
//   business and the place, no pronouns that need the rest of the page
// - no em-dashes

export type GuideSection = {
  heading: string;
  body: string[];
  list?: string[];
  table?: { head: string[]; rows: string[][] };
};

export type GuidePageData = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  lede: string;
  directAnswer: string;
  sections: GuideSection[];
  faqs: { q: string; a: string }[];
  cta: { heading: string; body: string; href: string; label: string };
  related: { href: string; label: string }[];
  mentionsInsurance: boolean;
  datePublished: string;
  dateModified: string;
};

const PUBLISHED = "2026-09-27";

export const allGuidePages: GuidePageData[] = [
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "storm-shutters-30a",
    title: "Who Closes Your Storm Shutters on 30A When You Are Not in Town",
    metaTitle: "Storm Shutters on 30A: Who Closes Them When You're Away",
    metaDescription:
      "Own a second home in Watersound, Alys or Rosemary Beach? Who closes the storm shutters before a hurricane, when to do it, and what to set up before the season.",
    eyebrow: "Hurricane season · Guide",
    lede:
      "Roll-downs, accordions, Bermudas or bolt-on panels, the shutters only help if someone is at the house to close them before the wind arrives. Here is how that works for 30A owners who live somewhere else.",
    directAnswer:
      "On Scenic 30A, storm shutters on a second home are closed by whoever the owner has lined up in advance: a home watch company, a property manager, or a neighbor. Most HOAs in Watersound, Alys Beach and Rosemary Beach do not close them for owners. Coastal Home Management 30A closes every shutter type, including roll-down, accordion, Bermuda and bolt-on storm panels, through its Storm Check service: $100 per storm, or $50 for plan clients, with photos of the home after the storm passes. Owners sign up once before the season and nothing is charged until a storm is coming.",
    sections: [
      {
        heading: "Why the timing is tighter than most owners think",
        body: [
          "The National Hurricane Center issues a hurricane watch about 48 hours before tropical-storm-force winds are expected, and a warning about 36 hours before. Once winds pass roughly 40 mph, climbing a ladder or wrestling a panel is not safe. That leaves a one to two day window, and every contractor and handyman on 30A is booked inside it.",
          "Owners who try to arrange shutter help once the cone points at the Panhandle usually find nobody free. The ones whose shutters get closed are the ones who had someone on a list before June.",
        ],
      },
      {
        heading: "The shutter types on 30A, and what each one takes",
        body: [
          "Coastal architecture on 30A means a mix. Newer homes in Watersound Origins and Naturewalk often have roll-downs or impact glass. Rosemary Beach and Alys Beach lean on hinged Bermuda and colonial styles that also have to be latched down for a storm. Older homes along the corridor still use bolt-on panels.",
        ],
        table: {
          head: ["Type", "What closing it takes", "Set up before the season"],
          rows: [
            ["Motorized roll-down", "Switch or remote, minutes per opening", "Test every motor, know where the manual crank is if power drops"],
            ["Crank roll-down", "A crank rod at each opening", "Leave the rod at the house in a known spot"],
            ["Accordion", "Slide closed and lock at each opening", "Lubricate tracks, confirm every lock and key"],
            ["Bermuda / Bahama and colonial", "Lower or swing closed and secure the hardware", "Check hinges and fasteners, some are decorative only"],
            ["Bolt-on storm panels", "Carry, match and fasten each panel to its opening", "Label every panel by opening, store the wingnuts and a drill with them"],
            ["Impact windows", "Nothing to close", "Confirm every door and slider is the rated glass too"],
          ],
        },
      },
      {
        heading: "What to set up now, while nothing is coming",
        body: ["Ten minutes of setup in the off-season is what makes a storm-day visit fast and safe."],
        list: [
          "Put your home on a storm list with someone local, in writing, before June 1",
          "Label bolt-on panels by window or door, and keep the hardware and a drill with the panels",
          "Make sure whoever is closing them has a key or code, the alarm code, and the garage opener",
          "Test roll-down motors once a year and leave the manual crank at the house",
          "Tell them what to bring inside: patio furniture, grills, planters, kayaks, anything the wind can pick up",
          "Ask for photos after the storm, so you know what the house looks like before you fly back",
        ],
      },
      {
        heading: "How Storm Check works",
        body: [
          "When a named storm is headed for 30A, Ryder confirms with every owner on the list by text or email, then goes house to house: shutters closed, outdoor items in or tied down, doors, windows and the garage latched, and a dated photo of the outside. After the storm passes and the roads are safe, he walks the home inside and out and emails photos with a short written note.",
          "Storm Check does not install or repair shutters. If a shutter is broken or missing hardware, you get photos and a referral to a licensed contractor.",
        ],
      },
    ],
    faqs: [
      {
        q: "Does my HOA close my storm shutters on 30A?",
        a: "Usually not. Most HOAs in Watersound, Alys Beach and Rosemary Beach maintain common areas and leave shutters to each owner. Some communities also have rules about when shutters can go down and how long they can stay closed, so check your HOA's guidelines before the season.",
      },
      {
        q: "When should shutters go down before a hurricane?",
        a: "Once a hurricane watch covers the 30A coast, roughly 48 hours before tropical-storm-force winds, and before winds reach about 40 mph. Waiting for the warning leaves very little working time.",
      },
      {
        q: "Will you close bolt-on storm panels?",
        a: "Yes, Coastal Home Management 30A closes every type, including bolt-on panels, as long as the panels are at the house, labeled by opening, and the hardware is with them. Unlabeled panels on a large house can take hours to match, so labeling them before the season matters.",
      },
      {
        q: "What does it cost to have my shutters closed?",
        a: "Storm Check is $100 per storm for owners not on a plan and $50 per storm for plan clients. That covers the prep visit before the storm and the photo check after. Nothing is charged to sign up.",
      },
      {
        q: "Who opens the shutters after the storm?",
        a: "Tell whoever closed them whether to leave them down until you arrive or open them once the storm has passed. Leaving them closed for weeks in the heat traps humidity, so most owners have them opened after the photo check.",
      },
    ],
    cta: {
      heading: "Put your home on the storm list.",
      body: "Sign up once. Nothing is charged until a storm is coming.",
      href: "/storm-check",
      label: "Storm Check sign-up",
    },
    related: [
      { href: "/closing-your-30a-home-checklist", label: "Closing up your 30A home: the checklist" },
      { href: "/blog/hurricane-season-prep-30a-second-home", label: "Hurricane season prep for 30A second homes" },
      { href: "/ac-humidity-settings-30a-second-home", label: "AC and humidity settings for an empty 30A home" },
    ],
    mentionsInsurance: false,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "ac-humidity-settings-30a-second-home",
    title: "AC and Humidity Settings for an Empty 30A Second Home",
    metaTitle: "AC & Humidity Settings for an Empty 30A Home",
    metaDescription:
      "What temperature and humidity to leave your 30A second home at when nobody is there, why turning the AC off invites mold, and the one part that fails most.",
    eyebrow: "Humidity · Guide",
    lede:
      "The air on 30A is the thing most likely to damage a house that sits empty. Mold, swollen doors and a musty smell almost always trace back to a thermostat setting or an AC that quietly stopped pulling water out of the air.",
    directAnswer:
      "An empty second home on Scenic 30A should keep the air conditioning running, set around 78 to 80°F, with indoor humidity held below 60 percent and ideally near 50. Turning the AC off, or letting an eco or away mode float the house past about 82°F, lets Gulf Coast humidity build fast enough to grow mold within days. The most common failure in a closed-up 30A house is a clogged AC condensate line, which shuts the system off or leaks into the ceiling. Coastal Home Management 30A checks the thermostat, humidity reading and condensate line on every home watch visit.",
    sections: [
      {
        heading: "The settings",
        body: [
          "The Environmental Protection Agency recommends keeping indoor relative humidity below 60 percent, ideally between 30 and 50. On 30A the outdoor air sits well above that most of the year, so the AC is doing two jobs: cooling and pulling water out.",
        ],
        table: {
          head: ["Setting", "Empty 30A home", "Why"],
          rows: [
            ["AC", "On, cool mode", "Off means no dehumidifying at all"],
            ["Temperature", "78 to 80°F", "Warm enough to save money, cool enough to keep running"],
            ["Humidity", "Under 60%, aim for 50%", "Mold needs sustained humidity above about 60%"],
            ["Fan", "Auto, not On", "On blows water back off the coil into the house"],
            ["Eco or away mode", "Off, or capped at 80°F", "Some float the house to 85°F or more"],
            ["Ceiling fans", "Off", "They cool people, not rooms"],
          ],
        },
      },
      {
        heading: "Why cooler is not always drier",
        body: [
          "An AC only removes moisture while it runs. A system that is oversized for the house cools the air in short bursts and shuts off before it pulls much water out, so the house feels cold and clammy. If your thermostat reads 76°F but humidity sits at 65 percent, a lower temperature will not fix it.",
          "Thermostats with a dehumidify setting, or a whole-home dehumidifier on the return, solve that. A smart thermostat that shows humidity lets you watch it from wherever you are.",
        ],
      },
      {
        heading: "The part that fails most: the condensate line",
        body: [
          "Every AC drips water from the coil into a drain line. On the coast that line grows algae and clogs. When it does, a float switch shuts the whole system off, or, on older units, the pan overflows into a ceiling or closet. Either way the house starts climbing in heat and humidity, and nobody knows until someone walks in.",
          "This is the single most common thing a home watch visit catches in a closed-up 30A house. It is also why a humidity number from a smart thermostat is not enough on its own: the thermostat can keep reporting while the unit sits tripped.",
        ],
      },
      {
        heading: "Before you leave",
        body: [],
        list: [
          "Set 78 to 80°F, fan on Auto, and turn off any away mode that lets it float higher",
          "Put in a new HVAC filter",
          "Leave interior doors open so air moves through every room",
          "Crack the cabinet doors under sinks and leave closet doors open",
          "Close the blinds on the sun side of the house",
          "Have the condensate line flushed once or twice a year",
          "Give your home watch company the thermostat app login or show them the humidity reading",
        ],
      },
    ],
    faqs: [
      {
        q: "Should I turn off the AC in my 30A second home when I leave?",
        a: "No. On the Gulf Coast the AC is what keeps humidity down. A house left with the AC off can reach mold-friendly humidity within a few days in summer.",
      },
      {
        q: "What humidity is too high in an empty house?",
        a: "Anything that stays above 60 percent for more than a day or two. Aim for about 50 percent. A hygrometer costs a few dollars and many smart thermostats show humidity directly.",
      },
      {
        q: "Do I need a dehumidifier on 30A?",
        a: "Not always. A correctly sized AC set to 78 to 80°F keeps most homes under 60 percent. If yours reads higher with the AC working, a whole-home dehumidifier on the return, installed by a licensed HVAC contractor, is the fix.",
      },
      {
        q: "How often should someone check an empty house for AC problems?",
        a: "In summer, weekly is the safe interval, because a tripped AC can raise humidity to mold levels in under a week. Every other week works for many homes in the cooler months.",
      },
      {
        q: "What does a home watch visit check on the AC?",
        a: "On every Coastal Home Management 30A visit: the thermostat setting and indoor temperature, the humidity reading, whether the system is actually cooling, the condensate line and float switch, and any water around the air handler. HVAC filter changes are included on Coastal Elite.",
      },
    ],
    cta: {
      heading: "Have someone read the thermostat for you.",
      body: "Weekly and every-other-week visits, with photos and a written report every time. The first home check is free.",
      href: "/pricing",
      label: "See the plans",
    },
    related: [
      { href: "/blog/home-watch-caught-failing-ac-before-mold", label: "How a home watch visit caught a failing AC before mold" },
      { href: "/closing-your-30a-home-checklist", label: "Closing up your 30A home: the checklist" },
      { href: "/storm-shutters-30a", label: "Who closes your storm shutters when you are away" },
    ],
    mentionsInsurance: false,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "closing-your-30a-home-checklist",
    title: "Closing Up Your 30A Second Home: The Checklist",
    metaTitle: "Closing Up Your 30A Second Home: Checklist",
    metaDescription:
      "The checklist for leaving a 30A second home empty for weeks or a season: water, AC, fridge, hurricane prep, mail, keys, and who checks on it while you are gone.",
    eyebrow: "Checklist · Guide",
    lede:
      "Most expensive surprises in an empty 30A house start with something that took thirty seconds to prevent on the way out the door. This is the list, in the order you would walk the house.",
    directAnswer:
      "To close up a second home on Scenic 30A for weeks or a season: keep the AC on at 78 to 80°F with humidity under 60 percent, turn the water heater to vacation or off, shut the main water valve unless irrigation or a smart shutoff valve needs it open, empty or unplug the refrigerator, take out all trash, bring in or secure outdoor furniture during hurricane season (June 1 to November 30), stop or forward the mail, and leave a key, gate code and alarm code with someone local who will check the house on a schedule. Coastal Home Management 30A does these checks every week or every other week with photos after each visit.",
    sections: [
      {
        heading: "Water",
        body: ["Water is the most expensive thing that goes wrong in an empty house, so it goes first."],
        list: [
          "Shut the main water valve, unless the irrigation system or a smart shutoff valve needs the line open",
          "Turn the water heater to vacation mode, or off at the breaker for an electric unit",
          "Turn off the ice maker and the water line to the fridge",
          "Run each toilet and check for a running or weeping fill valve",
          "Look under every sink for drips before you close the cabinet",
        ],
      },
      {
        heading: "Air and humidity",
        body: [],
        list: [
          "AC on, 78 to 80°F, fan on Auto, away mode off or capped at 80°F",
          "New HVAC filter",
          "Interior doors open, cabinet doors under sinks cracked",
          "Blinds closed on the sun side",
        ],
      },
      {
        heading: "Kitchen and trash",
        body: [],
        list: [
          "Empty the refrigerator of anything that spoils, or empty it fully, unplug it and prop the doors open",
          "Run and empty the dishwasher, leave it cracked",
          "Every bag of trash out and the cans rinsed, or someone to roll them out and back",
          "Nothing sweet or open in the pantry, which is how ants and roaches move in",
        ],
      },
      {
        heading: "Outside, and hurricane season",
        body: ["From June 1 to November 30, anything left outside is something a storm can throw through a window."],
        list: [
          "Patio furniture, grills, planters and kayaks inside or tied down",
          "Storm shutters in working order and someone lined up to close them",
          "Gutters and downspouts clear",
          "Irrigation on a schedule that does not flood the yard during rain",
          "Pest control on its regular schedule",
        ],
      },
      {
        heading: "Access and paperwork",
        body: [],
        list: [
          "Mail stopped or forwarded, or someone picking it up",
          "A key, gate code, alarm code and garage opener with someone local",
          "Your contact numbers and preferred contractors written down for that person",
          "Ask your insurance agent what your policy expects while the home is unoccupied",
          "Photos of every room before you leave, so you have a dated record",
        ],
      },
      {
        heading: "Who checks on it while you are gone",
        body: [
          "A closed-up house is only as safe as the last time someone walked through it. The standard on 30A is a visit every week in summer and every other week in the cooler months, with photos, so a leak or a tripped AC gets caught in days rather than months.",
        ],
      },
    ],
    faqs: [
      {
        q: "Should I turn off the water when I leave my 30A home?",
        a: "Usually yes, at the main valve. The exceptions are homes whose irrigation runs off the same line, and homes with a smart shutoff valve, which does the same job automatically and alerts someone when it trips.",
      },
      {
        q: "Should I unplug my refrigerator?",
        a: "If you are gone for a season, empty it, unplug it and prop the doors open so it does not grow mold. For a few weeks, leaving it running with nothing perishable inside is fine.",
      },
      {
        q: "How often should an empty second home on 30A be checked?",
        a: "Weekly in summer and during hurricane season, every other week the rest of the year for most homes. Coastal Home Management 30A offers both, from $200 a month.",
      },
      {
        q: "Do I need to tell my insurance company the house is empty?",
        a: "Some policies have rules about homes left unoccupied for a set period. Ask your agent what yours says. Coastal Home Management 30A is not an insurance agent and cannot advise on coverage.",
      },
    ],
    cta: {
      heading: "Hand us the keys on your way out.",
      body: "A walkthrough every week or every other week, photos and a written report every visit. Plans from $200 a month, first home check free.",
      href: "/pricing",
      label: "See the plans",
    },
    related: [
      { href: "/ac-humidity-settings-30a-second-home", label: "AC and humidity settings for an empty 30A home" },
      { href: "/storm-shutters-30a", label: "Who closes your storm shutters when you are away" },
      { href: "/home-watch-vs-property-management-30a", label: "Home watch vs property management on 30A" },
    ],
    mentionsInsurance: true,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "home-watch-vs-property-management-30a",
    title: "Home Watch vs Property Management on 30A",
    metaTitle: "Home Watch vs Property Management on 30A",
    metaDescription:
      "Searching for property management on 30A? If your home is not rented, you likely need home watch instead. The difference, the cost, and which fits your house.",
    eyebrow: "Buyer's guide",
    lede:
      "Most people searching for property management on 30A own a home that is not a rental. They need someone to look after an empty house, which is a different job with a different price.",
    directAnswer:
      "On Scenic 30A, property management means running a rental: bookings, guests, cleaning turnovers and maintenance, paid as a percentage of rental income. Home watch means looking after a second home that is not rented: scheduled walkthroughs to catch leaks, AC failures, storm damage and pests, paid as a flat monthly fee. Owners who rent their home need a property manager. Owners who keep the home for their own use need home watch. Coastal Home Management 30A is a home watch company, not a vacation rental manager, with plans from $200 a month and photos after every visit.",
    sections: [
      {
        heading: "Side by side",
        body: [],
        table: {
          head: ["", "Home watch", "Property management"],
          rows: [
            ["Who it is for", "Owners who do not rent the home", "Owners who rent it, short or long term"],
            ["What it does", "Scheduled walkthroughs of an empty house, photo reports, storm prep, access for contractors", "Bookings, guest contact, cleaning, turnovers, rent collection, repairs"],
            ["How it is priced", "Flat monthly fee", "A percentage of rental income"],
            ["On 30A", "From $200 a month at Coastal Home Management 30A", "Varies by company and rental volume"],
          ],
        },
      },
      {
        heading: "Why the search results are confusing",
        body: [
          "Search for property management on 30A and nearly every result is a vacation rental company. They are good at what they do, but a rental manager earns its fee from bookings. A house that is never rented gives them nothing to manage, and most are not set up to walk an empty house every week and send you photos.",
          "Home watch grew up to fill that gap. It is its own industry, with its own national association, built around one question: is the house OK while nobody is in it?",
        ],
      },
      {
        heading: "What if you rent it some of the year?",
        body: [
          "Owners who rent for part of the year and use the home the rest often end up with a rental manager during rental months and home watch the rest of the year, or when the rental calendar is empty. Ask your rental manager how often someone walks the house when there are no guests. If the answer is only at turnovers, there can be weeks with nobody inside.",
        ],
      },
      {
        heading: "What home watch looks like with Coastal Home Management 30A",
        body: [
          "Ryder Schilling owns and runs the company from Watersound Origins. Every visit is a walkthrough inside and out, with photos and a written report emailed to you. Plans: Essential, every other week, $200 a month. Home Watch, every week, $300 a month. Coastal Elite, weekly plus storm and freeze checks, arrival prep and contractor coordination, $600 a month. Month to month, with 6 and 12 month rate locks available.",
        ],
      },
    ],
    faqs: [
      {
        q: "Is home watch the same as property management?",
        a: "No. Property management runs a rental. Home watch looks after a home that is not rented, on a set schedule, for a flat monthly fee.",
      },
      {
        q: "Do I need a property manager if I do not rent my 30A home?",
        a: "Usually not. What you need is someone to check the house regularly, handle storm prep and let contractors in. That is home watch.",
      },
      {
        q: "Does Coastal Home Management 30A manage vacation rentals?",
        a: "No. Coastal Home Management 30A is a home watch and second-home care company. For renting or selling a home on 30A, Ryder refers owners to a licensed real estate professional.",
      },
      {
        q: "How much is home watch on 30A compared to property management?",
        a: "Home watch on 30A typically runs about $100 to $600 a month depending on how often someone visits. Coastal Home Management 30A charges $200, $300 or $600. Property management is priced as a share of rental income, so it only makes sense when the home earns rent.",
      },
    ],
    cta: {
      heading: "Not renting it? Start with a free home check.",
      body: "Ryder walks the house and emails you photos and a written condition report. You do not need to be in town.",
      href: "/pricing",
      label: "See the plans",
    },
    related: [
      { href: "/choosing-a-home-watch-company-30a", label: "How to choose a home watch company on 30A" },
      { href: "/blog/how-much-does-home-watch-cost-30a", label: "How much does home watch cost on 30A?" },
      { href: "/closing-your-30a-home-checklist", label: "Closing up your 30A home: the checklist" },
    ],
    mentionsInsurance: false,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
  },
];

export function getGuidePage(slug: string): GuidePageData {
  const page = allGuidePages.find((p) => p.slug === slug);
  if (!page) throw new Error(`Unknown guide page: ${slug}`);
  return page;
}
