import CssPin from "@/components/CssPin";
import CurrentYear from "@/components/CurrentYear";
import { Tape } from "@/components/contact/ContactDecor";
import { aboutLetter } from "@/data/about";

// ---- The letter --------------------------------------------------------------
// One sheet of ruled paper with the letter written on top of it. Plain HTML +
// CSS only (no 3D), and every word comes from data/about.ts.
//
// The sheet is built from three stacked layers, which is also the order they are
// painted in:
//   1. the envelope, behind everything, poking out below the sheet
//   2. the paper (rough edges + soft shadow) carrying the ruled lines, the left
//      margin line and the two fold creases
//   3. the writing, then the small props: push pin, tape and postmark
// The pin / tape / postmark sit OUTSIDE the paper layer, because that layer is
// clipped to a rough edge — anything that spills over the edge (the pin, the
// tape) has to live above it.
//
// ALL of the sizes, colours and the slide-up animation are in the "About page"
// block of app/globals.css.

/** A plain envelope, drawn wide and flat so only its top peeks out below the
 *  sheet. `preserveAspectRatio="none"` + non-scaling strokes let it stretch to
 *  any width without the lines getting fat. */
function PeekingEnvelope() {
  return (
    <svg
      viewBox="0 0 100 26"
      preserveAspectRatio="none"
      className="h-full w-full"
      fill="none"
      aria-hidden
    >
      {/* body (its bottom runs off below the visible area) */}
      <path
        d="M1.5 1 H98.5 V40 H1.5 Z"
        stroke="#15130f"
        strokeWidth="1.6"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* the flap */}
      <path
        d="M1.5 2 L50 19 L98.5 2"
        stroke="#15130f"
        strokeWidth="1.6"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function Letter() {
  return (
    <div className="letter-stage">
      {/* 1. the envelope, tucked behind the sheet so only its top shows below */}
      <div className="letter-envelope" aria-hidden>
        <PeekingEnvelope />
      </div>

      {/* 2 + 3. everything that rises together on load */}
      <div className="letter-rise">
        {/* the paper. The drop-shadow lives on this wrapper (not on the sheet),
            because the sheet is clipped to a rough edge and a filter on the
            parent follows that edge. */}
        <div className="letter-shadow">
          <div className="letter-sheet">
            {/* thin grey margin line down the left */}
            <span className="letter-marginline" aria-hidden />

            {/* the two fold creases — a letter folded in three */}
            <span className="letter-fold" style={{ top: "33.333%" }} aria-hidden />
            <span className="letter-fold" style={{ top: "66.667%" }} aria-hidden />

            {/* the writing, sitting on the ruled lines */}
            <div className="letter-body">
              <p>{aboutLetter.greeting}</p>
              {aboutLetter.paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
              <p>{aboutLetter.ps}</p>
              <p>{aboutLetter.closing}</p>
              <p className="letter-signature">{aboutLetter.signature}</p>

              {/* round ink "wax" seal with the initial inside it */}
              <span className="letter-seal" aria-hidden>
                T
              </span>
            </div>
          </div>
        </div>

        {/* the props: a push pin at the top, a strip of tape on one corner, and
            a round postmark with the current year at the top right */}
        <CssPin seed={5} size={24} className="absolute -top-3 left-1/2 -translate-x-1/2" />

        <span className="letter-tape" aria-hidden>
          <Tape />
        </span>

        <span className="letter-postmark" aria-hidden>
          <span className="letter-postmark-inner">
            Hello
          </span>
        </span>
      </div>
    </div>
  );
}
