import React from "react";

export const stepHelpContent = {
  // Source description
  1: (
    <>
      <h2>
        1 - Describe the{" "}
        <i>
          <abbr title="Metronome Mark">MM</abbr> Source
        </i>
      </h2>
      <p>
        A simple form with basic informations about the{" "}
        <i>
          <abbr title="Metronome Mark">MM</abbr> Source
        </i>
        .
      </p>
      <p>
        Concerning the <strong>Link to the online score</strong>, if you take it
        from IMSLP, make sure to indicate the link to the PDF of the specific
        score you used and not the related piece page url. The link should be
        like this:
        https://ks.imslp.info/files/imglnks/usimg/3/34/IMSLP677693-PMLP4920-Grand_septuor_0001-converted-compressed.pdf
      </p>
    </>
  ),
  // contributions
  2: (
    <>
      <h2>
        2 - List the <i>contributors</i> to the{" "}
        <i>
          <abbr title="Metronome Mark">MM</abbr> Source
        </i>
      </h2>
      <p>
        You will list peoples or companies which contributed to the{" "}
        <i>
          <abbr title="Metronome Mark">MM</abbr> Source
        </i>{" "}
        and their respective <i>role</i> (editor, publisher, etc.).
      </p>
    </>
  ),
  // Pieces and versions
  3: (
    <>
      <h2>
        3 - Pieces and Versions contained in the{" "}
        <i>
          <abbr title="Metronome Mark">MM</abbr> Source
        </i>
      </h2>
      <p>
        In this section you will describe, in order, the <i>pieces</i> that are
        part of your{" "}
        <i>
          <abbr title="Metronome Mark">MM</abbr> Source.
        </i>
      </p>
      <h3>For a given piece</h3>
      <ol>
        <li>
          {/*<p>*/}
          {`- You will first search for it in the data we already have. If you don't find it there, you will have to register it.`}
          {/*</p>*/}
        </li>
        <li>
          {/*<p>*/}
          {`- Then, the piece already exist in the database, you will be presented with a list of versions that are already registered for it. If one correspond to your case, select it. If none of them correspond, or if the piece itself was not present in the database, you will describe the version you have in hand.`}
          {/*</p>*/}
        </li>
      </ol>
    </>
  ),
  4: <>Section 4 help</>,
  5: <>Section 5 help</>,
  6: <>Section 6 help</>,
};
