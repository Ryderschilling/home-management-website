"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-20 text-center">
        <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-semibold tracking-tight">
            Payment successful
          </h1>

          <p className="mt-4 text-base text-neutral-700">
            Thank you. Your order has been received successfully.
          </p>

          {sessionId ? (
            <p className="mt-3 break-all text-sm text-neutral-500">
              Session ID: {sessionId}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/qr/thanks"
              className="inline-flex items-center justify-center rounded-xl border border-black px-5 py-3 text-sm font-medium transition hover:bg-black hover:text-white"
            >
              Continue
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-300 px-5 py-3 text-sm font-medium transition hover:border-black"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function QrSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white text-black">
          <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-20 text-center">
            <p className="text-neutral-600">Loading...</p>
          </div>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}