"use client";

import { useState } from "react";
import MMSourceDetails from "@/components/MMSourceDetails";

export default function MMSourcesDetails({ mMSources }) {
  const [selectedMMSource, setSelectedMMSource] = useState(mMSources[0]);

  return (
    <>
      {mMSources.map((mMSource) => (
        <MMSourceDetails key={mMSource.id} mMSource={mMSource} />
      ))}
    </>
  );
}
