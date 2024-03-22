"use client";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM from "@/utils/getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM";

export default function GlobalShart({ persons }) {
  // console.log(`[GlobalShart] persons :`, persons);
  let minDate: number = 2000;
  const data = persons.map((person) => {
    const personDataId = person.firstName + " " + person.lastName;
    const personData: { x: number; y: number }[] = [];
    person.compositions.forEach((piece) => {
      // console.log(`[] piece :`, piece)
      const pieceData: any = { x: piece.yearOfComposition };
      if (piece.yearOfComposition < minDate) {
        minDate = piece.yearOfComposition;
      }
      piece.pieceVersions.forEach((pv) => {
        pv.movements.forEach((mvt) => {
          mvt.sections.forEach((section) => {
            // console.log(`[GlobalShart] section :`, section);

            section?.metronomeMarks?.forEach((MM) => {
              const notesPerSecond =
                getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM({
                  metronomeMark: MM,
                  section,
                });
              for (const notesPerSecondElement in notesPerSecond) {
                // const noteType = notesPerSecondElement
                //   .replace(/fastest/g, "")
                //   .replace(/NotesPerSecond/g, "");
                // console.log(
                //   `[for in] noteType :`,
                //   noteType,
                //   notesPerSecond[notesPerSecondElement],
                // );
                pieceData.y = notesPerSecond[notesPerSecondElement];
                personData.push(pieceData);
              }
            });
          });
        });
      });
    });

    return {
      id: personDataId,
      data: personData,
    };
  });
  console.log(`[GlobalShart] data :`, data);
  console.log(`[GlobalShart] minDate :`, minDate);

  return (
    <ResponsiveScatterPlot
      data={data}
      margin={{ top: 60, right: 140, bottom: 70, left: 90 }}
      xScale={{ type: "linear", min: minDate, max: "auto" }}
      // xFormat=">-.2f"
      yScale={{ type: "linear", min: 0, max: "auto" }}
      // yFormat=">-.2f"
      blendMode="multiply"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        // orient: "bottom",
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "Year of composition",
        legendPosition: "middle",
        legendOffset: 46,
        truncateTickAt: 0,
      }}
      axisLeft={{
        // orient: "left",
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: "nb notes per second",
        legendPosition: "middle",
        legendOffset: -60,
        truncateTickAt: 0,
      }}
      legends={[
        {
          anchor: "bottom-right",
          direction: "column",
          justify: false,
          translateX: 130,
          translateY: 0,
          itemWidth: 100,
          itemHeight: 12,
          itemsSpacing: 5,
          itemDirection: "left-to-right",
          symbolSize: 12,
          symbolShape: "circle",
          effects: [
            {
              on: "hover",
              style: {
                itemOpacity: 1,
              },
            },
          ],
        },
      ]}
    />
  );
}
