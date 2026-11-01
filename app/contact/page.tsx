import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import ContactForm from "@/components/contact/ContactForm";
import ContactDecor from "@/components/contact/ContactDecor";

export const metadata: Metadata = {
  title: "Contact me",
  description: "Tell me what you need — freelancing, a full time role, part-time work or a collaboration.",
};

// Contact page: plain HTML/CSS (no 3D canvas) so it stays light and scrolls
// smoothly. It reuses the same PageShell as Projects, so the sticky header shows
// "Contact me" as the current page and the footer carries the live year.
export default function ContactPage() {
  return (
    <PageShell>
      <section className="mx-auto w-full max-w-6xl px-2 pb-24 pt-12 text-center md:px-8 md:pt-16">
        <h1 className="text-4xl text-[#15130f] md:text-5xl">Contact me</h1>
        <p className="mt-3 text-base text-[#4a453c] md:text-lg">Tell me what you need</p>

        {/* This wrapper is exactly the same box as the form sheet, which lets
            ContactDecor position the doodles relative to it — the sheet's
            top-centre pin is the anchor for the ink strings. The generous
            margins leave the doodles room above and below on phones. */}
        <div className="relative mx-auto mb-20 mt-16 w-[92vw] max-w-full text-left md:mt-20 md:w-[560px] lg:w-[640px]">
          <ContactDecor />
          <ContactForm />
        </div>
      </section>
    </PageShell>
  );
}
