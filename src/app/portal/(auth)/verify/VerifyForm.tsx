"use client";

import { useActionState } from "react";
import { verifyEmail, resendCode, logout, type ActionState } from "@/app/portal/actions/auth";
import { AuthInput, AuthButton, AuthMessage, AuthTitle, AuthSub, AuthFoot, LINK } from "@/components/portal/AuthBits";

export default function VerifyForm({ email }: { email: string }) {
  const [state, action] = useActionState<ActionState, FormData>(verifyEmail, {});
  const [resendState, resendAction] = useActionState<ActionState, FormData>(resendCode, {});
  return (
    <div className="flex flex-col w-full gap-4">
      <form action={action} className="flex flex-col w-full gap-4">
        <AuthTitle>Check your email</AuthTitle>
        <AuthSub>We sent a 6-digit code to <span className="text-white">{email}</span>. Check spam if it is not there in a minute.</AuthSub>
        <div className="w-full flex flex-col gap-3">
          <AuthInput
            placeholder="6-digit code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            required
            className="text-center tracking-[0.4em] text-lg"
          />
          <AuthMessage state={state} />
          <AuthMessage state={resendState} />
        </div>
        <hr className="opacity-10" />
        <AuthButton pending="Checking">Confirm</AuthButton>
      </form>
      <form action={resendAction}>
        <AuthButton secondary pending="Sending">Send a new code</AuthButton>
      </form>
      <form action={logout}>
        <AuthFoot>
          Wrong email? <button type="submit" className={LINK}>Use a different one</button>
        </AuthFoot>
      </form>
    </div>
  );
}
