import type { Metadata } from "next";
import { CHM } from "@/lib/portal/email";

export const metadata: Metadata = {
  title: "Homeowner Login",
  robots: { index: false, follow: false },
};

/**
 * Auth shell: the 21st.dev "modern-stunning-sign-in" glass card, centered on a
 * #121212 page. Every auth page (login, signup, verify, forgot, reset) renders
 * inside it so they all match.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#121212] relative overflow-hidden w-full px-4 py-10">
      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-r from-[#ffffff10] to-[#121212] backdrop-blur-sm shadow-2xl p-8 flex flex-col items-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-6 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/chm-logo.png" alt="" className="w-7 h-auto" />
        </div>
        {children}
      </div>
      <div className="relative z-10 mt-12 flex flex-col items-center text-center">
        <p className="text-gray-400 text-sm mb-2">
          Stuck? Text or call <span className="font-medium text-white">{CHM.owner}</span> at{" "}
          <a href={`tel:${CHM.phoneTel}`} className="font-medium text-white">{CHM.phone}</a>.
        </p>
      </div>
    </div>
  );
}
