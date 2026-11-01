// =============================================================================
// ABOUT PAGE — the words of the letter.
// =============================================================================
//
// HOW TO REPLACE THE PLACEHOLDER WORDS
// ------------------------------------
// Everything you read on the letter is written below. Nothing is hard-coded in
// the page or in the component, so editing this one file is all it takes:
//
//   greeting    -> the line the letter opens with, e.g. "Dear visitor,"
//   paragraphs  -> one string per paragraph. Add or remove as many as you like;
//                  the sheet simply grows taller or shorter.
//   ps          -> the short P.S. line near the end.
//   closing     -> the sign-off, e.g. "Yours truly,"
//   signature   -> the name written under the closing.
//
// KEEP THE PARAGRAPHS SHORT (2-3 sentences). This page uses the Sancreek font,
// which is decorative and heavier to read at length, so short reads better.
// Long words are fine too — the sheet gets taller and the page scrolls.
//
// The rules ("ruled lines") behind the text are aligned to the line-height set
// in the "About page" block of app/globals.css, so you never have to think about
// layout here — just write.

export type AboutLetter = {
  greeting: string;
  paragraphs: string[];
  ps: string;
  closing: string;
  signature: string;
};

export const aboutLetter: AboutLetter = {
  greeting: "Dear visitor,",
  paragraphs: [
  "My name is Ezeugwu Anthony. I am a software developer, born and raised in Nigeria, and currently based there.",

  "I have spent more than two years writing code and building things, and I still love it. For me, programming is more than a job. It is turning an idea into something real that people can use.",

  "I work well with people, and I lead well. I listen, I support my team, and I help everyone move in the same direction. Whatever your project is, I am ready to take it to the next level.",
  ],
  ps: "P.S. Pick a note on the board, or send me a message. I would love to hear about your project.",
  closing: "Have a lovely day,",
  signature: "Tony",
};
