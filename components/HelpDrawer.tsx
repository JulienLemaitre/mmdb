import React from "react";
import XMarkIcon from "@/components/svg/XMarkIcon";

const HelpDrawer = () => {
  return (
    <div className="drawer-side">
      <label
        htmlFor="my-drawer-4"
        aria-label="close sidebar"
        className="drawer-overlay"
      ></label>
      <ul className="menu p-4 w-fit min-h-full bg-base-200 text-base-content">
        {/* Sidebar content here */}
        <div className="pb-2">
          <label
            htmlFor="my-drawer-4"
            className="drawer-button btn btn-link h-auto min-h-fit px-0 align-bottom"
          >
            <XMarkIcon className="w-7 h-7" />
          </label>
        </div>
        <div className="prose">
          <h2>{`First, some definitions`}</h2>
          <p>
            A <i>Metronome Mark</i> (
            <strong>
              <dfn id="definition-mm">
                <abbr title="Metronome Mark">MM</abbr>
              </dfn>
            </strong>
            ) is a combination of a <i>note value</i> and a pace expressed as{" "}
            <i>
              <abbr title="Beat Per Minute">BPM</abbr>
            </i>
            .
          </p>
          <p>
            A{" "}
            <strong>
              <dfn>Metronome Mark Source</dfn>
            </strong>{" "}
            is any document that includes a <i>Metronome Mark</i>. It will
            mostly be edtions, but it can be a letter or a diary for example.
          </p>
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
            : type, title, year of publication, link to online score.
          </p>
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
          <h2>
            3 - List the pieces that composes the{" "}
            <i>
              <abbr title="Metronome Mark">MM</abbr> Source
            </i>
          </h2>
          <p>
            You will list in order the <i>pieces</i> that appear in the{" "}
            <i>
              <abbr title="Metronome Mark">MM</abbr> Source.
            </i>
          </p>
          <p>
            If these pieces don&apos;t yet exist in our data, you will be guided
            to describe it in details.
          </p>
        </div>
      </ul>
    </div>
  );
};

export default HelpDrawer;
