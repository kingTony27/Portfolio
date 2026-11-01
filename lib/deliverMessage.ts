import { Resend } from "resend";

// ---- Message delivery -------------------------------------------------------
// The single place that actually "sends" a contact message. It is deliberately
// isolated so the delivery provider can be swapped without touching the route.
//
// TODO: implement the real delivery — e.g. send an email (Resend / Postmark),
//       post to a webhook, or store it in a database.
//
// SECURITY: any API key must live in a server-only environment variable
// (process.env.SOMETHING) and never be imported into client code — this file is
// only ever imported by the API route, which stays on the server.

// If validateContact.ts already exports a type for the validated data, import
// that instead of declaring this one.
type ContactData = { name: string; purpose: string; message: string };

// Remove line breaks so nothing typed in the form can break the email header.
const oneLine = (text: string) => text.replace(/[\r\n]+/g, " ").trim();

export async function deliverMessage(data: ContactData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    throw new Error(
      "Email is not set up: add RESEND_API_KEY, CONTACT_TO_EMAIL and CONTACT_FROM_EMAIL",
    );
  }

  // Created inside the function, so a missing key can never break `npm run build`.
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `${oneLine(data.purpose)} - ${oneLine(data.name)}`.slice(0, 150),
    // Plain text on purpose: nothing a visitor types can turn into HTML.
    text: [
      `: ${oneLine(data.name)}`,
      ` ${oneLine(data.purpose)}`,
      "",
      data.message,
    ].join("\n"),
  });

  // Resend does not throw on failure, it returns { error }. Throwing here is
  // what makes the route answer 500 and the form show "Something went wrong".
  if (error) throw new Error(`Resend error: ${error.message}`);
}
