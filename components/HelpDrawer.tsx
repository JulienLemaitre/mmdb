"use client";

import React, { useEffect, useState } from "react";
import XMarkIcon from "@/components/svg/XMarkIcon";
import { useFeedForm } from "@/components/context/feedFormContext";
import { stepHelpContent } from "@/components/multiStepMMSourceForm/stepHelpContent";

const HelpDrawer = () => {
  const { currentStepRank } = useFeedForm();
  const [isSectonHelpChecked, setIsSectonHelpChecked] = useState(true);
  const toggleSectionHelp = () => {
    setIsSectonHelpChecked(!isSectonHelpChecked);
  };

  useEffect(() => {
    // When we change the form step, we check the section help only if it exists
    setIsSectonHelpChecked(!!stepHelpContent[currentStepRank]);
  }, [currentStepRank]);

  const SectionHelp = stepHelpContent[currentStepRank];

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

        <div role="tablist" className="tabs tabs-bordered">
          {/* Contextual section help tab */}
          <input
            type="radio"
            name="help-aside-tab"
            role="tab"
            className="tab"
            aria-label="Section help"
            checked={isSectonHelpChecked}
            onChange={toggleSectionHelp}
            disabled={!SectionHelp}
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
            checked={!isSectonHelpChecked}
            onChange={toggleSectionHelp}
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
                ) is a combination of a <i>note value</i> and a pace expressed
                as{" "}
                <i>
                  <abbr title="Beat Per Minute">BPM</abbr>
                </i>
                .
              </p>
              <p>
                A{" "}
                <strong>
                  <dfn>
                    <abbr title="Metronome Mark">MM</abbr> Source
                  </dfn>
                </strong>{" "}
                is any document that includes a <i>Metronome Mark</i>. It will
                mostly be editions, but it can be a letter or a diary for
                example.
              </p>
              <p>
                A <abbr title="Metronome Mark">MM</abbr> Source{" "}
                <strong>
                  <dfn>Contribution</dfn>
                </strong>{" "}
                is a person or a company involved in the MM Source. It must have
                a specific role from this list : MM provider, arranger, editor,
                publisher, transcriber, translator. The MM Provider role is
                important and give the possibility to indicate that the composer
                or any other person is the provider of the MM Source.
              </p>
              <p>
                A{" "}
                <strong>
                  <dfn>Piece Version</dfn>
                </strong>{" "}
                is the structure of a the piece in terms of movements (if any)
                and sections.
              </p>
              <p>
                A{" "}
                <strong>
                  <dfn>Section</dfn>
                </strong>{" "}
                is defined by three characteristics:
              </p>
              <ul>
                <li>time signature</li>
                <li>tempo indication</li>
                <li>metronome mark</li>
              </ul>
              <p>
                Each time one of them changes, you need to define a new section.
                For each section created, you will register the maximum number
                of notes per bar concerning structural, staccato, repeated and
                ornamental notes.
              </p>
            </div>
          </div>
        </div>
      </ul>
    </div>
  );
};

export default HelpDrawer;
