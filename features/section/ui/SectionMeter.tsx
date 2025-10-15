import React from "react";
import CommonTimeIcon from "@/ui/svg/CommonTimeIcon";
import CutTimeIcon from "@/ui/svg/CutTimeIcon";

function SectionMeter({ section }) {
  const { isCommonTime, isCutTime } = section;
  const isCommonOrCutTime = isCommonTime || isCutTime;

  return isCommonOrCutTime ? (
    <>
      <span className="common-time align-middle inline-block">
        {isCommonTime ? (
          <CommonTimeIcon className="h-3.5 relative bottom-0.5" />
        ) : (
          <CutTimeIcon className="h-5 relative bottom-0.5" />
        )}
      </span>
      <b>{` (${section.metreNumerator}/${section.metreDenominator})`}</b>
    </>
  ) : (
    <b>{`${section.metreNumerator}/${section.metreDenominator}`}</b>
  );
}

export default SectionMeter;
