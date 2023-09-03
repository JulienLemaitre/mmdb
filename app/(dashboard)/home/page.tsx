import {FC, Fragment} from "react";
// import { Inter } from 'next/font/google'
import {db} from "@/lib/db";
import {getNotesPerSecondsFromNotesPerBarAndMM, getNotesPerSecondsFromNoteValues} from "@/lib/notesCalculation";

// const inter = Inter({ subsets: ['latin'] })

const getData = async () => {
  const persons = await db.person.findMany({
    include: {
      compositions: {
        include: {
          pieceVersions: {
            include: {
              movements: {
                include: {
                  sections: {
                    include: {
                      tempoIndication: true,
                      metronomeMarks: {
                        include: {
                          source: true,
                        }
                      }
                    }
                  }
                }
              },
              sources: {
                include: {
                  contributions: {
                    include: {
                      person: true,
                      organization: true,
                    }
                  }
                }
              }
            }
          }
        }
      },
    }
  })
  return { persons }
}

export default async function Page() {
  const { persons } = await getData()

  return (
    <main className="p-8">
      {persons.map((person) => (
        <div key={person.id} className="my-16">
          <h1 className="text-3xl font-bold">{`${person.firstName} ${person.lastName}`}</h1>
          {person.compositions.map((piece) => {
            // console.log(`[Home] piece :`, piece)
            const pieceVersion = piece.pieceVersions[0]
            const pieceSource = pieceVersion.sources[0]
            return (
              <div key={pieceVersion.id} className="my-8 border-solid border-l-4 border-l-emerald-500 pl-2">
                <h2 className="text-2xl font-bold">{piece.title}</h2>
                {/*<pre>{JSON.stringify(piece, null, 2)}</pre>*/}
                <div className="flex mb-4">
                  {["yearOfComposition", "category"].map((key, index, array) => (
                    <Fragment key={key}>
                      <div className="mr-4">{key}: {pieceVersion[key]}</div>
                      {
                        // Add separator if not last item
                        index !== Object.keys(array).length - 1 && (
                          <div className="mr-4">|</div>
                        )
                      }
                    </Fragment>
                  ))}
                </div>
                <div className="flex mb-4">
                  <div className="w-1/2">
                    {pieceVersion.movements.sort((a, b) => a.rank - b.rank).map((movement, movementIndex) => (
                      <div key={movement.id} className="flex">
                        <h3
                          className="text-xl my-1 flex-none pr-4">{movement.rank} - {movement.key.replaceAll("_FLAT", "b").replaceAll("_SHARP", "#").split("_").map((w) => w.charAt(0) + w.substring(1).toLowerCase()).join(" ")}</h3>
                        <div className="">
                          {movement.sections.sort((a, b) => a.rank - b.rank).map((section, sectionIndex, sectionList) => {
                            const { isCommonTime, isCutTime } = section
                            const isCommonOrCutTime = isCommonTime || isCutTime
                            return (
                              <div key={section.id}>
                                <h4
                                  className="text-lg my-1 italic">{`${sectionList.length > 1 ? `${section.rank} - ` : ""}${section.tempoIndication?.text}`}</h4>
                                <div className="border-b-2 border-gray-200">
                                  <div className="">metre
                                    : <b>{isCommonOrCutTime ? (<><span className="common-time align-middle">{isCommonTime ? `\u{1D134}` : `\u{1D135}`}</span>{` (${section.metreNumerator}/${section.metreDenominator})`}</>) : `${section.metreNumerator}/${section.metreDenominator}`}</b>
                                  </div>
                                  {
                                    section.fastestStructuralNotePerBar && (
                                      <div className="">fastest structural note per bar: <b>{section.fastestStructuralNotePerBar}</b></div>
                                    )
                                  }
                                  {
                                    section.fastestRepeatedNotePerBar && (
                                      <div className="">fastest repeated note per bar: <b>{section.fastestRepeatedNotePerBar}</b></div>
                                    )
                                  }
                                  {
                                    section.fastestStaccatoNotePerBar && (
                                      <div className="">fastest staccato note per bar: <b>{section.fastestStaccatoNotePerBar}</b></div>
                                    )
                                  }
                                  {
                                    section.fastestOrnamentalNotePerBar && (
                                      <div className="">fastest ornamental note per bar: <b>{section.fastestOrnamentalNotePerBar}</b></div>
                                    )
                                  }
                                </div>

                                {
                                  section.metronomeMarks.map((mm) => {
                                    let notesPerSecondComputedFromNotesPerBar: any = null
                                    let notesPerSecondComputed: any = null
                                    try {
                                      notesPerSecondComputed = getNotesPerSecondsFromNoteValues({metronomeMark: mm})
                                      notesPerSecondComputedFromNotesPerBar = getNotesPerSecondsFromNotesPerBarAndMM({ section, metronomeMark: mm })
                                    } catch (e: any) {
                                      console.group(`[Error] mm :`, e?.message)
                                      console.log(`[] ${person.firstName} ${person.lastName}: ${piece.title} - mvt#${movement.rank} - section#${section.rank}`)
                                      console.log(`[] mm`, JSON.stringify(mm))
                                      console.groupEnd()
                                      notesPerSecondComputed = e?.message
                                    }

                                    return (
                                      <div key={mm.id}>
                                        <div className="mr-4">{`${mm.beatUnit} = ${mm.bpm}`}</div>

                                        {["fastestStructuralNote", "fastestStaccatoNote", "fastestOrnamentalNote"].map((keyBase, index) => {

                                          const fastestNote = mm.notesPerSecond?.[keyBase + 'PerSecond']
                                          const computedNotesPerSecond = notesPerSecondComputed?.[keyBase + 'PerSecond'] ? Math.round(notesPerSecondComputed[keyBase + 'PerSecond'] * 100) / 100 : null
                                          const isNotesPerSecondDiff = computedNotesPerSecond && Math.abs(mm.notesPerSecond?.[keyBase + 'PerSecond'] - computedNotesPerSecond) > 0.01

                                          const computedNotesPerSecondFromNotePerBar = notesPerSecondComputedFromNotesPerBar?.[keyBase + 'PerSecond'] ? Math.round(notesPerSecondComputedFromNotesPerBar[keyBase + 'PerSecond'] * 100) / 100 : null
                                          const isNotesPerSecondFromNotePerBarDiff = computedNotesPerSecond && computedNotesPerSecondFromNotePerBar && Math.abs(computedNotesPerSecondFromNotePerBar - computedNotesPerSecond) > 0.01
                                          const hasDataInconsistency = (computedNotesPerSecond && !computedNotesPerSecondFromNotePerBar) || (!computedNotesPerSecond && computedNotesPerSecondFromNotePerBar)

                                          // if (mm.bpm === 108 || isNotesPerSecondDiff) {
                                          //   console.group(`-- ${isNotesPerSecondDiff ? 'isNotesPerSecondDiff' : 'BPM = 108 DEBUG'} --`)
                                          //   console.log(`[] mm.notesPerSecond?.[${keyBase + 'PerSecond'}] :`, mm.notesPerSecond?.[keyBase + 'PerSecond'])
                                          //   console.log(`[] notesPerSecondComputed?.[${keyBase + 'PerSecond'}] :`, notesPerSecondComputed?.[keyBase + 'PerSecond'])
                                          //   console.log(`[] section`, JSON.stringify(section))
                                          //   console.groupEnd()
                                          // }

                                          return (
                                            <Fragment key={mm.id}>
                                              {
                                                computedNotesPerSecondFromNotePerBar && (
                                                  <div className="mr-4">
                                                    {keyBase}:
                                                    <span
                                                      // className={`${isNotesPerSecondFromNotePerBarDiff ? "bg-red-500 text-white px-2" : ""} ml-1`}>
                                                      className={`${computedNotesPerSecondFromNotePerBar >= 15 ? "bg-red-500" : computedNotesPerSecondFromNotePerBar >= 11 ? "bg-orange-400" : computedNotesPerSecondFromNotePerBar >= 8 ? "bg-amber-200" : "bg-white"} px-2`}>
                                                      {computedNotesPerSecondFromNotePerBar} /s</span>
                                                  </div>
                                                )
                                              }
                                              {hasDataInconsistency && (
                                                <div className="mr-4 bg-red-500 py-4">
                                                  {`${keyBase}: INCONSISTENCY computedNotesPerSecond: ${JSON.stringify(computedNotesPerSecond)} | computedNotesPerSecondFromNotePerBar: ${JSON.stringify(computedNotesPerSecondFromNotePerBar)}`}
                                                </div>
                                              )}
                                              {
                                                    hasDataInconsistency || isNotesPerSecondFromNotePerBarDiff ? (
                                                  <div className="mr-4 text-gray-400">
                                                    OLD:
                                                    <span
                                                      className={`${fastestNote >= 15 ? "bg-red-500" : fastestNote >= 11 ? "bg-orange-400" : fastestNote >= 8 ? "bg-amber-200" : "bg-white"} px-2`}>{mm.notesPerSecond?.[keyBase + 'PerSecond']}</span>
                                                    (
                                                    <span
                                                      className={!mm.noteValues?.[keyBase + 'Value'] ? "text-red-500" : ""}>{mm.noteValues?.[keyBase + 'Value'] || "Unable to find note value"}</span>
                                                    {
                                                      computedNotesPerSecond && (
                                                        <span className="ml-1">
                                                          computed to<span
                                                          className={`${isNotesPerSecondDiff ? "bg-red-500 text-white px-2" : ""} ml-1`}>{computedNotesPerSecond}</span>
                                                        </span>
                                                      )
                                                    }
                                                    )
                                                  </div>
                                                    ) : null
                                              }

                                            </Fragment>
                                          )
                                        })}
                                      </div>
                                    )
                                  })
                                }
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="w-1/2">
                    <div className="ml-4 border-2 border-gray-300 rounded-2xl p-4">
                      <div className="flex">
                        <div className="mr-4">Source:</div>
                        <div>
                          <div className="text-gray-700">{pieceSource.year} - {pieceSource.type.toLowerCase()}</div>
                          {pieceSource.title && (<div className="text-gray-700">{pieceSource.title}</div>)}
                          {pieceSource.link && (<div className="text-gray-700"><a href={pieceSource.link} target="_blank">{pieceSource.link}</a></div>)}
                          {pieceSource.references && (<div className="text-gray-700">{JSON.stringify(pieceSource.references)}</div>)}
                        </div>
                      </div>
                      {pieceSource.contributions.map((contribution) => (
                        <div key={contribution.id} className="flex">
                          <div className="mr-4">{contribution.role.toLowerCase()}:</div>
                          <div className="mr-4">{contribution.person?.firstName ? (contribution.person?.firstName + contribution.person?.lastName) : contribution.organization?.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </main>
  )
}
