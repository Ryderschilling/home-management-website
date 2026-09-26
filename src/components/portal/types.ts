import type { ServiceNotes } from "@/lib/portal/serviceNotes";

export type CatalogItem = {
  code: string;
  name: string;
  blurb: string;
  kind: "PLAN" | "ADDON" | "REQUEST";
  unit: "MONTH" | "DAY" | "VISIT" | "EACH";
  price: number;
  lock12Price: number | null;
  planPrice: number | null;
  visitsPerMonth: number | null;
  requiresPlan: boolean;
  questionLabel: string | null;
  questionHint: string | null;
};

export type PropertyView = {
  id: string;
  label: string | null;
  address: string;
  gateCode: string;
  doorCode: string;
  alarmCode: string;
  keyLocation: string;
  serviceNotes: ServiceNotes;
};

export type SubView = {
  id: string;
  serviceCode: string;
  serviceName: string;
  rate: number;
  term: "MONTHLY" | "LOCK12";
  visitsPerMonth: number;
  preferredWeekday: number | null;
  propertyId: string | null;
  used: number;
  left: number;
  endDate: string | null;
};

export type DayView = { key: string; open: boolean; bookable: boolean; editable: boolean; past: boolean; today: boolean; full: boolean };

export type JobView = {
  id: string;
  day: string;
  name: string;
  status: "SCHEDULED" | "DONE" | "CANCELED";
  portal: boolean;
  planVisit: boolean;
  paid: boolean;
  reportId: string | null;
};

export type CartGroup = { groupId: string; name: string; days: string[]; amount: number; kind: string; term: string | null };

export type CalendarData = {
  month: string;
  minMonth: string;
  maxMonth: string;
  earliest: string;
  /** Weekdays (0-6) CHM is normally on the route, for the 12-month plan day picker. */
  openWeekdays: number[];
  /** A month-to-month plan the client can renew for next month, if any. */
  renew: { serviceCode: string; serviceName: string; month: string; ended: boolean } | null;
  clientName: string;
  onPlan: boolean;
  legacyPlan: { name: string; rate: number; lockedUntil: string | null } | null;
  subs: SubView[];
  properties: PropertyView[];
  catalog: CatalogItem[];
  days: DayView[];
  jobs: JobView[];
  cart: { orderId: string | null; groups: CartGroup[]; total: number };
  justAdded: boolean;
};
