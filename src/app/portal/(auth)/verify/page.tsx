import { redirect } from "next/navigation";
import { getViewer } from "@/lib/portal/session";
import VerifyForm from "./VerifyForm";

export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/portal/login");
  if (viewer.user.emailVerifiedAt) redirect("/portal");
  return <VerifyForm email={viewer.user.email} />;
}
