import getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM from "@/utils/getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM";
import { ChartDatum } from "@/types/chartTypes";

type GetChartDataFromMMSourcesProps = {
  mMSources?: any[];
};

export default function getChartDataFromMMSources({
  mMSources,
}: GetChartDataFromMMSourcesProps): ChartDatum[] {
  if (!mMSources || !Array.isArray(mMSources)) {
    console.error("[getChartDataFromMMSources] Invalid mMSources input");
    return [];
  }

  let minDate: number = 2000;
  let maxDate: number = 1000;
  let maxNotesPerSecond: number = 0;
  const chartData: ChartDatum[] = [];

  mMSources.forEach((mMSource, index) => {
    mMSource.pieceVersions.forEach((pvs) => {
      const piece = pvs.pieceVersion.piece;
      if (
        typeof piece.yearOfComposition === "number" &&
        piece.yearOfComposition < minDate
      ) {
        minDate = piece.yearOfComposition;
        console.log(`[] minDate :`, minDate);
      }
      if (
        typeof piece.yearOfComposition === "number" &&
        piece.yearOfComposition > maxDate
      ) {
        maxDate = piece.yearOfComposition;
      }
      const composer = piece.composer;
      const composerName = composer.firstName + " " + composer.lastName;
      const hasMultipleMovements = pvs.pieceVersion.movements.length > 1;

      pvs.pieceVersion.movements.forEach((mvt) => {
        const hasMultipleSections = mvt.sections.length > 1;

        mvt.sections.forEach((section) => {
          section?.metronomeMarks?.forEach((MM) => {
            const notesPerSecond =
              getNotesPerSecondCollectionFromNotesPerBarCollectionAndMM({
                metronomeMark: MM,
                section,
              });
            for (const notesPerSecondElement in notesPerSecond) {
              const noteType = notesPerSecondElement
                .replace(/fastest/g, "")
                .replace(/NotesPerSecond/g, "")
                .toLowerCase();
              const mmData: any = { xVal: piece.yearOfComposition };
              mmData.yVal = notesPerSecond[notesPerSecondElement];
              if (mmData.yVal > maxNotesPerSecond) {
                maxNotesPerSecond = mmData.yVal;
              }

              mmData.meta = {
                noteType,
                composer: composerName,
                piece: {
                  id: piece.id,
                  collectionId: piece.collectionId,
                  title: piece.title,
                  yearOfComposition: piece.yearOfComposition,
                },
                movement: {
                  ...(hasMultipleMovements ? { rank: mvt.rank } : {}),
                },
                section: {
                  ...(hasMultipleSections ? { rank: section.rank } : {}),
                  metreNumerator: section.metreNumerator,
                  metreDenominator: section.metreDenominator,
                  isCommonTime: section.isCommonTime,
                  isCutTime: section.isCutTime,
                  comment: section.comment,
                  tempoIndication: section.tempoIndication,
                },
                mm: MM,
              };
              chartData.push({
                noteType,
                ...mmData,
              });
            }
          });
        });
      });
    });
  });

  return chartData;
}
