"use client";

import React, { useCallback, useState } from "react";
import XMarkIcon from "@/ui/svg/XMarkIcon";
import { useFeedForm } from "@/context/feedFormContext";
import { stepHelpContent } from "@/features/feed/multiStepMMSourceForm/stepHelpContent";

const FeedFormHelpDrawer = () => {
  const { currentStepRank } = useFeedForm();
  const [activeHelpTabInternal, setActiveHelpTabInternal] = useState<
    "contextual" | "glossary"
  >("contextual");

  const SectionHelp = stepHelpContent[currentStepRank];

  const toggleSectionHelp = useCallback(() => {
    setActiveHelpTabInternal(
      !!SectionHelp && activeHelpTabInternal === "glossary"
        ? "contextual"
        : "glossary",
    );
  }, [SectionHelp, activeHelpTabInternal, setActiveHelpTabInternal]);

  const activeHelpTab = SectionHelp ? activeHelpTabInternal : "glossary";

  return (
    <div className="drawer-side" tabIndex={-1}>
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

        <div role="tablist" className="tabs tabs-bordered">
          {/* Contextual section help tab */}
          <input
            type="radio"
            name="help-aside-tab"
            role="tab"
            className="tab"
            aria-label="Section help"
            checked={activeHelpTab === "contextual"}
            onChange={toggleSectionHelp}
            disabled={!SectionHelp}
            tabIndex={-1}
          />
          <div role="tabpanel" className="tab-content py-6">
            <div className="prose w-full">{SectionHelp}</div>
          </div>

          {/* General glossary help */}
          <input
            type="radio"
            name="help-aside-tab"
            role="tab"
            className="tab"
            aria-label="Glossary"
            checked={activeHelpTab === "glossary"}
            onChange={toggleSectionHelp}
            tabIndex={-1}
          />
          <div role="tabpanel" className="tab-content py-6">
            <div className="prose">
              <p>
                A <i>Metronome Mark</i> (
                <strong>
                  <dfn id="def-mm">
                    <abbr title="Metronome Mark">MM</abbr>
                  </dfn>
                </strong>
                ) is a combination of <i>note value</i> and corresponding
                frequency per minute, measured in beats per minute (
                <i>
                  <abbr title="Beats Per Minute">BPM</abbr>
                </i>
                ).
              </p>
              <p>
                A{" "}
                <strong>
                  <dfn>
                    <abbr title="Metronome Mark">MM</abbr> Source
                  </dfn>
                </strong>{" "}
                is any document that provides a <i>metronome mark</i> for a
                given piece. In most cases, it will be editions of scores, but
                it can also be a letter or dairy in which the{" "}
                <i>metronome mark</i> is mentioned.
              </p>
              <p>
                A <abbr title="Metronome Mark">MM</abbr> Source{" "}
                <strong>
                  <dfn>Contribution</dfn>
                </strong>{" "}
                is any person or organization involved in the MM Source. One of
                the following roles needs to be selected: MM provider, arranger,
                editor, publisher, transcriber, translator. The most important
                role is the MM provider, who is the person that gave the MM to
                the piece in question.
              </p>
              <p>
                A{" "}
                <strong>
                  <dfn>Piece Version</dfn>
                </strong>{" "}
                is the structure of a piece, which consists of one or more
                movements (e.g., movements of a sonata or symphony). Each
                movement, in turn, is made up of one or more sections (e.g., the
                introduction of a movement and the main part)
              </p>
              <p>
                A{" "}
                <strong>
                  <dfn>Section</dfn>
                </strong>{" "}
                is defined by the following three characteristics:
              </p>
              <ul>
                <li>- Time signature</li>
                <li>- Tempo indication</li>
                <li>- Metronome mark</li>
              </ul>
              <p>
                If{" "}
                <strong>
                  any of the three characteristics above change, a new section
                  must be entered
                </strong>
                . For each section created, the maximum number of notes per bar
                for each structural, staccato, repeated and ornamental notes is
                entered. If the tempo indication changes within a sonata
                movement, but no new metronome mark is given, the section in
                question should be entered without a metronome mark.
              </p>
              <p>
                A{" "}
                <strong>
                  <dfn>Collection</dfn>
                </strong>{" "}
                consists of multiple pieces with the same opus number, e.g.,
                Beethoven’s Op.10 or Schumann’s Kinderszenen. The pieces in a
                collection are either separated by numbering (e.g., Op.10 No.1,
                Op.10 No.2, etc.) or by other means such as names
              </p>
            </div>
          </div>
        </div>
      </ul>
    </div>
  );
};

export default FeedFormHelpDrawer;
