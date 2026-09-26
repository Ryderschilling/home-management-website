"use client";

import { useActionState } from "react";
import { updateContact } from "@/app/portal/actions/account";
import type { ActionState } from "@/app/portal/actions/auth";
import { SubmitButton, FormMessage, Field } from "@/components/portal/FormBits";

export default function ContactForm(p: { name: string; email: string; phone: string; altContact: string }) {
  const [state, action] = useActionState<ActionState, FormData>(updateContact, {});
  return (
    <form action={action} className="pt-form">
      <FormMessage state={state} />
      <div className="pt-grid-2">
        <Field label="Your name">
          <input name="name" defaultValue={p.name} required className="pt-field" autoComplete="name" />
        </Field>
        <Field label="Email" help="This is your login. Text Ryder if it needs to change.">
          <input value={p.email} readOnly className="pt-field" style={{ background: "var(--ch-paper-alt)" }} />
        </Field>
        <Field label="Mobile number">
          <input name="phone" type="tel" defaultValue={p.phone} className="pt-field" autoComplete="tel" inputMode="tel" />
        </Field>
        <Field label="Emergency contact" help="A name and number, in case we cannot reach you.">
          <input name="altContact" defaultValue={p.altContact} className="pt-field" placeholder="Jane Smith, (555) 555-5555" />
        </Field>
      </div>
      <SubmitButton pending="Saving">Save contact details</SubmitButton>
    </form>
  );
}
