"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type ActionState } from "@/app/portal/actions/auth";
import { AuthInput, AuthButton, AuthMessage, AuthTitle, AuthFoot, LINK } from "@/components/portal/AuthBits";

export default function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<ActionState, FormData>(login, {});
  return (
    <form action={action} className="flex flex-col w-full gap-4">
      <AuthTitle>Coastal Home Management</AuthTitle>
      <input type="hidden" name="next" value={next} />
      <div className="w-full flex flex-col gap-3">
        <AuthInput placeholder="Email" type="email" name="email" autoComplete="email" inputMode="email" required />
        <AuthInput placeholder="Password" type="password" name="password" autoComplete="current-password" required />
        <AuthMessage state={state} />
      </div>
      <hr className="opacity-10" />
      <div>
        <AuthButton pending="Signing in">Sign in</AuthButton>
        <Link href="/portal/forgot" className="w-full flex items-center justify-center gap-2 bg-gradient-to-b from-[#232526] to-[#2d2e30] rounded-full px-5 py-3 font-medium text-white shadow hover:brightness-110 transition mb-2 text-sm">
          Forgot your password?
        </Link>
        <AuthFoot>
          Don&apos;t have an account?{" "}
          <Link href="/portal/signup" className={LINK}>Sign up, it&apos;s free!</Link>
        </AuthFoot>
      </div>
    </form>
  );
}
