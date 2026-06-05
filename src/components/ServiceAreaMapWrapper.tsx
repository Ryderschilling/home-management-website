"use client";

import dynamic from "next/dynamic";

const ServiceAreaMap = dynamic(() => import("@/components/ServiceAreaMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
      Loading map...
    </div>
  ),
});

export default function ServiceAreaMapWrapper() {
  return <ServiceAreaMap />;
}
