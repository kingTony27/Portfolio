"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import CssPin from "../CssPin";
import {
  PURPOSES,
  NAME_MAX,
  MESSAGE_MAX,
  validateContact,
  type ContactErrors,
} from "@/lib/validateContact";

// ---- Contact form -----------------------------------------------------------
// One paper sheet with three fields drawn as ruled lines. Validation runs here
// first (instant feedback) and is repeated on the server, so the two can never
// disagree about what is valid.

type Status = "idle" | "sending" | "success" | "error";
type Values = { name: string; purpose: string; message: string };

// Shared "line on paper" look for every control: no box, just an ink underline.
//   min-h-11 -> 44px tap target
//   text-base -> 16px, so mobile browsers do not zoom in when focused
//   focus:border-b-2 + darker colour -> the line thickens and darkens on focus
const FIELD =
  "block w-full min-h-11 bg-transparent px-0 py-2 text-base text-[#15130f] " +
  "outline-none border-b border-[#15130f]/35 transition-colors duration-150 " +
  "focus:border-b-2 focus:border-[#15130f]";
const LABEL = "block text-xs tracking-[0.18em] text-[#4a453c]";
const ERROR = "mt-1.5 text-xs text-[#7a2f26]";
// The submit button is drawn like an ink stamp: thick double outline, slight tilt.
const STAMP_BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-[2px] border-[3px] " +
  "border-double border-[#15130f] px-6 py-2 text-base tracking-[0.2em] text-[#15130f] " +
  "transition-colors hover:bg-[#15130f] hover:text-[#fbf8f0] " +
  "disabled:cursor-not-allowed disabled:opacity-50";

function Chevron() {
  // Custom arrow for the native <select> (we hide the browser's with appearance-none).
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="pointer-events-none absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4a453c]"
      fill="none"
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ContactForm() {
  // useId gives every label/error a unique id, so several forms on one page
  // (or React StrictMode double-rendering) never clash.
  const uid = useId();
  const nameId = `${uid}-name`;
  const nameErrId = `${nameId}-error`;
  const purposeId = `${uid}-purpose`;
  const purposeErrId = `${purposeId}-error`;
  const messageId = `${uid}-message`;
  const messageErrId = `${messageId}-error`;

  const [values, setValues] = useState<Values>({ name: "", purpose: "", message: "" });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  // Refs let us move focus to the first field that failed validation.
  const nameRef = useRef<HTMLInputElement>(null);
  const purposeRef = useRef<HTMLSelectElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  // Honeypot. A real person never sees or fills this; bots usually do.
  const honeyRef = useRef<HTMLInputElement>(null);

  const busy = status === "sending";

  // Update one field and clear its error as soon as the user starts fixing it.
  function update(field: keyof Values, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev; // nothing to clear -> keep the same object
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function focusFirstInvalid(found: ContactErrors) {
    if (found.name) nameRef.current?.focus();
    else if (found.purpose) purposeRef.current?.focus();
    else if (found.message) messageRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return; // hard guard against double submits
    setFormError(null);

    // Honeypot filled -> pretend success and send nothing.
    if (honeyRef.current?.value.trim()) {
      setStatus("success");
      return;
    }

    const { data, errors: found } = validateContact(values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      focusFirstInvalid(found);
      return;
    }

    setErrors({});
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, website: "" }),
      });
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      setStatus("success");
    } catch {
      // Keep whatever the user typed so they can simply press send again.
      setStatus("error");
      setFormError("Something went wrong. Please try again.");
    }
  }

  function resetForm() {
    setValues({ name: "", purpose: "", message: "" });
    setErrors({});
    setFormError(null);
    setStatus("idle");
  }

  // ---- Success: swap the whole form for a stamped paper card ---------------
  if (status === "success") {
    return (
      <div className="relative z-10 w-full bg-[#fbf8f0] px-6 py-12 text-center shadow-[0_18px_45px_rgba(20,18,14,0.22)] ring-1 ring-[#15130f]/10 md:px-10">
        <CssPin seed={5} size={26} className="absolute -top-3 left-1/2 -translate-x-1/2" />
        <p role="status" className="text-lg text-[#15130f] md:text-xl">
          Thanks! Your note has been received.
        </p>
        {/* The "RECEIVED" stamp slams in (scale + tilt). The keyframes live in
            globals.css and are disabled for users who prefer reduced motion. */}
        <div className="mt-8 flex justify-center">
          <span className="received-stamp inline-block border-[3px] border-double border-[#7a2f26]/80 px-5 py-2 text-xl tracking-[0.3em] text-[#7a2f26]/85 md:text-2xl">
            SENT
          </span>
        </div>
        <button type="button" onClick={resetForm} className={`${STAMP_BUTTON} mt-10`}>
          Send another
        </button>
      </div>
    );
  }

  // ---- Idle / sending / error: the form itself -----------------------------
  return (
    <form
      noValidate // we do our own validation so the wording matches the design
      onSubmit={handleSubmit}
      className="relative z-10 w-full bg-[#fbf8f0] px-5 pb-8 pt-10 shadow-[0_18px_45px_rgba(20,18,14,0.22)] ring-1 ring-[#15130f]/10 md:px-9"
    >
      <CssPin seed={5} size={26} className="absolute -top-3 left-1/2 -translate-x-1/2" />

      <div className="flex flex-col gap-6">
        {/* Field 1 — Name / organization */}
        <div>
          <label htmlFor={nameId} className={LABEL}>
            Name / organization
          </label>
          <input
            ref={nameRef}
            id={nameId}
            name="name"
            type="text"
            autoComplete="name"
            maxLength={NAME_MAX}
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? nameErrId : undefined}
            className={FIELD}
          />
          {errors.name && (
            <p id={nameErrId} className={ERROR}>
              {errors.name}
            </p>
          )}
        </div>

        {/* Field 2 — Purpose (native select, restyled) */}
        <div>
          <label htmlFor={purposeId} className={LABEL}>
            Purpose
          </label>
          <div className="relative">
            <select
              ref={purposeRef}
              id={purposeId}
              name="purpose"
              value={values.purpose}
              onChange={(e) => update("purpose", e.target.value)}
              aria-invalid={Boolean(errors.purpose)}
              aria-describedby={errors.purpose ? purposeErrId : undefined}
              className={`${FIELD} cursor-pointer appearance-none pr-8 ${
                values.purpose ? "" : "text-[#15130f]/40"
              }`}
            >
              <option value="" disabled>
                Choose a purpose
              </option>
              {PURPOSES.map((purpose) => (
                <option key={purpose} value={purpose} className="text-[#15130f]">
                  {purpose}
                </option>
              ))}
            </select>
            <Chevron />
          </div>
          {errors.purpose && (
            <p id={purposeErrId} className={ERROR}>
              {errors.purpose}
            </p>
          )}
        </div>

        {/* Field 3 — Explain further (textarea + live counter) */}
        <div>
          <label htmlFor={messageId} className={LABEL}>
            Explain further
          </label>
          <textarea
            ref={messageRef}
            id={messageId}
            name="message"
            rows={5}
            maxLength={MESSAGE_MAX}
            value={values.message}
            onChange={(e) => update("message", e.target.value)}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? messageErrId : undefined}
            className={`${FIELD} resize-y leading-relaxed`}
          />
          <div className="mt-1.5 flex items-start justify-between gap-3">
            {errors.message ? (
              <p id={messageErrId} className="text-xs text-[#7a2f26]">
                {errors.message}
              </p>
            ) : (
              <span />
            )}
            <span aria-hidden className="shrink-0 text-xs text-[#4a453c]">
              {values.message.length} / {MESSAGE_MAX}
            </span>
          </div>
        </div>
      </div>

      {/* Transport error, announced politely by screen readers. */}
      {formError && (
        <p role="status" className="mt-6 text-sm text-[#7a2f26]">
          {formError}
        </p>
      )}

      <div className="mt-8 flex justify-center">
        <button type="submit" disabled={busy} className={STAMP_BUTTON}>
          {busy ? "Sending..." : "Send note"}
        </button>
      </div>

      {/* Honeypot: off-screen, skipped by keyboards and hidden from screen
          readers. Bots tend to fill every field they find. */}
      <input
        ref={honeyRef}
        type="text"
        name="website"
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
    </form>
  );
}
