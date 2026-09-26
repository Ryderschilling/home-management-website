import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/portal/session";
import { readPropertySecrets } from "@/lib/secrets";
import { parseServiceNotes } from "@/lib/portal/serviceNotes";
import PropertyEditor from "@/components/portal/PropertyEditor";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/portal/login");

  const properties = await prisma.property.findMany({ where: { clientId: viewer.client.id }, orderBy: { createdAt: "asc" } });

  return (
    <div className="pt-stack" style={{ gap: 28 }}>
      <div>
        <p className="pt-eyebrow">My home</p>
        <h1 className="pt-h1">{properties.length === 1 ? "Your home" : "Your homes"}</h1>
        <p className="pt-lede">
          How we get in and what to know once we are there. Everything here fills in automatically when you book, so you only type it once.
          Codes are encrypted and only visible to Ryder and the crew member assigned to your visit.
        </p>
      </div>

      <div className="pt-stack">
        {properties.map((p) => {
          const r = readPropertySecrets(p);
          return (
            <PropertyEditor
              key={p.id}
              property={{
                id: p.id,
                label: p.label ?? "",
                address: p.address,
                gateCode: r.gateCode ?? "",
                doorCode: r.doorCode ?? "",
                alarmCode: r.alarmCode ?? "",
                wifiName: p.wifiName ?? "",
                wifiPassword: r.wifiPassword ?? "",
                keyLocation: p.keyLocation ?? "",
                trashDay: p.trashDay ?? "",
                hvacNotes: p.hvacNotes ?? "",
                notes: p.notes ?? "",
                serviceNotes: parseServiceNotes(p.serviceNotes),
              }}
            />
          );
        })}
        <PropertyEditor property={null} />
      </div>
    </div>
  );
}
