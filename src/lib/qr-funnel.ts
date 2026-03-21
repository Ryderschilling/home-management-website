export const QR_MAIN_PRODUCT_KEY = "artificial_rock_installation";
export const QR_MAIN_PRODUCT_NAME = "Artificial Rock Installation";

export const QR_UPSELL_ADDON_KEY = "electrical-box-cover";
export const QR_UPSELL_ADDON_NAME = "Electrical Box Cover";
export const QR_UPSELL_ADDON_PRICE_CENTS = 25000;
export const QR_UPSELL_ADDON_COMPARE_AT_CENTS = 35000;

export const QR_COLOR_OPTIONS = [
  { id: "beige", label: "Beige", img: "/rocks/beige.JPG" },
  { id: "sand", label: "Sand", img: "/rocks/sand.JPG" },
  { id: "grey", label: "Grey", img: "/rocks/grey.JPG" },
] as const;

export function safeString(value: unknown) {
  return String(value ?? "").trim();
}

export function parseBooleanFlag(value: unknown) {
  const normalized = safeString(value).toLowerCase();
  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on"
  );
}

export function getQrColorOption(colorId: string | null | undefined) {
  const normalized = safeString(colorId).toLowerCase();
  return (
    QR_COLOR_OPTIONS.find((option) => option.id === normalized) ?? QR_COLOR_OPTIONS[0]
  );
}

export function formatUsd(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}
