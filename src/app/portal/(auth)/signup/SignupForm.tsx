"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type ActionState } from "@/app/portal/actions/auth";
import { AuthInput, AuthButton, AuthMessage, AuthTitle, AuthSub, AuthFoot, LINK } from "@/components/portal/AuthBits";

export default function SignupForm({ email }: { email: string }) {
  const [state, action] = useActionState<ActionState, FormData>(signup, {});
  return (
    <form action={action} className="flex flex-col w-full gap-4">
      <AuthTitle>Create your account</AuthTitle>
      <AuthSub>Four quick fields. We ask about your home when you book.</AuthSub>
      <div className="w-full flex flex-col gap-3">
        <AuthInput placeholder="Your name" name="name" autoComplete="name" required />
        <AuthInput placeholder="Email" type="email" name="email" autoComplete="email" inputMode="email" required defaultValue={email} />
        <AuthInput placeholder="Mobile number" type="tel" name="phone" autoComplete="tel" inputMode="tel" />
        <AuthInput placeholder="Password (8+ characters)" type="password" name="password" autoComplete="new-password" required minLength={8} />
        <AuthMessage state={state} />
      </div>
      <hr className="opacity-10" />
      <div>
        <AuthButton pending="Creating your account">Create account</AuthButton>
        <AuthFoot>
          Already have a login? <Link href="/portal/login" className={LINK}>Sign in</Link>
        </AuthFoot>
      </div>
    </form>
  );
}
