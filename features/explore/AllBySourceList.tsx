"use client";

import ShartWithNoteTypeFilter from "@/features/explore/ShartWithNoteTypeFilter";
import React, { useState } from "react";
import MMSourceSummary from "@/features/explore/MMSourceSummary";

export default function AllBySourceList({ mMSources, chartData, last }) {
  const [sortBySpeed, setSortBySpeed] = useState(false);

  return (
    <main className="p-8">
      <div className="flex justify-between items-center mb-4">
        <div>{`Data created in the last ${last} day${Number(last) > 1 ? "s" : ""}.`}</div>
      </div>

      <ShartWithNoteTypeFilter chartData={chartData} />

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Order segments by:</span>
        <div className="join">
          <button
            className={`btn btn-sm join-item ${!sortBySpeed ? "btn-primary" : "btn-outline"}`}
            onClick={() => setSortBySpeed(false)}
          >
            Source Order
          </button>
          <button
            className={`btn btn-sm join-item ${sortBySpeed ? "btn-primary" : "btn-outline"}`}
            onClick={() => setSortBySpeed(true)}
          >
            Speed (Distribution)
          </button>
        </div>
      </div>

      {mMSources.map((mMSource) => (
        <MMSourceSummary
          key={"comp-" + mMSource.id}
          mMSource={mMSource}
          sortBySpeed={sortBySpeed}
        />
      ))}
    </main>
  );
}
