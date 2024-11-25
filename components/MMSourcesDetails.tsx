"use client";

import { useState } from "react";
import MMSourceDetails from "@/components/MMSourceDetails";

export default function MMSourcesDetails({ mMSources }) {
  const [selectedMMSource, setSelectedMMSource] = useState(mMSources[0]);

  return (
    <>
      {mMSources.map((mMSource) => {
        // console.log("comp-" + mMSource.id);
        return (
          <MMSourceDetails key={"comp-" + mMSource.id} mMSource={mMSource} />
        );
      })}
    </>
  );
}
