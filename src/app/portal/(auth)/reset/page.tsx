import ResetForm from "./ResetForm";

export const dynamic = "force-dynamic";

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const sp = await searchParams;
  return <ResetForm token={sp.token ?? ""} />;
}
