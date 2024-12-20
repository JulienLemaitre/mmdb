"use client";

import MMSourceDetails from "@/components/MMSourceDetails";

export default function MMSourcesDetails({ mMSources }) {
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
