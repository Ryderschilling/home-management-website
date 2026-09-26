"use client";

import { useActionState } from "react";
import { changePassword, type ActionState } from "@/app/portal/actions/auth";
import { SubmitButton, FormMessage, Field } from "@/components/portal/FormBits";

export default function PasswordForm() {
  const [state, action] = useActionState<ActionState, FormData>(changePassword, {});
  return (
    <form action={action} className="pt-form">
      <FormMessage state={state} />
      <div className="pt-grid-2">
        <Field label="Current password">
          <input name="current" type="password" autoComplete="current-password" required className="pt-field" />
        </Field>
        <Field label="New password" help="At least 8 characters.">
          <input name="password" type="password" autoComplete="new-password" required minLength={8} className="pt-field" />
        </Field>
      </div>
      <SubmitButton variant="dark" pending="Saving">Change password</SubmitButton>
    </form>
  );
}
