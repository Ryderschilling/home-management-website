"use client";

import { useActionState } from "react";
import { resetPassword, type ActionState } from "@/app/portal/actions/auth";
import { AuthInput, AuthButton, AuthMessage, AuthTitle, AuthSub } from "@/components/portal/AuthBits";

export default function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState<ActionState, FormData>(resetPassword, {});
  return (
    <form action={action} className="flex flex-col w-full gap-4">
      <AuthTitle>Choose a new password</AuthTitle>
      <AuthSub>At least 8 characters.</AuthSub>
      <input type="hidden" name="token" value={token} />
      <div className="w-full flex flex-col gap-3">
        <AuthInput placeholder="New password" type="password" name="password" autoComplete="new-password" required minLength={8} />
        <AuthMessage state={state} />
      </div>
      <hr className="opacity-10" />
      <AuthButton pending="Saving">Save and sign in</AuthButton>
    </form>
  );
}
