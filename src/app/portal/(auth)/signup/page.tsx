import { redirect } from "next/navigation";
import { getViewer } from "@/lib/portal/session";
import SignupForm from "./SignupForm";

export const dynamic = "force-dynamic";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const viewer = await getViewer();
  if (viewer) redirect(viewer.user.emailVerifiedAt ? "/portal" : "/portal/verify");
  const sp = await searchParams;
  return <SignupForm email={sp.email ?? ""} />;
}
