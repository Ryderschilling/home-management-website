import { redirect } from "next/navigation";
import { getViewer } from "@/lib/portal/session";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const viewer = await getViewer();
  if (viewer) redirect(viewer.user.emailVerifiedAt ? "/portal" : "/portal/verify");
  const sp = await searchParams;
  return <LoginForm next={sp.next ?? "/portal"} />;
}
