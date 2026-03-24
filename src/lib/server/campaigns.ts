import { normalizeCampaignCode } from "@/lib/campaigns";
import { sql } from "@/lib/server/db";

type ResolvedCampaign = {
  id: string;
  campaignCode: string;
};

export async function resolveCampaignByCode(
  organizationId: string,
  rawCampaignCode: unknown
): Promise<ResolvedCampaign | null> {
  const campaignCode = normalizeCampaignCode(rawCampaignCode);
  if (!campaignCode) return null;

  const rows = await sql`
    SELECT id, campaign_code
    FROM marketing_campaigns
    WHERE organization_id = ${organizationId}
      AND campaign_code = ${campaignCode}
    LIMIT 1
  `;

  const campaign = rows[0];
  if (!campaign) return null;

  return {
    id: String(campaign.id),
    campaignCode: String(campaign.campaign_code),
  };
}
