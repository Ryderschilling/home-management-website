type SearchParamReader = {
  get(name: string): string | null;
};

export type CampaignQuerySource = "c" | "campaign" | "empty" | null;

export function normalizeCampaignCode(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function resolveCampaignCodeFromSearchParams(params: SearchParamReader) {
  const candidates: Array<{ source: Exclude<CampaignQuerySource, null>; raw: string | null }> = [
    { source: "c", raw: params.get("c") },
    { source: "campaign", raw: params.get("campaign") },
    { source: "empty", raw: params.get("") },
  ];

  for (const candidate of candidates) {
    const campaignCode = normalizeCampaignCode(candidate.raw);
    if (!campaignCode) continue;

    return {
      campaignCode,
      source: candidate.source,
      shouldCanonicalize:
        candidate.source !== "c" || String(candidate.raw ?? "") !== campaignCode,
    };
  }

  return {
    campaignCode: "",
    source: null,
    shouldCanonicalize: false,
  };
}

export function getCanonicalQrCampaignPath(campaignCode: unknown) {
  const normalizedCampaignCode = normalizeCampaignCode(campaignCode);
  return normalizedCampaignCode
    ? `/qr?c=${encodeURIComponent(normalizedCampaignCode)}`
    : "/qr";
}
