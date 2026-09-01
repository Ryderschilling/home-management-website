// src/data/townPages.ts
//
// One record per beach town along 30A and its immediate edges.
// These power the /home-watch-<town> landing pages.
//
// RULE: every town record must carry content that is TRUE OF THAT TOWN ONLY.
// housingStock, failureModes, landmarks and faqs are the fields that make each
// page a real page instead of a find-and-replace of the last one. If you add a
// town, do not copy another town's failureModes. Google flattens duplicate
// location pages and AI answer engines will not cite them.
//
// Insurance language: see /CLAUDE.md. Never say inspection, never say a carrier
// discounts anything because of CHM.

export type TownPageData = {
  slug: string;
  town: string;              // "Rosemary Beach"
  townShort: string;         // "Rosemary"
  county: string;
  zips: string[];
  driveMinutes: number;      // from Watersound Origins, honest
  onThirtyA: boolean;
  eyebrow: string;

  metaTitle: string;
  metaDescription: string;
  keywords: string;
  h1: string;
  heroLead: string;

  // The extractive answer block. Written to be lifted whole by an AI answer
  // engine, so it must stand alone with no pronouns pointing off-page.
  directAnswer: string;

  housingStock: string[];    // 2-3 paragraphs about what the homes here are
  failureModes: { title: string; body: string }[];
  neighborhoods: string[];
  landmarks: string[];
  faqs: { q: string; a: string }[];
  related: { href: string; label: string }[];
};

export const townPages: Record<string, TownPageData> = {
  "home-watch-rosemary-beach": {
    slug: "home-watch-rosemary-beach",
    town: "Rosemary Beach",
    townShort: "Rosemary Beach",
    county: "Walton County",
    zips: ["32461"],
    driveMinutes: 4,
    onThirtyA: true,
    eyebrow: "Rosemary Beach · Walton County, FL · 30A",
    metaTitle: "Home Watch in Rosemary Beach, FL",
    metaDescription:
      "Home watch for Rosemary Beach second homes. Weekly walkthroughs, photo proof every visit, carriage house and courtyard checks, storm response. Owner lives 4 minutes away in Watersound Origins. Plans from $200/mo.",
    keywords:
      "home watch Rosemary Beach, Rosemary Beach home watch service, second home management Rosemary Beach FL, property check Rosemary Beach 30A, house watching Rosemary Beach Florida",
    h1: "Home Watch in Rosemary Beach, Florida",
    heroLead:
      "Rosemary Beach homes are dense, vertical, and built out of wood and iron four minutes from salt spray. That combination punishes a house that sits empty. Coastal Home Management 30A walks yours on a set schedule, inside and out, top floor to courtyard, and sends photo proof after every single visit.",
    directAnswer:
      "Coastal Home Management 30A provides home watch service in Rosemary Beach, Florida (32461, Walton County). Owner Ryder Schilling lives in Watersound Origins, about a four minute drive from Rosemary Beach town center, and personally performs every property check. Visits are weekly or bi-weekly, cover the interior and exterior including carriage houses and private courtyards, and produce a written report with photographs after every visit. Plans run $200, $350, and $600 per month with no contract required. Phone (309) 415-8793.",
    housingStock: [
      "Rosemary Beach was laid out in 1995 as a New Urbanist town, so the homes are unusually tall and unusually close together. Three and four story units, tower rooms, rooftop decks, and a carriage house over the garage off the rear lane are the standard pattern, not the exception. Most of the square footage is stacked vertically, which means a leak that starts on the third floor is running through two more levels of finished space before anyone would ever see it.",
      "The architecture is Dutch West Indies and St. Augustine, with a lot of exposed exterior wood, painted shutters, wrought iron balconies and railings, and deep porches. Those details are the reason the town looks the way it does and also the reason a Rosemary Beach house needs eyes on it more often than a stucco house does. Salt eats iron. Humidity finds end grain.",
      "Almost every property here is a second home, a rental, or both, and the lanes and pedestrian footpaths mean nobody drives past your front door on the way to theirs. A house on a Rosemary footpath can sit unvisited for six weeks and look completely normal from the street the entire time.",
    ],
    failureModes: [
      {
        title: "Carriage houses nobody opens",
        body: "The unit over the garage is the single most neglected space in Rosemary Beach. It has its own mini split, its own water lines, and often its own small kitchen, and owners who are not renting it out sometimes go a full season without going up the stairs. That is where we find the mildew, the dead condensate pump, and the slow supply line weep.",
      },
      {
        title: "Iron and exterior wood",
        body: "Balcony railings, shutter hardware, gate latches, and exterior stair treads corrode and rot fast this close to the Gulf. We photograph these on every visit specifically so you can see the rate of change instead of getting surprised by a $9,000 repair the week before you arrive.",
      },
      {
        title: "Rooftop decks and third floor drains",
        body: "Water that ponds on a Rosemary rooftop deck or backs up in a third floor scupper has three stories of finished interior to travel through. We check the drains and the deck surface every visit, and after every heavy rain event.",
      },
      {
        title: "Footpath access and delivery pileup",
        body: "Homes on the pedestrian lanes have no place for a package to sit discreetly. Deliveries stack against the door and advertise an empty house. Mail and package handling is part of every plan.",
      },
    ],
    neighborhoods: [
      "Rosemary Beach town center and Main Street",
      "North Barrett Square and South Barrett Square",
      "The east and west pedestrian footpaths",
      "Western Green and Eastern Green",
      "The rear lanes and carriage house units",
    ],
    landmarks: [
      "Rosemary Beach Town Hall",
      "The Pearl Hotel",
      "Sugar Sands Beach Access",
      "Camp Creek Lake, just east",
    ],
    faqs: [
      {
        q: "Who provides home watch services in Rosemary Beach, Florida?",
        a: "Coastal Home Management 30A. It is an owner-operated, fully insured Florida LLC based in Watersound Origins, about four minutes from Rosemary Beach. Ryder Schilling performs the checks himself. There are no subcontractors and no rotating crews, so the person who walks your home is the person who answers when you call.",
      },
      {
        q: "How much does home watch cost in Rosemary Beach?",
        a: "Plans are $200 per month for weekly Essential checks with photo reports, $350 per month for Home Watch with appliance and plumbing checks, and $600 per month for Coastal Elite with HVAC filter changes, storm and freeze monitoring, pre-arrival prep and contractor coordination. Month to month with no contract, or lock a 6 or 12 month rate and save up to 10 percent. Rosemary Beach homes with a carriage house or a third floor usually make the most sense on Home Watch or above, because there is simply more house to walk.",
      },
      {
        q: "Do you check the carriage house too?",
        a: "Yes, and we consider it non-optional. The carriage house has its own HVAC, its own plumbing, and the least foot traffic of any space on the property, which makes it the most likely place on a Rosemary Beach lot to hide a problem. It is walked and photographed on every visit.",
      },
      {
        q: "Can you get to my home on a pedestrian footpath?",
        a: "Yes. Access on foot is normal here and we plan routes around it. We hold keys and codes securely and we do not need a vehicle at your door to do the work.",
      },
      {
        q: "Is this the same thing as vacation rental management?",
        a: "No. Coastal Home Management 30A watches owner-occupied second homes that sit empty between your visits. We do not handle bookings, guest turnover, or cleaning coordination for short term rentals. If your Rosemary Beach home is on a rental program, home watch still has a place, since a rental manager is looking at the unit between guests and not at the systems, the exterior, or the parts of the property guests never enter.",
      },
      {
        q: "What happens if a storm hits Rosemary Beach while I'm away?",
        a: "Storm and freeze response is included on Coastal Elite and available on the other plans. We check the property before the weather arrives and again as soon as it is safe to be outside, then send photographs the same day. You get the status of your house from someone standing in front of it, not from a news feed.",
      },
    ],
    related: [
      { href: "/home-watch-alys-beach", label: "Home Watch, Alys Beach" },
      { href: "/home-watch-seacrest-beach", label: "Home Watch, Seacrest Beach" },
      { href: "/home-watch-inlet-beach", label: "Home Watch, Inlet Beach" },
    ],
  },

  "home-watch-alys-beach": {
    slug: "home-watch-alys-beach",
    town: "Alys Beach",
    townShort: "Alys Beach",
    county: "Walton County",
    zips: ["32461"],
    driveMinutes: 6,
    onThirtyA: true,
    eyebrow: "Alys Beach · Walton County, FL · 30A",
    metaTitle: "Home Watch in Alys Beach, FL",
    metaDescription:
      "Home watch for Alys Beach courtyard homes. Weekly walkthroughs, courtyard and drain checks, photo proof every visit, storm response. Owner lives 6 minutes away in Watersound Origins. Plans from $200/mo.",
    keywords:
      "home watch Alys Beach, Alys Beach home watch service, second home management Alys Beach FL, property check Alys Beach 30A, house watching Alys Beach Florida",
    h1: "Home Watch in Alys Beach, Florida",
    heroLead:
      "An Alys Beach house turns inward. The courtyard, the pool, the fountain and the plunge are the middle of the home, and they are the part no neighbor can see. Coastal Home Management 30A walks the whole property on a set schedule and photographs it, so a courtyard drain backing up in July is a text message and not a discovery in October.",
    directAnswer:
      "Coastal Home Management 30A provides home watch service in Alys Beach, Florida (32461, Walton County). Owner Ryder Schilling lives in Watersound Origins, about a six minute drive from Alys Beach, and performs every property check personally. Visits are weekly or bi-weekly, cover the interior, the private courtyard, pool equipment and the masonry exterior, and produce a written report with photographs after every visit. Plans run $200, $350, and $600 per month with no contract required. Phone (309) 415-8793.",
    housingStock: [
      "Alys Beach homes are masonry, not frame. Poured concrete and block with white stucco, Bermuda style roofs, and a design code so tight the whole town reads as one building. That construction is genuinely more durable than the wood towns to the west, which changes what goes wrong here. You are not usually chasing rot. You are chasing water that got in and had nowhere to evaporate to.",
      "The plan is courtyard-first. Most homes wrap a private open air courtyard with a pool or plunge, a fountain, and mature plantings, and the living space opens onto it through large sliding and folding door systems. It is beautiful and it puts a lot of drainage, a lot of pool chemistry, and a lot of door hardware in the exact center of the house.",
      "These are high value, low occupancy properties. Owners are frequently out of state for months at a time, the architectural review is strict about anything visible, and the all white envelope shows algae, mildew and staining faster than any other palette on 30A. Small cosmetic problems here become visible problems quickly.",
    ],
    failureModes: [
      {
        title: "Courtyard drains",
        body: "This is the number one Alys Beach failure. An open courtyard collects every inch of rain that falls on it plus whatever the plantings drop. When the drain clogs, the water has nowhere to go but into the living space through the folding doors. We clear and check courtyard drains on every visit and after heavy rain.",
      },
      {
        title: "Pools and plunges running unattended",
        body: "A pool that loses circulation in August goes green in days and can cost thousands to remediate. We verify the equipment is running, the water level is right, and the surface is clean on every visit, and we coordinate with your pool service if something is off.",
      },
      {
        title: "Algae and staining on white stucco",
        body: "The white envelope is the town's whole identity, and it is unforgiving. We photograph the exterior every visit so you can see staining start rather than get a letter about it. We coordinate soft washing before it becomes an architectural review conversation.",
      },
      {
        title: "Folding and sliding door systems",
        body: "The big door systems that open the house to the courtyard have tracks, rollers, and seals that pack with sand and salt. Left alone through a season they bind, then they leak. We work them on every visit rather than letting them sit in one position for four months.",
      },
    ],
    neighborhoods: [
      "The Alys Beach courtyard homes north and south of 30A",
      "Fonville Press and the town center blocks",
      "Sea Garden and the Gulf-facing streets",
      "The Somerset and Kelsall street grid",
    ],
    landmarks: [
      "Caliza Pool and Caliza Restaurant",
      "Fonville Press",
      "The Alys Beach amphitheatre and Palmetto Green",
      "NEAT Bottle Shop",
    ],
    faqs: [
      {
        q: "Who provides home watch services in Alys Beach, Florida?",
        a: "Coastal Home Management 30A. It is an owner-operated, fully insured Florida LLC based in Watersound Origins, roughly six minutes from Alys Beach. Ryder Schilling does the walkthroughs himself, so you have one person's cell number and one person who knows your property.",
      },
      {
        q: "How much does home watch cost in Alys Beach?",
        a: "Plans are $200 per month for weekly Essential checks with photo reports, $350 per month for Home Watch with appliance and plumbing checks, and $600 per month for Coastal Elite with HVAC filter changes, storm and freeze monitoring, pre-arrival prep and contractor coordination. No contract required, with 6 and 12 month rate locks saving up to 10 percent. Most Alys Beach homes with a courtyard pool land on Home Watch or Coastal Elite, because the courtyard and pool equipment add real checks to every visit.",
      },
      {
        q: "Do you check the courtyard and pool?",
        a: "Yes. The courtyard is the part of an Alys Beach home most likely to cause an expensive problem and the part nobody can see from the street. We check the drains, the pool equipment, the water level and the surface every visit, photograph all of it, and flag anything that needs your pool company.",
      },
      {
        q: "Will you coordinate with my existing pool and landscape services?",
        a: "Yes, and most Alys Beach clients want exactly that. You already have vendors. Our job is to be the person on-site who notices something is wrong, tells you, and then makes sure the right vendor actually shows up and actually fixes it.",
      },
      {
        q: "Can you handle pre-arrival prep before we fly in?",
        a: "Yes. Pre-arrival prep is included on Coastal Elite and available as an add-on otherwise. We set the A/C ahead of your arrival, confirm the house is clean and running, and run the water so the first shower is not a surprise.",
      },
      {
        q: "Is a home watch visit the same as a home inspection?",
        a: "No. A home inspection is a licensed profession in Florida and Coastal Home Management 30A does not perform them. A home watch visit is a scheduled walkthrough of your property that documents its condition with photographs and reports anything that needs attention.",
      },
    ],
    related: [
      { href: "/home-watch-rosemary-beach", label: "Home Watch, Rosemary Beach" },
      { href: "/home-watch-seacrest-beach", label: "Home Watch, Seacrest Beach" },
      { href: "/home-watch-watersound-beach", label: "Home Watch, Watersound Beach" },
    ],
  },

  "home-watch-seacrest-beach": {
    slug: "home-watch-seacrest-beach",
    town: "Seacrest Beach",
    townShort: "Seacrest",
    county: "Walton County",
    zips: ["32461"],
    driveMinutes: 5,
    onThirtyA: true,
    eyebrow: "Seacrest Beach · Walton County, FL · 30A",
    metaTitle: "Home Watch in Seacrest Beach, FL",
    metaDescription:
      "Home watch for Seacrest Beach second homes and cottages. Weekly walkthroughs, photo proof every visit, rental-adjacent checks, storm response. Owner lives 5 minutes away. Plans from $200/mo.",
    keywords:
      "home watch Seacrest Beach, Seacrest Beach home watch service, second home management Seacrest Beach FL, property check Seacrest 30A, house watching Seacrest Beach Florida",
    h1: "Home Watch in Seacrest Beach, Florida",
    heroLead:
      "Seacrest is the busiest stretch of this end of 30A, and busy cuts both ways. Your home is surrounded by activity and still completely unobserved. Coastal Home Management 30A puts a set of eyes inside your Seacrest house on a schedule, with photographs after every visit.",
    directAnswer:
      "Coastal Home Management 30A provides home watch service in Seacrest Beach, Florida (32461, Walton County). Owner Ryder Schilling lives in Watersound Origins, about five minutes from Seacrest Beach, and performs every check personally. Visits are weekly or bi-weekly, cover the interior and exterior, and produce a written report with photographs after every visit. Plans run $200, $350, and $600 per month with no contract required. Phone (309) 415-8793.",
    housingStock: [
      "Seacrest has the widest spread of housing on this end of 30A. There are original 1990s and early 2000s cottages, there are large new builds on the north side, and there are dense clusters of townhomes and small-lot homes built around the lagoon pool. Two houses one street apart can be twenty five years and two million dollars apart.",
      "The community is organized around a roughly 12,000 square foot lagoon pool and a tram that runs residents to the beach, which means a very high share of the homes here are on rental programs at least part of the year. Even the ones that are not sit inside a neighborhood with constant turnover.",
      "The older Seacrest stock is at the age where original HVAC systems, original water heaters, and original supply lines are all reaching the end of their service life at roughly the same time. That is the specific risk profile of this town: not neglect, just age arriving all at once in a house nobody is standing in.",
    ],
    failureModes: [
      {
        title: "Aging water heaters and supply lines",
        body: "A lot of Seacrest homes are now 20 to 30 years old on original equipment. Water heaters do not usually fail politely, and a tank that lets go in an empty house runs until someone finds it. We check the pan, the connections and the closet on every visit.",
      },
      {
        title: "Rental turnover damage in the shoulder season",
        body: "If your home rents part of the year, the damage that shows up is rarely dramatic. It is a running toilet, a cracked seal, a door left unlatched, an A/C set to 62. We catch the small stuff between guests and between seasons, when nobody else is looking.",
      },
      {
        title: "Townhome and shared wall properties",
        body: "In the denser Seacrest clusters your problem can start in the unit next door. We know what a neighbor's leak looks like coming through a shared wall and we document it early, which matters a great deal when the conversation turns into whose insurance.",
      },
      {
        title: "Landscape irrigation running blind",
        body: "Seacrest lots are small and heavily planted, and a stuck irrigation zone will happily water a foundation for weeks. Irrigation checks are part of every visit and filter cleaning is included from the Home Watch plan up.",
      },
    ],
    neighborhoods: [
      "Seacrest Beach south of 30A",
      "Seacrest Beach north of 30A and the lagoon pool area",
      "Village of South Walton",
      "Adjacent Seacrest cottages toward Alys Beach",
    ],
    landmarks: [
      "The Seacrest Beach lagoon pool",
      "Seacrest Beach tram and beach access",
      "Camp Creek Lake",
      "Rosemary Beach town center, one mile east",
    ],
    faqs: [
      {
        q: "Who provides home watch services in Seacrest Beach, Florida?",
        a: "Coastal Home Management 30A. Owner-operated, fully insured Florida LLC, based in Watersound Origins about five minutes away. Ryder Schilling performs every check personally, so you deal with one person rather than a dispatcher.",
      },
      {
        q: "How much does home watch cost in Seacrest Beach?",
        a: "Plans are $200 per month for weekly Essential checks with photo reports, $350 per month for Home Watch with appliance and plumbing checks, and $600 per month for Coastal Elite with HVAC filter changes, storm and freeze monitoring, pre-arrival prep and contractor coordination. No contract required, 6 and 12 month rate locks save up to 10 percent. Seacrest homes on original 1990s equipment usually get the most out of Home Watch, since the plumbing and appliance checks are where the real risk sits.",
      },
      {
        q: "My Seacrest home is on a rental program. Do I still need home watch?",
        a: "Often yes. A rental manager looks at the unit between guests, which is a different job. They are checking whether the house is ready to book. They are not checking the attic, the water heater closet, the irrigation, the exterior, or what happens during the eight quiet weeks in November and December. Home watch covers the property, not the booking.",
      },
      {
        q: "Do you cover both sides of 30A in Seacrest?",
        a: "Yes, north and south, including the townhome clusters around the lagoon pool and the larger homes on the north side.",
      },
      {
        q: "How fast can you get there if something happens?",
        a: "Seacrest is about a five minute drive from where the owner lives in Watersound Origins. For an urgent situation that is a same-day response in almost every case, often within the hour.",
      },
      {
        q: "Do you hold keys and codes?",
        a: "Yes. Key holding is included on every plan and codes are stored securely. If you need someone let in for a repair while you are out of state, that is exactly the kind of thing we handle.",
      },
    ],
    related: [
      { href: "/home-watch-rosemary-beach", label: "Home Watch, Rosemary Beach" },
      { href: "/home-watch-alys-beach", label: "Home Watch, Alys Beach" },
      { href: "/home-watch-inlet-beach", label: "Home Watch, Inlet Beach" },
    ],
  },

  "home-watch-watersound-beach": {
    slug: "home-watch-watersound-beach",
    town: "Watersound Beach",
    townShort: "Watersound Beach",
    county: "Walton County",
    zips: ["32461"],
    driveMinutes: 6,
    onThirtyA: true,
    eyebrow: "Watersound Beach · Walton County, FL · 30A",
    metaTitle: "Home Watch in Watersound Beach, FL",
    metaDescription:
      "Home watch for gated Watersound Beach homes. Weekly walkthroughs, dune-front salt exposure checks, photo proof every visit, storm response. Owner lives in Watersound Origins. Plans from $200/mo.",
    keywords:
      "home watch Watersound Beach, Watersound Beach home watch service, second home management Watersound Beach FL, property check Watersound Beach 30A, gated community home watch 30A",
    h1: "Home Watch in Watersound Beach, Florida",
    heroLead:
      "Watersound Beach is gated, quiet, and directly on the dune line. The privacy that makes it worth owning here is the same privacy that means nobody would notice a problem for a month. Coastal Home Management 30A checks your home on a set schedule and documents every visit with photographs.",
    directAnswer:
      "Coastal Home Management 30A provides home watch service in Watersound Beach, Florida (32461, Walton County), the gated community on the south side of 30A. Owner Ryder Schilling lives in Watersound Origins, about six minutes away, and performs every check personally. Visits are weekly or bi-weekly, cover the interior and the salt-exposed exterior, and produce a written report with photographs after every visit. Plans run $200, $350, and $600 per month with no contract required. Phone (309) 415-8793.",
    housingStock: [
      "Watersound Beach is dune-front and gated, with homes set among the scrub and boardwalks rather than on a conventional street grid. Many properties sit within a few hundred feet of open Gulf, and a meaningful number have no wind break at all between them and salt spray.",
      "Construction is high-end coastal, heavy on standing seam metal roofs, deep porches, exterior stairs, elevated foundations, and outdoor living space. It is beautiful and it is also a large amount of exposed surface area in the most corrosive microclimate on 30A.",
      "The gate, the boardwalk system, and the low density mean this is one of the least observed neighborhoods on the corridor. That is a feature for owners and a risk for empty houses. Camp Creek Lake borders the community on the east, which adds a humidity and pest dimension that the towns further west do not have.",
    ],
    failureModes: [
      {
        title: "Salt corrosion on everything metal",
        body: "Direct Gulf exposure attacks hardware, hinges, light fixtures, railings, outdoor kitchen components and A/C condenser coils faster here than anywhere else we work. A condenser coil that corrodes through is a five figure conversation. We photograph exterior metal on every visit so you see it progressing.",
      },
      {
        title: "Humidity in a closed-up house near the lake",
        body: "Between Gulf humidity and Camp Creek Lake, a Watersound Beach home that is sealed up with the A/C set too high will grow mildew in closets, behind furniture and on leather. We verify the interior temperature and humidity are where they should be on every visit, not just that the unit is running.",
      },
      {
        title: "Sand, boardwalks and exterior stairs",
        body: "Wind-driven sand piles against doors, buries the bottom of exterior stairs, and works into slider tracks. Left alone for a season it stops being cosmetic and starts holding moisture against wood and against thresholds.",
      },
      {
        title: "Pest pressure from the dune and the lake",
        body: "The scrub and the lake edge push insects and the occasional rodent toward the only dry conditioned space around, which is your empty house. We look for entry points and evidence every visit and get pest control out before it is an infestation.",
      },
    ],
    neighborhoods: [
      "The Watersound Beach dune-front homes",
      "The interior boardwalk and lane homes",
      "The Camp Creek Lake edge",
      "Adjacent Watersound West Beach",
    ],
    landmarks: [
      "Watersound Beach Club",
      "Camp Creek Lake",
      "The Watersound boardwalk system",
      "Deer Lake State Park, just west",
    ],
    faqs: [
      {
        q: "Who provides home watch services in Watersound Beach, Florida?",
        a: "Coastal Home Management 30A, an owner-operated and fully insured Florida LLC. Ryder Schilling lives in Watersound Origins, about six minutes from the Watersound Beach gate, and does every walkthrough himself.",
      },
      {
        q: "How much does home watch cost in Watersound Beach?",
        a: "Plans are $200 per month for weekly Essential checks with photo reports, $350 per month for Home Watch with appliance and plumbing checks, and $600 per month for Coastal Elite with HVAC filter changes, storm and freeze monitoring, pre-arrival prep and contractor coordination. No contract, with 6 and 12 month rate locks that save up to 10 percent. Dune-front homes usually justify Coastal Elite for the storm response alone.",
      },
      {
        q: "Can you get through the gate?",
        a: "Yes. We get registered with the community the way any regular vendor does, and we keep credentials current so a visit never turns into a phone call from the gate.",
      },
      {
        q: "What do you do during hurricane season?",
        a: "Before a named storm we check the property, secure what can be secured, and photograph the pre-storm condition. After it passes and it is safe to be outside, we go back, walk the whole property, and send photographs the same day. Having a dated before and after record of your own house is worth a great deal if a claim ever gets complicated.",
      },
      {
        q: "Do you monitor for freezes too?",
        a: "Yes. The Panhandle does get hard freezes, and an unoccupied house with an unprotected exterior line or an exposed pool pump is exactly what fails. Freeze response is included on Coastal Elite.",
      },
      {
        q: "Will you meet contractors at my house?",
        a: "Yes. Contractor coordination is included on Coastal Elite and available as an on-call task otherwise, currently $85 flat per visit.",
      },
    ],
    related: [
      { href: "/home-watch-watersound-origins", label: "Home Watch, Watersound Origins" },
      { href: "/home-watch-alys-beach", label: "Home Watch, Alys Beach" },
      { href: "/home-watch-seagrove-beach", label: "Home Watch, Seagrove Beach" },
    ],
  },

  "home-watch-seagrove-beach": {
    slug: "home-watch-seagrove-beach",
    town: "Seagrove Beach",
    townShort: "Seagrove",
    county: "Walton County",
    zips: ["32459"],
    driveMinutes: 11,
    onThirtyA: true,
    eyebrow: "Seagrove Beach · Walton County, FL · 30A",
    metaTitle: "Home Watch in Seagrove Beach, FL",
    metaDescription:
      "Home watch for Seagrove Beach cottages and second homes. Weekly walkthroughs of older 30A housing stock, photo proof every visit, storm response. Plans from $200/mo, no contract.",
    keywords:
      "home watch Seagrove Beach, Seagrove Beach home watch service, second home management Seagrove FL, Old Seagrove property check, house watching Seagrove Beach Florida",
    h1: "Home Watch in Seagrove Beach, Florida",
    heroLead:
      "Seagrove has the oldest housing stock on 30A, and old houses fail in specific, predictable ways. Coastal Home Management 30A checks yours on a schedule, knows what to look for in a 1980s cottage under live oaks, and sends photo proof after every visit.",
    directAnswer:
      "Coastal Home Management 30A provides home watch service in Seagrove Beach, Florida (32459, Walton County), including Old Seagrove. Owner Ryder Schilling lives in Watersound Origins, about eleven minutes east, and performs every check personally. Visits are weekly or bi-weekly, cover the interior and exterior with attention to older systems and moisture, and produce a written report with photographs after every visit. Plans run $200, $350, and $600 per month with no contract required. Phone (309) 415-8793.",
    housingStock: [
      "Seagrove is the closest thing 30A has to an old neighborhood. Old Seagrove in particular has sand streets, enormous live oaks and magnolias, and cottages that predate the entire New Urbanist buildout to the east. Plenty of those houses have been renovated beautifully. Plenty of them are still running on the bones they were built with.",
      "North of 30A the character changes again, with larger lots, more full-time residents than most 30A towns, and a real mix of 1990s houses and recent construction. Eastern Lake runs through the community, which puts a good number of homes on or near a coastal dune lake.",
      "The practical consequence of the age here: crawl spaces, older ductwork, original galvanized or early copper supply, tree canopy over roofs, and settlement. None of that is a problem in an occupied home because you notice. In an empty one, it compounds.",
    ],
    failureModes: [
      {
        title: "Live oak canopy over the roof",
        body: "The trees are the reason Old Seagrove looks the way it does and they are also constantly loading your roof and gutters with debris. Blocked valleys and gutters back water under shingles. We check the roofline and drainage every visit and after every wind event.",
      },
      {
        title: "Crawl spaces and moisture under older cottages",
        body: "Older Seagrove homes on crawl or partially elevated foundations hold humidity underneath, and that humidity migrates up into flooring and subfloor. We look for the signs on every visit rather than waiting for the smell to reach the living room.",
      },
      {
        title: "Original plumbing and ductwork past its service life",
        body: "A 30 to 40 year old house has 30 to 40 year old supply lines, shutoffs, and duct connections. Shutoff valves that have not been turned in a decade seize, and a seized valve is what turns a small leak into an all-day flood. We exercise and check them.",
      },
      {
        title: "Eastern Lake water levels and yard drainage",
        body: "Homes near Eastern Lake can see standing water in the yard after heavy rain, and coastal dune lakes rise and fall in ways that surprise out-of-state owners. We photograph the grade and drainage after big rain events.",
      },
    ],
    neighborhoods: [
      "Old Seagrove and the sand streets",
      "Seagrove Beach north of 30A",
      "The Eastern Lake corridor",
      "Cassine Gardens and the Seagrove condominium properties",
    ],
    landmarks: [
      "Eastern Lake",
      "Seagrove Village Market Cafe",
      "Point Washington State Forest",
      "Seaside, one mile west",
    ],
    faqs: [
      {
        q: "Who provides home watch services in Seagrove Beach, Florida?",
        a: "Coastal Home Management 30A, an owner-operated and fully insured Florida LLC based in Watersound Origins. Ryder Schilling performs every walkthrough himself and Seagrove is about eleven minutes from his door.",
      },
      {
        q: "How much does home watch cost in Seagrove Beach?",
        a: "Plans are $200 per month for weekly Essential checks with photo reports, $350 per month for Home Watch with appliance and plumbing checks, and $600 per month for Coastal Elite with HVAC filter changes, storm and freeze monitoring, pre-arrival prep and contractor coordination. No contract, and 6 or 12 month rate locks save up to 10 percent. Older Seagrove homes usually get more value from Home Watch than Essential, because the plumbing and appliance checks are where the risk actually is.",
      },
      {
        q: "My Seagrove cottage is older. Does that change what you check?",
        a: "Yes, and it should. In a 1980s or 1990s cottage we spend more time on the water heater, shutoff valves, under-sink connections, crawl space moisture, and the roof and gutters under the tree canopy. In a 2022 build we spend more time on irrigation, exterior finish and pest entry. Same visit, different priorities.",
      },
      {
        q: "Do you serve Old Seagrove and the sand streets?",
        a: "Yes, the whole community, north and south of 30A, including the sand streets in Old Seagrove and the homes along Eastern Lake.",
      },
      {
        q: "Can you check on the house after a big storm?",
        a: "Yes. Post-storm checks with same-day photographs are included on Coastal Elite and available on any plan. Seagrove's tree canopy makes post-wind checks unusually worthwhile here, because limbs come down on roofs.",
      },
      {
        q: "Do you do short term rental management in Seagrove?",
        a: "No. Coastal Home Management 30A watches owner-occupied second homes that sit empty between owner visits. We do not handle bookings, guest turnover, or cleaning coordination.",
      },
    ],
    related: [
      { href: "/home-watch-seaside", label: "Home Watch, Seaside" },
      { href: "/home-watch-watercolor", label: "Home Watch, WaterColor" },
      { href: "/home-watch-watersound-beach", label: "Home Watch, Watersound Beach" },
    ],
  },

  "home-watch-seaside": {
    slug: "home-watch-seaside",
    town: "Seaside",
    townShort: "Seaside",
    county: "Walton County",
    zips: ["32459"],
    driveMinutes: 13,
    onThirtyA: true,
    eyebrow: "Seaside · Walton County, FL · 30A",
    metaTitle: "Home Watch in Seaside, FL",
    metaDescription:
      "Home watch for Seaside, Florida cottages. Weekly walkthroughs, wood exterior and tin roof checks, photo proof every visit, storm response. Plans from $200/mo, no contract.",
    keywords:
      "home watch Seaside FL, Seaside Florida home watch service, second home management Seaside 30A, property check Seaside Florida, house watching Seaside cottage",
    h1: "Home Watch in Seaside, Florida",
    heroLead:
      "The Seaside cottages are now forty years old, built almost entirely of wood, standing in salt air, and rented hard. That is a maintenance profile, not a house. Coastal Home Management 30A watches yours on a set schedule and photographs every visit.",
    directAnswer:
      "Coastal Home Management 30A provides home watch service in Seaside, Florida (32459, Walton County). Owner Ryder Schilling lives in Watersound Origins, about thirteen minutes east, and performs every check personally. Visits are weekly or bi-weekly, cover the interior and the wood exterior, and produce a written report with photographs after every visit. Plans run $200, $350, and $600 per month with no contract required. Phone (309) 415-8793.",
    housingStock: [
      "Seaside was founded in 1981 and is the town that started all of this. The design code is famous: wood frame construction, tin roofs, deep porches, and a picket fence in front of every house that has to be a different design from its neighbor's. It is also, at this point, an entire town of forty year old wooden buildings within a quarter mile of the Gulf.",
      "The lots are small and the houses are close. Most have no garage and limited storage, and many have detached rear cottages or upstairs units. The town is walkable by design, which means service access is on foot for a lot of properties.",
      "Rental occupancy here is among the highest on 30A. A Seaside cottage may host guests forty weeks a year, which means wear accumulates faster than in a quiet second home and also means the quiet weeks are when problems get a chance to grow undetected.",
    ],
    failureModes: [
      {
        title: "Wood siding, trim and porch decking",
        body: "Forty year old wood a quarter mile from salt water is a maintenance schedule, not a material. Failures start at end grain, at fastener penetrations, and at the base of porch posts. We photograph the same elevations every visit so you can see decline instead of discovering it.",
      },
      {
        title: "Tin roofs and fastener backout",
        body: "Metal roofs on 30A last a long time and then leak at exactly one place: a backed out fastener or a failed boot around a penetration. From the ground and from the porches we look for the stains and streaks that mean it has already started.",
      },
      {
        title: "Picket fences, gates and exterior stairs",
        body: "Every Seaside property has exterior wood the town's design code will not let you ignore. Rotten pickets and soft stair treads are both an appearance problem and a liability problem in a house full of guests.",
      },
      {
        title: "Humidity in a small closed-up cottage",
        body: "Small square footage, high humidity and a thermostat set too high in a vacant week is how a Seaside cottage grows mildew in a closet. We verify interior conditions on every visit, not just that the A/C is on.",
      },
    ],
    neighborhoods: [
      "The Seaside town center and Central Square",
      "Tupelo, Savannah, Odessa and the named streets",
      "Ruskin Place and the rear cottages",
      "The Gulf-facing Seaside homes on 30A",
    ],
    landmarks: [
      "Seaside amphitheatre and Central Square",
      "The Seaside Airstream food trucks",
      "Bud & Alley's",
      "Seaside Repertory Theatre",
    ],
    faqs: [
      {
        q: "Who provides home watch services in Seaside, Florida?",
        a: "Coastal Home Management 30A, an owner-operated and fully insured Florida LLC based in Watersound Origins, about thirteen minutes east of Seaside. Ryder Schilling does every walkthrough himself.",
      },
      {
        q: "How much does home watch cost in Seaside?",
        a: "Plans are $200 per month for weekly Essential checks with photo reports, $350 per month for Home Watch with appliance and plumbing checks, and $600 per month for Coastal Elite with HVAC filter changes, storm and freeze monitoring, pre-arrival prep and contractor coordination. No contract required, with 6 and 12 month rate locks saving up to 10 percent. Most Seaside cottages sit best on Home Watch, because the exterior wood and the roof are what need tracking here, not just the interior.",
      },
      {
        q: "My Seaside cottage is a rental most of the year. What does home watch add?",
        a: "Your rental manager checks whether the unit is ready to book. That is a real job and it is not this one. Home watch is the exterior, the roof, the crawl and attic space, the systems, the storm response, and the eight to twelve weeks a year when nobody at all is in the building. Those are the weeks small problems get big.",
      },
      {
        q: "Do you photograph the exterior wood?",
        a: "Every visit, from the same angles. In a town built out of wood at the edge of the Gulf, a dated photographic record of your exterior is the most useful thing anybody can hand you, both for planning maintenance and if you ever have to document when damage occurred.",
      },
      {
        q: "Can you access a home in the pedestrian parts of town?",
        a: "Yes. Foot access is normal here and it does not change anything about the visit.",
      },
      {
        q: "Is a home watch visit an inspection?",
        a: "No. Home inspection is a licensed profession in Florida and we do not perform inspections. A home watch visit is a scheduled walkthrough that documents the condition of your property with photographs and reports what needs attention.",
      },
    ],
    related: [
      { href: "/home-watch-watercolor", label: "Home Watch, WaterColor" },
      { href: "/home-watch-seagrove-beach", label: "Home Watch, Seagrove Beach" },
      { href: "/home-watch-grayton-beach", label: "Home Watch, Grayton Beach" },
    ],
  },

  "home-watch-watercolor": {
    slug: "home-watch-watercolor",
    town: "WaterColor",
    townShort: "WaterColor",
    county: "Walton County",
    zips: ["32459"],
    driveMinutes: 15,
    onThirtyA: true,
    eyebrow: "WaterColor · Walton County, FL · 30A",
    metaTitle: "Home Watch in WaterColor, FL",
    metaDescription:
      "Home watch for WaterColor second homes. Weekly walkthroughs, deep-porch and irrigation checks, photo proof every visit, storm response. Plans from $200/mo, no contract.",
    keywords:
      "home watch WaterColor FL, WaterColor home watch service, second home management WaterColor 30A, property check WaterColor Florida, house watching WaterColor Santa Rosa Beach",
    h1: "Home Watch in WaterColor, Florida",
    heroLead:
      "WaterColor homes are big, heavily landscaped, and built around outdoor living that only works if somebody maintains it. Coastal Home Management 30A checks yours on a set schedule, watches the systems and the grounds, and sends photo proof after every visit.",
    directAnswer:
      "Coastal Home Management 30A provides home watch service in WaterColor, Florida (32459, Walton County), the St. Joe community around Western Lake. Owner Ryder Schilling lives in Watersound Origins, about fifteen minutes east, and performs every check personally. Visits are weekly or bi-weekly, cover the interior, exterior and grounds, and produce a written report with photographs after every visit. Plans run $200, $350, and $600 per month with no contract required. Phone (309) 415-8793.",
    housingStock: [
      "WaterColor was developed in the early 2000s, so the housing stock is now in its twenties. That is a specific and often overlooked age: past the warranty period, past the first round of easy years, and right at the point where original HVAC systems, water heaters and roofs all start coming due at once.",
      "The design language is deep porches, hardie and wood exteriors, metal roofs, screened outdoor rooms, and mature landscaping that the community takes seriously. Homes are large by 30A standards and most have significant covered outdoor square footage, outdoor kitchens and fans, and heavy irrigation.",
      "Western Lake runs through the middle of the community and a large share of homes sit near it or near the wetland edges. That proximity is the reason WaterColor looks like it does and also the reason humidity, insects and standing water are more of a factor here than in the drier towns to the east.",
    ],
    failureModes: [
      {
        title: "Irrigation running against the house",
        body: "WaterColor lots carry a lot of plant material and a lot of zones. A stuck valve or a misaimed head will water your foundation, your siding or your outdoor kitchen for weeks and nobody will know. Irrigation is checked every visit and filter cleaning is included from the Home Watch plan up.",
      },
      {
        title: "Twenty year old HVAC and water heaters",
        body: "Early 2000s equipment is at or past end of life. In an empty house an HVAC failure is not just a comfort problem, it is a humidity problem that becomes a mold problem in under two weeks in a Florida summer. We verify operation and interior conditions on every visit.",
      },
      {
        title: "Screened porches and outdoor rooms",
        body: "Screen tears, failed fan mounts, rusted outdoor kitchen components and clogged porch drains all live in the part of the house you use most and see least when you are out of state. We walk and photograph all of it.",
      },
      {
        title: "Western Lake humidity and pest pressure",
        body: "Proximity to the lake and wetland edge means real insect pressure and real humidity. We look for entry points, evidence, and moisture signs every visit and get pest control scheduled before it becomes an interior problem.",
      },
    ],
    neighborhoods: [
      "WaterColor Phase 1 near the WaterColor Inn",
      "The Camp WaterColor and Cerulean Park areas",
      "The Western Lake and boathouse side",
      "WaterColor Crossings north of 30A",
    ],
    landmarks: [
      "WaterColor Inn and FOOW",
      "Western Lake and the WaterColor Boathouse",
      "Camp WaterColor",
      "Grayton Beach State Park, just west",
    ],
    faqs: [
      {
        q: "Who provides home watch services in WaterColor, Florida?",
        a: "Coastal Home Management 30A, an owner-operated and fully insured Florida LLC based in Watersound Origins, about fifteen minutes east. Ryder Schilling performs every check himself rather than sending a crew.",
      },
      {
        q: "How much does home watch cost in WaterColor?",
        a: "Plans are $200 per month for weekly Essential checks with photo reports, $350 per month for Home Watch with appliance and plumbing checks, and $600 per month for Coastal Elite with HVAC filter changes, storm and freeze monitoring, pre-arrival prep and contractor coordination. No contract, with 6 and 12 month rate locks that save up to 10 percent. Larger WaterColor homes with a pool or extensive grounds typically fit Home Watch or Coastal Elite.",
      },
      {
        q: "Do you check irrigation and the grounds?",
        a: "Yes, on every visit. On a WaterColor lot the irrigation system is one of the most likely things to quietly cause damage, and it is invisible from inside the house. We run zones, check for stuck heads and leaks, and clean filters on the Home Watch and Coastal Elite plans.",
      },
      {
        q: "Will you work with the HOA and my existing vendors?",
        a: "Yes. Most WaterColor owners already have a lawn company and a pool company. We are the person on-site who notices a problem, tells you, and makes sure the right vendor actually shows up and finishes.",
      },
      {
        q: "Can you get the house ready before we arrive?",
        a: "Yes. Pre-arrival prep, including setting the A/C ahead of time, running water, and confirming everything works, is included on Coastal Elite and available as an add-on on other plans.",
      },
      {
        q: "How far is WaterColor from your base?",
        a: "About fifteen minutes east, in Watersound Origins. For an urgent situation that is same-day response, usually within a couple of hours.",
      },
    ],
    related: [
      { href: "/home-watch-seaside", label: "Home Watch, Seaside" },
      { href: "/home-watch-grayton-beach", label: "Home Watch, Grayton Beach" },
      { href: "/home-watch-seagrove-beach", label: "Home Watch, Seagrove Beach" },
    ],
  },

  "home-watch-grayton-beach": {
    slug: "home-watch-grayton-beach",
    town: "Grayton Beach",
    townShort: "Grayton",
    county: "Walton County",
    zips: ["32459"],
    driveMinutes: 18,
    onThirtyA: true,
    eyebrow: "Grayton Beach · Walton County, FL · 30A",
    metaTitle: "Home Watch in Grayton Beach, FL",
    metaDescription:
      "Home watch for Grayton Beach homes and cottages. Weekly walkthroughs, flood and sand-road access, photo proof every visit, storm response. Plans from $200/mo, no contract.",
    keywords:
      "home watch Grayton Beach, Grayton Beach home watch service, second home management Grayton Beach FL, property check Grayton Beach 30A, house watching Grayton Beach Florida",
    h1: "Home Watch in Grayton Beach, Florida",
    heroLead:
      "Grayton is the oldest town on 30A and the least uniform. A 1940s beach shack sits next to a new build, half the roads are sand, and Western Lake floods when it wants to. Coastal Home Management 30A checks your Grayton home on a schedule and photographs every visit.",
    directAnswer:
      "Coastal Home Management 30A provides home watch service in Grayton Beach, Florida (32459, Walton County). Owner Ryder Schilling lives in Watersound Origins, about eighteen minutes east, and performs every check personally. Visits are weekly or bi-weekly, cover the interior and exterior with attention to flooding and older construction, and produce a written report with photographs after every visit. Plans run $200, $350, and $600 per month with no contract required. Phone (309) 415-8793.",
    housingStock: [
      "Grayton Beach dates to the 1890s and has never been master planned, which is exactly why people love it and exactly why no two properties here have the same risk profile. Original beach cottages, 1970s and 1980s houses, and multi-million dollar new construction all share the same sand streets.",
      "Much of Grayton has no HOA and no architectural review, so maintenance standards are whatever each owner decides. There is no management company noticing that your gutters are full. If you are out of state, the only person who will notice is the one you hire.",
      "Western Lake borders the town on the east and Grayton Beach State Park on the west. Coastal dune lakes rise, and when Western Lake is high after heavy rain the low-lying streets near it hold water. Owners who bought in a dry season are regularly surprised by this.",
    ],
    failureModes: [
      {
        title: "Flooding and standing water near Western Lake",
        body: "Low lots near Western Lake and the sand streets can hold water for days after a heavy rain or a lake outfall event. We check the grade, the crawl space and the lowest interior level after every significant rain, and photograph water lines when there are any.",
      },
      {
        title: "Original and unrenovated older cottages",
        body: "Some of the best properties in Grayton are also the oldest, on original wiring, original plumbing and original single pane windows. In an empty house that means seized shutoffs, weeping connections and windows that let humidity in. We check the specific things that go wrong in old houses.",
      },
      {
        title: "No HOA safety net",
        body: "In Rosemary or WaterColor somebody would eventually notice a problem at your house. In much of Grayton nobody will, and nobody is going to send you a letter about it either. That absence is the strongest argument for home watch in this town.",
      },
      {
        title: "Sand road access after weather",
        body: "Sand streets rut and wash after a storm, which affects both access and drainage against your property. We report on access conditions after storms, which matters if you are trying to get a contractor to your house from out of state.",
      },
    ],
    neighborhoods: [
      "Grayton Beach village and the sand streets",
      "The Western Lake side and Defuniak Street",
      "Old Grayton along Hotz Avenue and Garfield Street",
      "The Grayton Beach State Park edge",
    ],
    landmarks: [
      "The Red Bar",
      "Grayton Beach State Park",
      "Western Lake",
      "Chiringo and the Grayton village center",
    ],
    faqs: [
      {
        q: "Who provides home watch services in Grayton Beach, Florida?",
        a: "Coastal Home Management 30A, an owner-operated and fully insured Florida LLC based in Watersound Origins, about eighteen minutes east of Grayton. Ryder Schilling performs every walkthrough himself.",
      },
      {
        q: "How much does home watch cost in Grayton Beach?",
        a: "Plans are $200 per month for weekly Essential checks with photo reports, $350 per month for Home Watch with appliance and plumbing checks, and $600 per month for Coastal Elite with HVAC filter changes, storm and freeze monitoring, pre-arrival prep and contractor coordination. No contract required, with 6 and 12 month rate locks saving up to 10 percent. In Grayton, where there is often no HOA and no neighbor watching, weekly Essential is the floor we recommend rather than bi-weekly.",
      },
      {
        q: "My Grayton house floods sometimes. Can you check on it after rain?",
        a: "Yes, and that is one of the better reasons to have someone here. Extra checks after heavy rain or a lake event are part of how we schedule in Grayton. You get photographs of the actual water level at your actual property the same day, which is worth far more than a forecast.",
      },
      {
        q: "There's no HOA on my street. Does that matter?",
        a: "It matters a lot when you are out of state. In a managed community somebody eventually notices a problem at an empty house. In much of Grayton nobody does. Home watch is the substitute for that, on your schedule and reporting to you.",
      },
      {
        q: "Do you serve the sand street properties?",
        a: "Yes. Sand roads are normal here and they do not change the visit.",
      },
      {
        q: "Do you do vacation rental management in Grayton?",
        a: "No. We watch owner-occupied second homes between owner visits. Bookings, guest turnover, and cleaning coordination are a different business and not one we are in.",
      },
    ],
    related: [
      { href: "/home-watch-blue-mountain-beach", label: "Home Watch, Blue Mountain Beach" },
      { href: "/home-watch-watercolor", label: "Home Watch, WaterColor" },
      { href: "/home-watch-santa-rosa-beach", label: "Home Watch, Santa Rosa Beach" },
    ],
  },

  "home-watch-blue-mountain-beach": {
    slug: "home-watch-blue-mountain-beach",
    town: "Blue Mountain Beach",
    townShort: "Blue Mountain",
    county: "Walton County",
    zips: ["32459"],
    driveMinutes: 21,
    onThirtyA: true,
    eyebrow: "Blue Mountain Beach · Walton County, FL · 30A",
    metaTitle: "Home Watch in Blue Mountain Beach, FL",
    metaDescription:
      "Home watch for Blue Mountain Beach second homes. Weekly walkthroughs, steep-lot drainage and wind exposure checks, photo proof every visit. Plans from $200/mo, no contract.",
    keywords:
      "home watch Blue Mountain Beach, Blue Mountain Beach home watch service, second home management Blue Mountain Beach FL, property check Blue Mountain 30A, house watching Blue Mountain Beach Florida",
    h1: "Home Watch in Blue Mountain Beach, Florida",
    heroLead:
      "Blue Mountain sits on the highest ground on the Gulf coast of Florida, which means steep lots, real drainage, and homes that catch wind nothing else on 30A catches. Coastal Home Management 30A checks yours on a set schedule with photo proof after every visit.",
    directAnswer:
      "Coastal Home Management 30A provides home watch service in Blue Mountain Beach, Florida (32459, Walton County). Owner Ryder Schilling lives in Watersound Origins, about twenty one minutes east, and performs every check personally. Visits are weekly or bi-weekly, cover the interior and exterior with attention to slope drainage and wind exposure, and produce a written report with photographs after every visit. Plans run $200, $350, and $600 per month with no contract required. Phone (309) 415-8793.",
    housingStock: [
      "Blue Mountain Beach is built on the highest dunes on the Florida Gulf coast, roughly 65 feet above sea level. That elevation is the whole character of the place. Lots are sloped, driveways are steep, and homes on the south side often have several stories of glass pointed straight at open Gulf to get the view they paid for.",
      "The housing mix is genuinely wide, from 1980s and 1990s cottages on the north side to large modern builds on the ridge. Big Redfish Lake anchors the west end of the community, and the neighborhood is quieter and less commercial than Seaside or Rosemary, with a smaller full-time population than Santa Rosa Beach.",
      "Being high and exposed changes the risk profile in both directions. Storm surge is much less of a concern here than anywhere else on 30A. Wind and wind-driven rain are much more of one, and so is what water does when it runs downhill across a sloped lot toward a house.",
    ],
    failureModes: [
      {
        title: "Slope drainage running toward the house",
        body: "Steep lots move a great deal of water fast. Blocked area drains, failed swales and eroded beds send that water at foundations and at the low side of the house. We walk the grade after heavy rain and photograph what the water actually did.",
      },
      {
        title: "Wind exposure on the ridge",
        body: "Elevated homes here take wind that houses two miles east never see. That shows up as loosened roof edges and flashing, damaged screens, wind-driven rain past window seals, and outdoor furniture in the neighbor's yard. Post-wind checks are part of how we schedule Blue Mountain.",
      },
      {
        title: "Large glass elevations and seal failure",
        body: "The Gulf views that make these homes valuable are large glass assemblies facing weather. Failed seals show first as fogging and as staining under the sill inside. We look at glass and sills from inside on every visit.",
      },
      {
        title: "Steep driveways and access after weather",
        body: "A steep driveway that washes or ices in a hard freeze is both an access problem and a damage problem. We report on it so you are not sending a contractor into a surprise.",
      },
    ],
    neighborhoods: [
      "Blue Mountain Beach south of 30A on the ridge",
      "Blue Mountain Beach north of 30A",
      "The Big Redfish Lake area",
      "Beachside and Gulf-view streets",
    ],
    landmarks: [
      "Blue Mountain Beach Creamery",
      "Big Redfish Lake",
      "Redfish Village",
      "Point Washington State Forest to the north",
    ],
    faqs: [
      {
        q: "Who provides home watch services in Blue Mountain Beach, Florida?",
        a: "Coastal Home Management 30A, an owner-operated and fully insured Florida LLC based in Watersound Origins, about twenty one minutes east. Ryder Schilling performs every walkthrough personally.",
      },
      {
        q: "How much does home watch cost in Blue Mountain Beach?",
        a: "Plans are $200 per month for weekly Essential checks with photo reports, $350 per month for Home Watch with appliance and plumbing checks, and $600 per month for Coastal Elite with HVAC filter changes, storm and freeze monitoring, pre-arrival prep and contractor coordination. No contract, with 6 and 12 month rate locks that save up to 10 percent.",
      },
      {
        q: "Is Blue Mountain Beach safer from storms because it's higher?",
        a: "Higher ground meaningfully reduces surge exposure, and that is a real advantage of this neighborhood. It does not reduce wind. Elevated, exposed homes on the ridge take more wind and wind-driven rain than lower properties do, so post-storm checks here focus on roof edges, flashing, screens and window seals rather than on water coming up from below.",
      },
      {
        q: "Do you check drainage on a sloped lot?",
        a: "Yes, and it is one of the first things we look at here. We walk the grade, check area drains and swales, and photograph erosion and water paths after heavy rain so you can act before it undermines something.",
      },
      {
        q: "Do you serve north of 30A too?",
        a: "Yes, both sides, including the Big Redfish Lake area and the streets toward Point Washington State Forest.",
      },
      {
        q: "How quickly can you respond to a problem?",
        a: "Blue Mountain is about twenty one minutes from where the owner lives. Urgent situations are same-day, usually within a couple of hours.",
      },
    ],
    related: [
      { href: "/home-watch-grayton-beach", label: "Home Watch, Grayton Beach" },
      { href: "/home-watch-santa-rosa-beach", label: "Home Watch, Santa Rosa Beach" },
      { href: "/home-watch-dune-allen-beach", label: "Home Watch, Dune Allen Beach" },
    ],
  },

  "home-watch-santa-rosa-beach": {
    slug: "home-watch-santa-rosa-beach",
    town: "Santa Rosa Beach",
    townShort: "Santa Rosa Beach",
    county: "Walton County",
    zips: ["32459"],
    driveMinutes: 24,
    onThirtyA: true,
    eyebrow: "Santa Rosa Beach · Walton County, FL · 30A",
    metaTitle: "Home Watch in Santa Rosa Beach, FL",
    metaDescription:
      "Home watch for Santa Rosa Beach second homes, north and south of Highway 98. Weekly walkthroughs, photo proof every visit, storm response. Plans from $200/mo, no contract.",
    keywords:
      "home watch Santa Rosa Beach, Santa Rosa Beach home watch service, second home management Santa Rosa Beach FL, property check Santa Rosa Beach 30A, house watching Santa Rosa Beach Florida",
    h1: "Home Watch in Santa Rosa Beach, Florida",
    heroLead:
      "Santa Rosa Beach is the largest and least uniform address on 30A. Gulf-front homes, bay-side homes and wooded lots north of 98 all carry the same mailing address and almost nothing else in common. Coastal Home Management 30A checks yours on a set schedule with photo proof every visit.",
    directAnswer:
      "Coastal Home Management 30A provides home watch service in Santa Rosa Beach, Florida (32459, Walton County), on both the 30A corridor and north of Highway 98. Owner Ryder Schilling lives in Watersound Origins and performs every check personally. Visits are weekly or bi-weekly, cover the interior and exterior, and produce a written report with photographs after every visit. Plans run $200, $350, and $600 per month with no contract required. Phone (309) 415-8793.",
    housingStock: [
      "Santa Rosa Beach is a mailing address covering an enormous area, not a single neighborhood. It stretches from the 30A corridor on the Gulf all the way north across Highway 98 to Point Washington, Church Street, Hammock Bay and the Choctawhatchee Bay side. Two Santa Rosa Beach homes can be fifteen miles and two entirely different climates apart.",
      "South of 98 along 30A you have second homes, rentals and Gulf-view construction. North of 98 you find larger wooded lots, more full-time residents, more well and septic systems, and a much higher share of primary residences. What a home watch visit should actually cover differs sharply between the two.",
      "Because the area is so large and so mixed, a lot of national and regional home watch companies quote Santa Rosa Beach without ever explaining which part of it they mean. That is worth asking any provider directly, including us.",
    ],
    failureModes: [
      {
        title: "Well and septic systems north of 98",
        body: "A meaningful number of homes north of Highway 98 are on well and septic. An empty house with a failing pump or a saturated drain field will not tell you anything until it is expensive. We check pressure, look for wet spots over the field, and flag anything that needs a service call.",
      },
      {
        title: "Tree cover and limb damage on wooded lots",
        body: "The wooded northern lots have real canopy over roofs and driveways. After every wind event we check the roof line, gutters and driveway access and photograph anything that came down.",
      },
      {
        title: "Bay-side moisture and dock structures",
        body: "Homes toward Choctawhatchee Bay carry docks, boat lifts and bulkheads that quietly deteriorate. Those structures are rarely part of a standard home watch anywhere and they should be part of yours if you have them.",
      },
      {
        title: "Distance from any given vendor",
        body: "The area is spread out enough that a vendor who says they will be there tomorrow may mean a different part of Santa Rosa Beach entirely. Our job includes making sure the person you are paying actually showed up at your house.",
      },
    ],
    neighborhoods: [
      "The 30A corridor in Santa Rosa Beach",
      "Point Washington and Church Street",
      "Gulf Place and the west 30A end",
      "North of Highway 98 toward Hammock Bay and the bay side",
    ],
    landmarks: [
      "Gulf Place",
      "Point Washington State Forest",
      "Eden Gardens State Park",
      "Choctawhatchee Bay",
    ],
    faqs: [
      {
        q: "Who provides home watch services in Santa Rosa Beach, Florida?",
        a: "Coastal Home Management 30A, an owner-operated and fully insured Florida LLC. Ryder Schilling lives in Watersound Origins on the east end of 30A and performs every check personally.",
      },
      {
        q: "How much does home watch cost in Santa Rosa Beach?",
        a: "Plans are $200 per month for weekly Essential checks with photo reports, $350 per month for Home Watch with appliance and plumbing checks, and $600 per month for Coastal Elite with HVAC filter changes, storm and freeze monitoring, pre-arrival prep and contractor coordination. No contract required, with 6 and 12 month rate locks that save up to 10 percent. Because the area is so spread out, Santa Rosa Beach clients are routed on a fixed weekly or bi-weekly day, which is what keeps the price where it is.",
      },
      {
        q: "Santa Rosa Beach is huge. Which parts do you actually serve?",
        a: "The honest answer matters here. The 30A corridor is the core service area and where visits are most efficient. Homes further west along 30A and north of Highway 98 are served, and for those we usually recommend a bi-weekly or weekly schedule set on a fixed day so the route works. If a property is far enough out that we cannot promise a genuinely fast urgent response, we will say so before you sign anything rather than after.",
      },
      {
        q: "Do you check well and septic systems?",
        a: "We check the observable signs: water pressure, wet areas over a drain field, odor, and anything at the well head that looks wrong. We are not a licensed well or septic contractor, so what we do is notice early and get the right specialist out.",
      },
      {
        q: "Do you handle homes on the bay side with docks?",
        a: "Yes, and dock and lift condition should be written into the visit checklist if you have them. Those structures deteriorate quietly and are usually skipped by generic home watch checklists.",
      },
      {
        q: "Can I get a fixed visit day?",
        a: "Yes, and in Santa Rosa Beach we recommend it. A fixed day lets us route the area efficiently, which keeps your price where it is and keeps your visit consistent.",
      },
    ],
    related: [
      { href: "/home-watch-blue-mountain-beach", label: "Home Watch, Blue Mountain Beach" },
      { href: "/home-watch-dune-allen-beach", label: "Home Watch, Dune Allen Beach" },
      { href: "/home-watch-grayton-beach", label: "Home Watch, Grayton Beach" },
    ],
  },

  "home-watch-dune-allen-beach": {
    slug: "home-watch-dune-allen-beach",
    town: "Dune Allen Beach",
    townShort: "Dune Allen",
    county: "Walton County",
    zips: ["32459"],
    driveMinutes: 27,
    onThirtyA: true,
    eyebrow: "Dune Allen Beach · Walton County, FL · 30A",
    metaTitle: "Home Watch in Dune Allen Beach, FL",
    metaDescription:
      "Home watch for Dune Allen Beach second homes at the west end of 30A. Weekly walkthroughs, coastal dune lake and salt exposure checks, photo proof every visit. Plans from $200/mo.",
    keywords:
      "home watch Dune Allen Beach, Dune Allen home watch service, second home management Dune Allen Beach FL, property check west 30A, house watching Dune Allen Florida",
    h1: "Home Watch in Dune Allen Beach, Florida",
    heroLead:
      "Dune Allen is the quiet west end of 30A: three coastal dune lakes, older stock, and almost no through traffic. Quiet is why people buy here and it is also why an empty house can sit unnoticed for a very long time. Coastal Home Management 30A checks yours on a schedule with photo proof every visit.",
    directAnswer:
      "Coastal Home Management 30A provides home watch service in Dune Allen Beach, Florida (32459, Walton County), at the western end of scenic 30A. Owner Ryder Schilling lives in Watersound Origins and performs every check personally. Visits are weekly or bi-weekly, cover the interior and salt-exposed exterior, and produce a written report with photographs after every visit. Plans run $200, $350, and $600 per month with no contract required. Phone (309) 415-8793.",
    housingStock: [
      "Dune Allen is the westernmost stretch of 30A and one of the least developed. Oyster Lake, Stallworth Lake and Allen Lake all reach the Gulf inside this small area, which is an unusual concentration of coastal dune lakes and the reason so much of the land here was never built on.",
      "Housing skews older than the towns to the east. A lot of 1980s and 1990s beach houses on pilings, some original small cottages, and a scattering of large modern rebuilds on the best Gulf-front lots. Many properties are directly on the dune line with nothing between them and salt spray.",
      "There is very little commercial activity and very little through traffic. That is exactly the appeal, and it is also the operational fact that matters: nobody is driving past your house, no HOA is inspecting anything, and a problem here goes unobserved longer than almost anywhere else on the corridor.",
    ],
    failureModes: [
      {
        title: "Direct salt exposure on older construction",
        body: "Gulf-front homes on pilings from the 1980s and 1990s have decades of salt on their hardware, fasteners, railings, exterior stairs and condenser coils. This is the most corrosion-driven stretch of the corridor and it deserves photographic tracking on every visit.",
      },
      {
        title: "Coastal dune lake water levels",
        body: "Oyster Lake and Stallworth Lake rise and fall and occasionally breach to the Gulf. Homes on or near the lake edges can see water in places the previous owner never mentioned. We photograph water levels and yard conditions after every heavy rain.",
      },
      {
        title: "Long stretches with no observation",
        body: "There is no HOA, no gate and no through traffic here. If a window blows out in a November storm at an empty Dune Allen house, the realistic scenario without home watch is that it stays open for weeks. That is the whole case for a scheduled visit in this town.",
      },
      {
        title: "Pilings, under-house space and exterior stairs",
        body: "Elevated homes have exposed structure, utilities and stairs underneath that take wind, sand and salt continuously. We walk under and around the house on every visit, not just through it.",
      },
    ],
    neighborhoods: [
      "Dune Allen Beach Gulf-front on 30A",
      "The Oyster Lake and Stallworth Lake area",
      "North of 30A toward Gulf Place",
      "The west end approaching Topsail Hill Preserve",
    ],
    landmarks: [
      "Oyster Lake and Stallworth Lake",
      "Topsail Hill Preserve State Park",
      "Ed Walline Beach Access and Gulf Place",
      "Stinky's Fish Camp",
    ],
    faqs: [
      {
        q: "Who provides home watch services in Dune Allen Beach, Florida?",
        a: "Coastal Home Management 30A, an owner-operated and fully insured Florida LLC. Ryder Schilling lives in Watersound Origins at the east end of 30A and performs every check personally.",
      },
      {
        q: "How much does home watch cost in Dune Allen Beach?",
        a: "Plans are $200 per month for weekly Essential checks with photo reports, $350 per month for Home Watch with appliance and plumbing checks, and $600 per month for Coastal Elite with HVAC filter changes, storm and freeze monitoring, pre-arrival prep and contractor coordination. No contract required, with 6 and 12 month rate locks saving up to 10 percent. At the west end we recommend a fixed weekly day so the route works, and we price it the same as everywhere else.",
      },
      {
        q: "You're based on the east end. Is Dune Allen too far?",
        a: "It is the far end of the service area and worth being straight about. Scheduled visits are absolutely workable on a fixed weekly or bi-weekly day, and that is how Dune Allen clients are routed. For a true emergency, response is measured in a bit under an hour rather than fifteen minutes. If you need someone who can be at the door in ten minutes, a west-end provider is the honest answer and we will tell you that instead of taking the money.",
      },
      {
        q: "Do you check under an elevated home?",
        a: "Yes. On piling homes the space underneath holds the utilities, the exterior stair structure and most of the salt damage. It gets walked and photographed every visit.",
      },
      {
        q: "What about the coastal dune lakes?",
        a: "If your property is on or near Oyster, Stallworth or Allen Lake, water level and yard drainage go on the visit checklist and get photographed after heavy rain. Owners from out of state consistently underestimate how much those lakes move.",
      },
      {
        q: "Is this the same as rental management?",
        a: "No. We watch owner-occupied second homes between owner visits. We do not handle bookings, guests or cleaning coordination.",
      },
    ],
    related: [
      { href: "/home-watch-santa-rosa-beach", label: "Home Watch, Santa Rosa Beach" },
      { href: "/home-watch-blue-mountain-beach", label: "Home Watch, Blue Mountain Beach" },
      { href: "/home-watch-miramar-beach", label: "Home Watch, Miramar Beach" },
    ],
  },

  "home-watch-miramar-beach": {
    slug: "home-watch-miramar-beach",
    town: "Miramar Beach",
    townShort: "Miramar Beach",
    county: "Walton County",
    zips: ["32550"],
    driveMinutes: 33,
    onThirtyA: false,
    eyebrow: "Miramar Beach · Walton County, FL",
    metaTitle: "Home Watch in Miramar Beach, FL",
    metaDescription:
      "Home watch for Miramar Beach second homes and Gulf-front condos near Sandestin. Scheduled walkthroughs, photo proof every visit, storm response. Plans from $200/mo, no contract.",
    keywords:
      "home watch Miramar Beach, Miramar Beach home watch service, second home management Miramar Beach FL, condo home watch Sandestin, house watching Miramar Beach Florida",
    h1: "Home Watch in Miramar Beach, Florida",
    heroLead:
      "Miramar Beach runs from Sandestin to the Walton county line and is far more condo and resort-driven than 30A. Coastal Home Management 30A serves it on a scheduled basis, with the same photo-documented visit every time.",
    directAnswer:
      "Coastal Home Management 30A provides home watch service in Miramar Beach, Florida (32550, Walton County), including properties near Sandestin. Owner Ryder Schilling lives in Watersound Origins, about thirty three minutes east, and performs every check personally. Visits are scheduled weekly or bi-weekly, cover the interior and exterior, and produce a written report with photographs after every visit. Plans run $200, $350, and $600 per month with no contract required. Phone (309) 415-8793.",
    housingStock: [
      "Miramar Beach is a different animal from 30A. Gulf-front high rise and mid rise condominiums dominate the beach side, Sandestin Golf and Beach Resort occupies a large share of the area with its own villages and its own rules, and there are established single family neighborhoods behind and around all of it.",
      "Because so much of the inventory is condominium, a lot of the building envelope is somebody else's responsibility. What is still entirely yours is the interior: the HVAC, the water heater, the supply lines, the humidity, the appliances, and the unit itself sitting closed up for months while the association worries about the roof.",
      "Occupancy patterns skew heavily toward rental and resort use. That means high traffic in season and long, completely dead stretches out of it, which is the pattern that produces the worst surprises.",
    ],
    failureModes: [
      {
        title: "Condo interiors nobody enters for months",
        body: "The association handles the exterior. Nobody handles your water heater, your supply lines, your humidity or your appliances. A leak in a stacked building is also a leak in the units below yours, which turns a plumbing problem into a legal one.",
      },
      {
        title: "Humidity in a closed up unit",
        body: "A Gulf-front unit shut down for the off season with the thermostat set too high grows mildew on soft goods and behind furniture. We verify actual interior conditions on every visit rather than just confirming the unit is running.",
      },
      {
        title: "Resort and association access rules",
        body: "Sandestin and the larger condominium associations have real access procedures. We register properly, keep credentials current, and work inside the association's process instead of arguing with a gate.",
      },
      {
        title: "Sand, salt and slider tracks on Gulf-front units",
        body: "Balcony sliders on Gulf-front floors pack with salt and sand and then stop sealing. That is where wind-driven rain gets into a unit that looked fine yesterday.",
      },
    ],
    neighborhoods: [
      "Gulf-front Miramar Beach condominiums",
      "Sandestin Golf and Beach Resort villages",
      "The Scenic Gulf Drive corridor",
      "Neighborhoods north of Highway 98",
    ],
    landmarks: [
      "Sandestin Golf and Beach Resort",
      "Baytowne Wharf",
      "Grand Boulevard",
      "Silver Sands Premium Outlets",
    ],
    faqs: [
      {
        q: "Do you serve Miramar Beach if you're based on 30A?",
        a: "Yes, on a scheduled basis, and it is worth being direct about what that means. Miramar Beach is about thirty three minutes west of Watersound Origins. Scheduled weekly or bi-weekly visits work well. An emergency response is closer to forty five minutes than to fifteen. If your priority is somebody who can be at the door immediately, a Destin-based provider is the better fit and we will say so.",
      },
      {
        q: "How much does home watch cost in Miramar Beach?",
        a: "Plans are $200 per month for weekly Essential checks with photo reports, $350 per month for Home Watch with appliance and plumbing checks, and $600 per month for Coastal Elite with HVAC filter changes, storm and freeze monitoring, pre-arrival prep and contractor coordination. No contract required, with 6 and 12 month rate locks saving up to 10 percent. Condominium units are usually well served by Essential, since the association already owns the building envelope.",
      },
      {
        q: "Do you watch condominiums or just houses?",
        a: "Both. For a condominium the visit focuses on what the association does not cover, which is everything inside your door: HVAC operation, humidity, water heater, supply lines and shutoffs, appliances, sliders and balcony drainage.",
      },
      {
        q: "Can you get into Sandestin?",
        a: "Yes. We register as a vendor through the proper channel and keep the credentials current so a visit never turns into a phone call from the gate.",
      },
      {
        q: "Why does a condo need home watch if the association handles the building?",
        a: "Because the association handles the building, not your unit. The most expensive thing that happens in a condominium is a supply line failure in an empty unit that runs into the units below. That is your liability, and it is the exact thing a scheduled interior check is designed to prevent.",
      },
      {
        q: "Is this the same as rental management?",
        a: "No. Bookings, guest turnover and cleaning coordination are a different business. We watch the property itself.",
      },
    ],
    related: [
      { href: "/home-watch-dune-allen-beach", label: "Home Watch, Dune Allen Beach" },
      { href: "/home-watch-santa-rosa-beach", label: "Home Watch, Santa Rosa Beach" },
      { href: "/home-watch-blue-mountain-beach", label: "Home Watch, Blue Mountain Beach" },
    ],
  },

  "home-watch-panama-city-beach": {
    slug: "home-watch-panama-city-beach",
    town: "Panama City Beach",
    townShort: "Panama City Beach",
    county: "Bay County",
    zips: ["32413", "32407"],
    driveMinutes: 12,
    onThirtyA: false,
    eyebrow: "Panama City Beach · Bay County, FL",
    metaTitle: "Home Watch in Panama City Beach, FL",
    metaDescription:
      "Home watch for west Panama City Beach second homes and condos, including Wild Heron, Breakfast Point and the Camp Helen side. Photo proof every visit. Plans from $200/mo.",
    keywords:
      "home watch Panama City Beach, PCB home watch service, second home management Panama City Beach FL, condo home watch 32413, house watching west Panama City Beach",
    h1: "Home Watch in Panama City Beach, Florida",
    heroLead:
      "The west end of Panama City Beach is twelve minutes from Watersound Origins, closer than half of 30A. Coastal Home Management 30A watches second homes and condominiums on that end of PCB with the same scheduled, photo-documented visit.",
    directAnswer:
      "Coastal Home Management 30A provides home watch service in west Panama City Beach, Florida (32413, Bay County), including the Camp Helen, Wild Heron, Breakfast Point and Carillon Beach side. Owner Ryder Schilling lives in Watersound Origins, about twelve minutes west of the county line, and performs every check personally. Visits are weekly or bi-weekly, cover the interior and exterior, and produce a written report with photographs after every visit. Plans run $200, $350, and $600 per month with no contract required. Phone (309) 415-8793.",
    housingStock: [
      "West Panama City Beach, the 32413 side toward the Walton county line, is much closer in character to 30A than the tower-lined middle of PCB. Wild Heron, Breakfast Point, Carillon Beach and the neighborhoods around Lake Powell are second-home and primary-home communities with real HOAs and real landscaping, not resort inventory.",
      "There is also a very large condominium market here, both Gulf-front and just off the beach, and a great deal of it is owned by out-of-state buyers who visit a few weeks a year. Those units sit closed for long periods in a humid coastal climate.",
      "Lake Powell, one of the largest coastal dune lakes in the country, sits on the county line and shapes the west end. Camp Helen State Park protects the strip between the lake and the Gulf, which is why this end of PCB stays quieter than the rest of it.",
    ],
    failureModes: [
      {
        title: "Closed up condominium units",
        body: "An off-season condo with the thermostat set too high grows mildew and hides supply line weeps that eventually reach the units below. Interior condition checks and photographs are the core of what a PCB condo needs.",
      },
      {
        title: "Lake Powell humidity and pest pressure",
        body: "Homes near Lake Powell and Camp Helen carry more insect and moisture pressure than properties further inland. We look for entry points, evidence and moisture signs on every visit.",
      },
      {
        title: "Storm exposure on an unprotected coast",
        body: "This stretch takes weather directly. Pre-storm and post-storm checks with same-day photographs are the single most valuable thing a home watch service does for an out-of-state PCB owner.",
      },
      {
        title: "HOA landscaping and irrigation in the newer communities",
        body: "Wild Heron, Breakfast Point and similar neighborhoods have irrigation running on schedules nobody is watching. A stuck zone waters a foundation for weeks. We run and check zones on every visit.",
      },
    ],
    neighborhoods: [
      "Carillon Beach",
      "Wild Heron and Sharks Tooth",
      "Breakfast Point and the Lake Powell area",
      "West Panama City Beach condominiums along Front Beach Road",
    ],
    landmarks: [
      "Camp Helen State Park",
      "Lake Powell",
      "Carillon Beach town center",
      "Inlet Beach and the Walton county line, twelve minutes west",
    ],
    faqs: [
      {
        q: "Do you serve Panama City Beach if you're a 30A company?",
        a: "The west end of PCB, yes, and it is genuinely close. Watersound Origins is about twelve minutes from the county line, so Carillon Beach, Wild Heron, Breakfast Point and the Lake Powell area are nearer to us than Seaside is. Properties east of about Pier Park get far enough out that we would rather point you to a Bay County provider than promise a response time we cannot hold.",
      },
      {
        q: "How much does home watch cost in Panama City Beach?",
        a: "Plans are $200 per month for weekly Essential checks with photo reports, $350 per month for Home Watch with appliance and plumbing checks, and $600 per month for Coastal Elite with HVAC filter changes, storm and freeze monitoring, pre-arrival prep and contractor coordination. No contract required, with 6 and 12 month rate locks saving up to 10 percent. West-end PCB is priced exactly the same as 30A, with no county-line surcharge.",
      },
      {
        q: "Do you watch condominiums in PCB?",
        a: "Yes. For a condo the visit focuses on everything inside your door, which is what the association does not touch: HVAC operation and humidity, water heater, supply lines and shutoffs, appliances, sliders and balcony drainage.",
      },
      {
        q: "Do you cover Carillon Beach and Wild Heron?",
        a: "Yes. Both are core west-end communities for us and both are closer to the owner's home than most of 30A is.",
      },
      {
        q: "What happens during a hurricane?",
        a: "We check and secure the property before the storm and photograph its condition, then return as soon as it is safe and send same-day photographs of what happened. A dated before and after record of your own property is worth a great deal if a claim ever becomes complicated about timing.",
      },
      {
        q: "Is Coastal Home Management 30A insured?",
        a: "Yes. It is a fully insured Florida LLC carrying general liability coverage, operating in Walton and Bay counties.",
      },
    ],
    related: [
      { href: "/home-watch-inlet-beach", label: "Home Watch, Inlet Beach" },
      { href: "/home-watch-rosemary-beach", label: "Home Watch, Rosemary Beach" },
      { href: "/home-watch-watersound-origins", label: "Home Watch, Watersound Origins" },
    ],
  },
};

export const allTownPages: TownPageData[] = Object.values(townPages);

export const townSlugs: string[] = Object.keys(townPages);
