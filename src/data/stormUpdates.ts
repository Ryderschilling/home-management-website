// What Coastal Home Management 30A is doing during Hurricane Isaias, shown at
// the top of /hurricane-isaias-updates. Newest first. To post an update, add a
// line at the top and push; the page picks it up on the next deploy.
// Plain language, no em-dashes, never call a visit an inspection.

// While true, the homepage shows the live-updates band under the hero.
// Flip to false once Isaias is behind us.
export const STORM_ACTIVE = true;

export type StormUpdate = { at: string; text: string };

export const stormUpdates: StormUpdate[] = [
  {
    at: "2026-10-08T15:00:00-05:00",
    text: "Storm prep is finished on the homes on our list for Isaias: outdoor furniture in or secured, doors and garages latched, and dated photos taken. After the storm, every home gets walked inside and out once Walton County reopens roads and it is safe to travel, and owners get photos by email.",
  },
];

// Official sources, also linked from the page. Every URL checked 10/8/26.
export const officialLinks: { name: string; url: string; note: string }[] = [
  { name: "National Hurricane Center", url: "https://www.nhc.noaa.gov/", note: "Track, cone, advisories and storm surge maps" },
  { name: "NWS Tallahassee", url: "https://www.weather.gov/tae/", note: "The local office that issues warnings for South Walton" },
  { name: "Walton County", url: "https://www.co.walton.fl.us/", note: "Evacuation orders, shelters, sandbags, road reopening" },
  { name: "Bay County", url: "https://www.baycountyfl.gov/", note: "Inlet Beach line, Panama City Beach, west Bay County" },
  { name: "Know Your Zone", url: "https://www.floridadisaster.org/knowyourzone/", note: "Find your home's evacuation zone by address" },
  { name: "FL511 traffic", url: "https://fl511.com/", note: "Road and bridge closures, evacuation routes" },
  { name: "FPL outage map", url: "https://www.fpl.com/outage.html", note: "Report and track power outages" },
  { name: "South Walton Fire District", url: "https://swfd.org/", note: "Beach flags and local safety updates" },
];
