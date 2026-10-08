// src/data/stormGuidePages.ts
//
// Storm prep guide cluster, added 10/8/26 while Hurricane Isaias was headed for
// the Panhandle. Same GuidePage layout and schema as src/data/guidePages.ts,
// which spreads these records into allGuidePages (so sitemap.ts and llms.txt
// pick them up automatically).
//
// The live news page is separate: src/app/hurricane-isaias-updates.
//
// Copy rules (see src/data/protection.ts): never call a visit an inspection,
// never give insurance coverage advice, never say CHM does vacation rental
// management, no em-dashes. Storm Check pricing is stated only as it appears on
// /storm-check, so the two pages never disagree.

import type { GuidePageData } from "./guidePages";

const PUBLISHED = "2026-10-08";

export const stormGuidePages: GuidePageData[] = [
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "storm-prep-30a",
    title: "Storm Prep for 30A Homeowners: What to Do Before a Hurricane",
    metaTitle: "Storm Prep for 30A Homeowners | Before a Hurricane",
    metaDescription:
      "Hurricane prep for 30A homes in Watersound, Inlet Beach, Alys and Rosemary: the 48-hour window, the outside checklist, the inside checklist, and who does it if you are not in town.",
    eyebrow: "Hurricane season · Storm prep",
    lede:
      "Most storm damage on 30A starts with something small: a chair through a slider, a gutter that backed up, a door that was never latched. Here is the order to do things in, and what to do if you are not here to do it.",
    directAnswer:
      "Storm prep for a home on Scenic 30A happens in the 48 hours after the National Hurricane Center issues a hurricane watch for the Panhandle coast and before winds reach about 40 mph. The outside comes first: bring in or tie down patio furniture, grills, planters and anything loose, close storm shutters, latch every door, window and the garage, and clear gutters and drains. Inside, unplug electronics, move valuables off the floor, set the refrigerator to its coldest setting, and photograph every room so there is a dated before record. Owners who are out of town use a local home watch company. Coastal Home Management 30A, based in Watersound Origins, preps homes from Inlet Beach to Rosemary Beach through its Storm Check service, and storm and freeze checks are part of its Coastal Elite plan.",
    sections: [
      {
        heading: "The window is shorter than it looks",
        body: [
          "A hurricane watch goes up roughly 48 hours before tropical-storm-force winds are expected, and a warning roughly 36 hours before. Once sustained winds pass about 40 mph, ladders, shutters and patio furniture are no longer safe work. In practice that leaves a day and a half, and every handyman, landscaper and contractor on 30A is booked inside it.",
          "The homes that come through cleanly are almost always the ones where someone already had the plan, the keys and the codes before the cone turned toward the Panhandle.",
        ],
      },
      {
        heading: "Outside the house",
        body: ["Wind turns anything loose into something that breaks glass. Start here."],
        list: [
          "Bring patio furniture, cushions, umbrellas, grills, planters and toys inside or into the garage",
          "Tie down or lay flat anything too heavy to move, and stack it against a wall out of the wind",
          "Close storm shutters at every opening: roll-down, accordion, Bermuda or bolt-on panels",
          "Latch every door and window, and make sure the garage door is fully down and locked",
          "Clear gutters, downspouts and yard drains so rain has somewhere to go",
          "Take outdoor TVs, speakers and remotes inside",
          "Photograph every side of the house so you have a dated before picture",
        ],
      },
      {
        heading: "Inside the house",
        body: ["The inside list is about power loss, water and having a record."],
        list: [
          "Unplug TVs, computers and small appliances to protect them from surges",
          "Set the refrigerator and freezer to their coldest settings, and empty what you can",
          "Move rugs, electronics and anything valuable off the floor on the ground level",
          "Close interior doors to slow wind if a window does fail",
          "If the home will sit empty, consider shutting off the main water valve so a broken line cannot run for days",
          "Photograph every room, including closets and under sinks",
          "Leave a key, the alarm code and the garage opener with whoever will check the house after",
        ],
      },
      {
        heading: "If you are not in town",
        body: [
          "Most 30A homes are second homes, so most storm prep is done by someone other than the owner. HOAs in Watersound, Alys Beach and Rosemary Beach generally maintain common areas and leave each house to its owner. That leaves a home watch company, a property manager, a neighbor, or nobody.",
          "Coastal Home Management 30A preps homes before a named storm through Storm Check, then walks the home inside and out once roads are open and sends photos with a written note. Plan clients never have to ask: storm and freeze checks are part of Coastal Elite, and every plan home is already on the list with its keys, codes and quirks on file.",
        ],
      },
      {
        heading: "Why owners move to year-round care after a storm",
        body: [
          "The scramble is the same every time: who has a key, who knows the alarm code, who knows the shutters are in the garage loft. A year-round plan answers all of that before June. The person who walks the house every visit is the same person who preps it before a storm and checks it after, so nothing has to be explained under pressure.",
        ],
      },
    ],
    faqs: [
      {
        q: "When should I start storm prep on 30A?",
        a: "As soon as a hurricane watch covers the Panhandle coast, roughly 48 hours before tropical-storm-force winds. Waiting for the warning leaves about a day of working time, and help on 30A is booked by then.",
      },
      {
        q: "Should I turn off the water at an empty second home before a hurricane?",
        a: "Many owners do. Shutting off the main valve means a line that breaks during the storm cannot run for days before anyone sees it. If the home has irrigation or a pool that needs water, tell whoever is prepping the house so they know what to leave on.",
      },
      {
        q: "Does my HOA prep my house for a storm?",
        a: "Usually not. Most HOAs on 30A maintain common areas and leave furniture, shutters and doors to each owner. Some communities have rules about when shutters can go down, so check before the season.",
      },
      {
        q: "Who preps 30A homes for owners who live somewhere else?",
        a: "Coastal Home Management 30A does, from Inlet Beach and Watersound Origins to Rosemary Beach and Alys Beach, through Storm Check. Storm and freeze checks are included on the Coastal Elite plan.",
      },
      {
        q: "What should I photograph before a storm?",
        a: "Every side of the house, the roof line from the ground, every room, and the inside of closets and under sinks. Dated photos make it easy to show what changed after the storm.",
      },
    ],
    cta: {
      heading: "Never think about storm prep again.",
      body: "Plan homes are already on the storm list, keys and codes on file. Prep before, photos after.",
      href: "/pricing",
      label: "See the plans",
    },
    related: [
      { href: "/hurricane-isaias-updates", label: "Hurricane Isaias updates for 30A, refreshed every few minutes" },
      { href: "/who-to-call-storm-prep-30a", label: "Who to call to prep your 30A second home" },
      { href: "/vacation-home-storm-prep-30a", label: "Storm prep for a vacation home you are not at" },
      { href: "/storm-shutters-30a", label: "Who closes your storm shutters when you are away" },
    ],
    mentionsInsurance: false,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "vacation-home-storm-prep-30a",
    title: "Hurricane Prep for a 30A Vacation Home You Are Not At",
    metaTitle: "Vacation Home Hurricane Prep on 30A | From Out of Town",
    metaDescription:
      "Own a vacation home on 30A and live somewhere else? How to get it prepped for a hurricane from out of town, what to leave on, what to shut off, and how to see it after.",
    eyebrow: "Hurricane season · Vacation homes",
    lede:
      "You are in Atlanta, Nashville or Dallas, the cone is pointed at the Panhandle, and the house is sitting there with the patio set out. This is how owners handle it from out of town.",
    directAnswer:
      "A vacation home on Scenic 30A gets prepped for a hurricane by someone local acting for the owner, usually a home watch company. The prep is the same as for a lived-in home: outdoor furniture in or tied down, shutters closed, doors, windows and the garage latched, electronics unplugged, and photos taken. The differences for an empty vacation home are what to shut off (many owners close the main water valve), what to leave on (refrigerator, and often the AC so the house does not sit humid if power holds), and who checks it after, since nobody will be there to notice a leak. Coastal Home Management 30A preps vacation and second homes from Inlet Beach to Rosemary Beach before a named storm and sends photos after it passes. Coastal Home Management 30A does not manage vacation rentals.",
    sections: [
      {
        heading: "What is different about an empty house",
        body: [
          "A home with people in it has someone to notice a drip, a tripped breaker or a door that blew open. A vacation home has nobody until the next check. That changes the prep: the goal is not just getting through the storm, it is making sure that whatever does go wrong cannot keep going wrong for days.",
        ],
        list: [
          "Water: decide before the storm whether the main valve gets shut off. A broken line in an empty house can run until someone walks in",
          "Power: if power drops, an empty house in October heat climbs in humidity fast. Know who will check the AC once power is back",
          "Food: set the fridge and freezer to coldest, and decide whether to empty them now rather than find them later",
          "Access: whoever preps the house needs the key or code, the alarm code, the garage opener and the gate code",
        ],
      },
      {
        heading: "What to send whoever is prepping the house",
        body: ["One text with all of this saves a phone call in the middle of a storm watch."],
        list: [
          "Address, gate code, door code or key location, alarm code",
          "Where the shutters, panels and hardware are stored",
          "What should come inside and what can be tied down",
          "Whether to shut off the water, and anything that must stay on (irrigation, pool, a well pump)",
          "Whether guests or renters are booked around the storm",
          "Who to call if something is damaged, and your preferred contractors",
        ],
      },
      {
        heading: "After the storm, from out of town",
        body: [
          "Once Walton County reopens the roads, the first useful thing is a walkthrough with photos: every side of the house, the roof line from the ground, every room, the AC, and any water inside. That tells you whether you need to fly in, call a contractor, or do nothing at all.",
          "Coastal Home Management 30A sends those photos by email with a short written note, the same day the check happens. Repairs go to licensed contractors. The owner decides what happens next.",
        ],
      },
      {
        heading: "The owners who do not scramble",
        body: [
          "Owners on a year-round plan get a visit on a schedule all year, so the house is known before a storm ever shows up: where the panels are, which door sticks, which drain backs up. When a storm comes, there is nothing to arrange. On Coastal Elite, storm and freeze checks are included.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can I get my 30A vacation home prepped for a hurricane if I live out of state?",
        a: "Yes. Coastal Home Management 30A preps second and vacation homes for owners who are somewhere else when a storm is coming. Everything is confirmed by text or email and the photos come to your inbox.",
      },
      {
        q: "Should I leave the AC on in an empty vacation home during a hurricane?",
        a: "Most owners leave it set where it normally sits for an empty house, around 78 to 80 degrees, so the home is not sitting humid if power holds. Unplug electronics, and have someone check that the system restarted once power returns.",
      },
      {
        q: "Do you manage vacation rentals?",
        a: "No. Coastal Home Management 30A does home watch and second home care for owners. If your home is a rental, your rental manager handles guests, and we can still prep and check the house for you.",
      },
      {
        q: "How do I know my vacation home is okay after the storm?",
        a: "Have someone local walk it inside and out once roads are open and send dated photos. Coastal Home Management 30A emails photos and a written note after every check.",
      },
    ],
    cta: {
      heading: "Put the house on the list.",
      body: "Sign up once for Storm Check, or move to a plan and stop thinking about it.",
      href: "/storm-check",
      label: "Storm Check sign-up",
    },
    related: [
      { href: "/hurricane-isaias-updates", label: "Hurricane Isaias updates for 30A" },
      { href: "/storm-prep-30a", label: "Storm prep for 30A homeowners" },
      { href: "/after-hurricane-isaias-30a", label: "After Hurricane Isaias: checking on your 30A home" },
      { href: "/vacation-home-care-30a", label: "Vacation home care on 30A" },
    ],
    mentionsInsurance: false,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "who-to-call-storm-prep-30a",
    title: "Who to Call to Prep Your 30A Second Home for a Hurricane",
    metaTitle: "Who Preps 30A Second Homes for Hurricanes | Who to Call",
    metaDescription:
      "Need your 30A vacation or second home prepped before a hurricane? Who actually does it, what each option covers, and the local numbers to have saved: Watersound, Inlet Beach, Alys, Rosemary.",
    eyebrow: "Hurricane season · Who to call",
    lede:
      "When a storm is two days out, the question every out-of-town owner asks is the same: who can get to my house. Here is who does this on 30A, what each one covers, and the numbers to keep.",
    directAnswer:
      "To get a second home or vacation home on Scenic 30A prepped for a hurricane, call a local home watch company, the home's property manager if it has one, or a trusted neighbor. HOAs on 30A generally do not prep individual homes. Coastal Home Management 30A, owned by Ryder Schilling and based in Watersound Origins, preps second homes from Inlet Beach and Watersound to Alys Beach and Rosemary Beach before a named storm: outdoor items in or secured, shutters closed, doors, windows and garage latched, and dated photos. After the storm passes it walks the home and emails photos. Call or text (309) 415-8793, or sign up at coastalhomemngt30a.com/storm-check. The earlier the call, the better the odds of a spot.",
    sections: [
      {
        heading: "Who does what",
        body: [
          "Every option below works. What separates them is whether they will actually come to your house in the 36 hours before landfall, and whether they will come back after.",
        ],
        table: {
          head: ["Who", "Before the storm", "After the storm"],
          rows: [
            ["Home watch company", "Furniture in, shutters closed, doors and garage latched, photos", "Walkthrough inside and out, photos and a written note by email"],
            ["Property manager", "Depends on the contract. Rental-focused managers prioritize booked units", "Usually a check, timing depends on their portfolio"],
            ["HOA", "Common areas only, in most 30A communities", "Common areas only"],
            ["Neighbor", "Whatever they can get to before they leave", "Only if they stayed or come back first"],
            ["Handyman or contractor", "Shutter installs and repairs, booked solid before a storm", "Repairs, once you know what broke"],
          ],
        },
      },
      {
        heading: "Coastal Home Management 30A",
        body: [
          "Ryder Schilling lives in Watersound Origins and runs the company himself. Before a named storm, every home on the list gets the outside prepped and photographed. After the storm, once Walton County says roads are safe, each home gets walked inside and out and the owner gets photos and a short note the same day.",
          "Homes on a plan are already on the list, with keys, codes and the location of the shutters on file, and storm and freeze checks are included on Coastal Elite. Homes not on a plan can sign up through Storm Check, $100 per storm.",
        ],
        directory: [
          {
            name: "Coastal Home Management 30A",
            url: "https://coastalhomemngt30a.com/storm-check",
            kind: "Home watch · storm prep and after-storm photos",
            areas: "Inlet Beach, Watersound Origins, Watersound, Naturewalk, Alys Beach, Rosemary Beach, Seacrest, scenic 30A",
            note: "Call or text (309) 415-8793. Sign up once, nothing charged until a storm is coming.",
          },
        ],
      },
      {
        heading: "Numbers and sites to keep saved",
        body: ["These are the official sources Coastal Home Management 30A watches during a storm."],
        directory: [
          {
            name: "National Hurricane Center",
            url: "https://www.nhc.noaa.gov/",
            kind: "Forecast and advisories",
            areas: "Atlantic and Gulf",
            note: "The official track, cone and storm surge maps. New advisories every 3 to 6 hours.",
          },
          {
            name: "NWS Tallahassee",
            url: "https://www.weather.gov/tae/",
            kind: "Local forecast office",
            areas: "Walton and Bay counties",
            note: "The office that issues warnings for South Walton and coastal Bay County.",
          },
          {
            name: "Walton County",
            url: "https://www.co.walton.fl.us/",
            kind: "County government",
            areas: "South Walton, 30A",
            note: "Evacuation orders, shelters, sandbag sites and road reopening.",
          },
          {
            name: "Know Your Zone",
            url: "https://www.floridadisaster.org/knowyourzone/",
            kind: "Florida Division of Emergency Management",
            areas: "Statewide",
            note: "Look up your home's evacuation zone by address.",
          },
          {
            name: "South Walton Fire District",
            url: "https://swfd.org/",
            kind: "Fire and rescue",
            areas: "South Walton",
            note: "Beach flag status and local safety updates. Call 911 for emergencies.",
          },
          {
            name: "FPL outages",
            url: "https://www.fpl.com/outage.html",
            kind: "Power",
            areas: "Northwest Florida",
            note: "Report and track outages. Some 30A homes are served by a co-op instead, check your bill.",
          },
        ],
      },
      {
        heading: "Call before the cone, not after",
        body: [
          "Every storm, the calls come in once the warning goes up, and by then the list is full. The owners who are never stuck are the ones who set this up in the off-season, or who are on a plan where it is already done. If a storm is close right now, call or text anyway. If there is room, you are on the list.",
        ],
      },
    ],
    faqs: [
      {
        q: "Who can prep my 30A vacation home for a hurricane?",
        a: "A local home watch company is the most reliable option. Coastal Home Management 30A preps second and vacation homes from Inlet Beach to Rosemary Beach before a named storm and sends photos after it passes. Call or text (309) 415-8793.",
      },
      {
        q: "How much does hurricane prep cost for a second home on 30A?",
        a: "Coastal Home Management 30A's Storm Check is $100 per storm for homes not on a plan. Storm and freeze checks are included on the Coastal Elite plan.",
      },
      {
        q: "Is it too late to get my house prepped if the storm is two days out?",
        a: "Not always. Call or text as early as you can. Spots fill once a hurricane watch goes up, and prep has to be finished before winds reach about 40 mph.",
      },
      {
        q: "Will you fix damage after the storm?",
        a: "No. Coastal Home Management 30A does the prep and the after-storm photo check. If something needs repair, you get the photos and a referral to a licensed contractor.",
      },
    ],
    cta: {
      heading: "Get on the list.",
      body: "Text the address and a key or code. If there is room before the storm, you are in.",
      href: "/storm-check",
      label: "Storm Check sign-up",
    },
    related: [
      { href: "/hurricane-isaias-updates", label: "Hurricane Isaias updates for 30A" },
      { href: "/storm-prep-30a", label: "Storm prep for 30A homeowners" },
      { href: "/storm-shutters-30a", label: "Who closes your storm shutters when you are away" },
      { href: "/pricing", label: "Year-round plans and pricing" },
    ],
    mentionsInsurance: false,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
  },

  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "after-hurricane-isaias-30a",
    title: "After Hurricane Isaias: Checking on Your 30A Second Home",
    metaTitle: "After Hurricane Isaias | Checking Your 30A Second Home",
    metaDescription:
      "Hurricane Isaias has passed 30A. What to check at your second home, in what order, what an empty house needs in the days after, and how to get photos if you are not in town.",
    eyebrow: "Hurricane Isaias · After the storm",
    lede:
      "The storm is gone and the house has been sitting alone through it. Here is what to check, in order, and how owners who are not in town find out what happened.",
    directAnswer:
      "After Hurricane Isaias, a second home on Scenic 30A should be checked as soon as Walton County reopens roads and it is safe to travel. The check covers every side of the house and the roof line from the ground, windows, doors and the garage, any water inside, ceilings for stains, the AC and indoor humidity, the refrigerator if power was out, and gutters, drains and the yard for debris. Every finding should be photographed with the date. Owners who are out of town have a local home watch company do the walkthrough. Coastal Home Management 30A, based in Watersound Origins, walks second homes from Inlet Beach to Rosemary Beach after a storm and emails dated photos with a written note the same day. Repairs go to licensed contractors.",
    sections: [
      {
        heading: "Wait for the all clear",
        body: [
          "Downed power lines, standing water and debris do most of the harm after a storm passes. Do not go out until Walton County or Bay County says roads are open, and treat every downed line as live. The house can wait a few hours. The order below assumes it is safe to be there.",
        ],
      },
      {
        heading: "The after-storm walkthrough, in order",
        body: ["Outside first, then in. Photograph everything, including what is fine."],
        list: [
          "Walk every side of the house and look at the roof line from the ground for missing shingles, metal or tiles",
          "Check windows, sliders, doors and the garage door for damage or anything that blew open",
          "Look for water on floors, around doors and windows, and under sinks",
          "Look up: ceiling stains on the top floor usually mean roof or flashing damage",
          "Check that the AC is running and the house is not climbing in humidity, especially if power was out",
          "Open the refrigerator and freezer if power was out for more than a few hours",
          "Clear gutters, drains and the yard of debris, and note any trees or limbs on the house",
          "Put outdoor furniture back only once the forecast is clear",
        ],
      },
      {
        heading: "Why the days after matter for an empty house",
        body: [
          "A small roof leak or a wet carpet in an empty, humid house turns into a mold problem within days. If power went out, the AC is off and the house is closed up in October heat. The faster someone walks in after the storm, the smaller the problem stays.",
          "A dated photo record also matters. It shows what the house looked like before and after, which is useful for contractors and for any conversation with your insurance agent or adjuster. Coastal Home Management 30A does not give coverage advice, but the photos are yours to share.",
        ],
      },
      {
        heading: "If you are not in town",
        body: [
          "Coastal Home Management 30A walks homes inside and out after the storm, once roads are safe, and sends photos with a short written note the same day. If something needs repair, you get the photos and a referral to a licensed contractor. Nothing is fixed without your say.",
          "Homes on a plan are checked first and automatically. If you rode out Isaias wondering who would look at your house, that is what a year-round plan solves: same person, every visit, before and after every storm.",
        ],
      },
    ],
    faqs: [
      {
        q: "When can I check my 30A home after Hurricane Isaias?",
        a: "Once Walton County or Bay County says roads are open and it is safe to travel. Check the county site and local news before heading out, and stay clear of downed lines.",
      },
      {
        q: "Can someone check my 30A second home after the storm if I am out of town?",
        a: "Yes. Coastal Home Management 30A walks second homes inside and out after a storm and emails dated photos with a written note the same day. Call or text (309) 415-8793.",
      },
      {
        q: "What should I look for after a hurricane at an empty house?",
        a: "Roof damage seen from the ground, broken windows or doors, water inside, ceiling stains, whether the AC is running, food spoilage if power was out, and debris in gutters and drains. Photograph everything with the date.",
      },
      {
        q: "Do you do repairs after the storm?",
        a: "No. Coastal Home Management 30A does the walkthrough and photos. Repairs go to licensed contractors, and the owner decides what happens.",
      },
      {
        q: "Will photos help with an insurance claim?",
        a: "Dated photos are a record of what the house looked like, and many owners share them with their agent or adjuster. Coastal Home Management 30A does not give coverage advice. Ask your agent what they need.",
      },
    ],
    cta: {
      heading: "Never wonder about the house again.",
      body: "A year-round plan means the same person checks it every visit, and before and after every storm.",
      href: "/pricing",
      label: "See the plans",
    },
    related: [
      { href: "/hurricane-isaias-updates", label: "Hurricane Isaias updates for 30A" },
      { href: "/storm-check", label: "Storm Check: prep before, photos after" },
      { href: "/ac-humidity-settings-30a-second-home", label: "AC and humidity settings for an empty 30A home" },
      { href: "/who-to-call-storm-prep-30a", label: "Who to call to prep your 30A second home" },
    ],
    mentionsInsurance: true,
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
  },
];
