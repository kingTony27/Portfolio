// ---- Shared contact validation ---------------------------------------------
// These rules run in TWO places:
//   1. in the browser (ContactForm) for instant feedback, and
//   2. on the server (app/api/contact/route.ts) so a request cannot skip them.
// Keeping one copy here means the two can never drift apart.

// The only purposes we accept. `as const` keeps them as literal types, and the
// <select> in the form renders exactly this list.
export const PURPOSES = [
  "Freelancing gig",
  "Full time role",
  "Part-time role",
  "Collaboration",
] as const;

export type Purpose = (typeof PURPOSES)[number];

export const NAME_MIN = 2;
export const NAME_MAX = 100;
export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 1000;

export type ContactData = {
  name: string;
  purpose: string;
  message: string;
};

// One optional message per field, so the UI can show it under the right input.
export type ContactErrors = Partial<Record<keyof ContactData, string>>;

/**
 * Trim every field, then check lengths and the allowed purpose list.
 * It accepts `unknown` values (a raw request body) and always returns a clean
 * `data` object plus an `errors` map — an empty map means the input is valid.
 */
export function validateContact(input: Partial<Record<keyof ContactData, unknown>>): {
  data: ContactData;
  errors: ContactErrors;
} {
  const data: ContactData = {
    name: typeof input.name === "string" ? input.name.trim() : "",
    purpose: typeof input.purpose === "string" ? input.purpose.trim() : "",
    message: typeof input.message === "string" ? input.message.trim() : "",
  };

  const errors: ContactErrors = {};

  if (data.name.length < NAME_MIN || data.name.length > NAME_MAX) {
    errors.name = `Please enter between ${NAME_MIN} and ${NAME_MAX} characters.`;
  }

  if (!(PURPOSES as readonly string[]).includes(data.purpose)) {
    errors.purpose = "Please choose a purpose.";
  }

  if (data.message.length < MESSAGE_MIN || data.message.length > MESSAGE_MAX) {
    errors.message = `Please write between ${MESSAGE_MIN} and ${MESSAGE_MAX} characters.`;
  }

  return { data, errors };
}
