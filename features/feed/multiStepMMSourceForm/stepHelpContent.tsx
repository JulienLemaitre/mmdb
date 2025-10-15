import React from "react";

export const stepHelpContent = {
  // Source description
  1: (
    <>
      <h2>
        2 -{" "}
        <i>
          <abbr title="Metronome Mark">MM</abbr> Source
        </i>{" "}
        description
      </h2>
      <p>
        In this interface, you enter information about the source that provided
        the metronome mark, such as the type of source, the year of publication,
        the link to the online score, and possible references like an ISBN
        number. If possible, please use a link to IMSLP. Ensure the link leads
        directly to the score you are using to enter the data. The link should
        work as in the example provided here:
        https://ks.imslp.info/files/imglnks/usimg/3/34/IMSLP677693-PMLP4920-Grand_septuor_0001-converted-compressed.pdf
      </p>
    </>
  ),
  // contributions
  2: (
    <>
      <h2>
        3 -{" "}
        <i>
          <abbr title="Metronome Mark">MM</abbr> Source contributors
        </i>
      </h2>
      <p>
        In this interface, you enter information about the{" "}
        <i>
          <abbr title="Metronome Mark">MM</abbr> Source
        </i>{" "}
        contributors and their respective roles. A contributor can either be a
        person or an organization and can have different roles, such as editor,
        publisher, etc. Composers are not included in this overview unless they
        fulfill another role, such as metronome mark provider
      </p>
    </>
  ),
  // Pieces and versions
  3: (
    <>
      <h2>4 - Pieces and Versions</h2>
      <p>
        In this interface, you enter information about the pieces that are part
        of your{" "}
        <i>
          <abbr title="Metronome Mark">MM</abbr> Source.
        </i>
      </p>
      <h3>For each piece, follow these steps:</h3>
      <ol>
        <li>{`1. Search for the piece in the existing data.`}</li>
        <li>
          {`2. If it does not exist yet, please register the piece you have in front of you as a new piece in the database.`}
        </li>
        <li>
          {`3. If it already exists, you will be presented with all versions in which this piece has been entered. If one of the existing versions corresponds with the score in front of you, select it. If none of them represent your score, enter a new piece version based on the score in front of you.`}
        </li>
      </ol>
      <p>Approach similarly for the composer.</p>
    </>
  ),
  4: (
    <>
      <h2>5 - Enter metronome marks</h2>
      <p>
        In this interface, you enter information about the metronome marks
        provided for the piece. Select the note value and enter the beats per
        minute for each metronome mark from the score. Each movement and section
        entered for the piece is listed separately with the corresponding tempo
        indication. If a section has no metronome mark, select “No Metronome
        Mark”.
      </p>
    </>
  ),
  5: (
    <>
      <h2>6 - Summary</h2>
      <p>
        In this interface, you are shown a summary of the data that you have
        entered in the previous interfaces, along with the calculated notes per
        second for the different fastest notes you have entered. Please
        double-check if everything has been entered correctly. Afterwards press
        the “Save the complete Metronome Mark Source” button to save the data in
        the database
      </p>
    </>
  ),
  // 6: <>Section 6 help</>,
};
