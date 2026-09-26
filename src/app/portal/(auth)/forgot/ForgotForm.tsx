"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPassword, type ActionState } from "@/app/portal/actions/auth";
import { AuthInput, AuthButton, AuthMessage, AuthTitle, AuthSub, AuthFoot, LINK } from "@/components/portal/AuthBits";

export default function ForgotForm() {
  const [state, action] = useActionState<ActionState, FormData>(forgotPassword, {});
  return (
    <form action={action} className="flex flex-col w-full gap-4">
      <AuthTitle>Reset your password</AuthTitle>
      <AuthSub>Enter your email and we will send a link to choose a new one.</AuthSub>
      <div className="w-full flex flex-col gap-3">
        {!state.ok && <AuthInput placeholder="Email" type="email" name="email" autoComplete="email" inputMode="email" required />}
        <AuthMessage state={state} />
      </div>
      <hr className="opacity-10" />
      <div>
        {!state.ok && <AuthButton pending="Sending">Send reset link</AuthButton>}
        <AuthFoot>
          <Link href="/portal/login" className={LINK}>Back to sign in</Link>
        </AuthFoot>
      </div>
    </form>
  );
}
