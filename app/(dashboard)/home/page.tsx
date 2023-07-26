import {FC, Fragment} from "react";
// import { Inter } from 'next/font/google'
import {db} from "@/lib/db";
import {getNotesPerSecondsFromNoteValues} from "@/lib/notesCalculation";

// const inter = Inter({ subsets: ['latin'] })

const getData = async () => {
  const persons = await db.person.findMany({
    include: {
      compositions: {
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
          <h1 className="text-3xl font-bold">{person.fullName}</h1>
          {person.compositions.map((piece) => {
            const pieceSource = piece.sources[0]
            return (
              <div key={piece.id} className="my-8 border-solid border-l-4 border-l-emerald-500 pl-2">
                <h2 className="text-2xl font-bold">{piece.title}</h2>
                {/*<pre>{JSON.stringify(piece, null, 2)}</pre>*/}
                <div className="flex mb-4">
                  {["yearOfComposition", "category"].map((key, index, array) => (
                    <Fragment key={key}>
                      <div className="mr-4">{key}: {piece[key]}</div>
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
                  <div>
                    {piece.movements.sort((a, b) => a.rank - b.rank).map((movement) => (
                      <div key={movement.id} className="flex">
                        <h3
                          className="text-xl my-1 flex-none pr-4">{movement.rank} - {movement.key.replaceAll("_FLAT", "b").replaceAll("_SHARP", "#").split("_").map((w) => w.charAt(0) + w.substring(1).toLowerCase()).join(" ")}</h3>
                        <div className="">
                          {movement.sections.sort((a, b) => a.rank - b.rank).map((section, index, sectionList) => (
                            <div key={section.id}>
                              <h4
                                className="text-lg my-1 italic">{`${sectionList.length > 1 ? `${section.rank} - ` : ""}${section.tempoIndication?.baseTerm}`}</h4>
                              <div>
                                <div className="">metre
                                  : <b>{`${section.metreString !== `${section.metreNumerator}/${section.metreDenominator}` ? `${section.metreString} (${section.metreNumerator}/${section.metreDenominator})` : section.metreString}`}</b>
                                </div>

                              </div>

                              {
                                section.metronomeMarks.map((mm) => {
                                  let notesPerSecondComputed: any = null
                                  try {
                                    notesPerSecondComputed = getNotesPerSecondsFromNoteValues({ metronomeMark: mm })
                                  } catch (e: any) {
                                    console.log(`[Error] mm :`, e?.message, JSON.stringify(mm))
                                    notesPerSecondComputed = e?.message
                                  }

                                  return (
                                    <div key={mm.id}>
                                      <div className="mr-4">{`${mm.beatUnit} = ${mm.bpm}`}</div>

                                      {["fastestStructuralNote", "fastestStaccatoNote", "fastestOrnamentalNote"].map((keyBase, index) => {

                                        const fastestNote = mm.notesPerSecond?.[keyBase + 'PerSecond']
                                        const computedNotesPerSecond = notesPerSecondComputed?.[keyBase + 'PerSecond'] ? Math.round(notesPerSecondComputed[keyBase + 'PerSecond'] * 100) / 100 : null
                                        const isNotesPerSecondDiff = computedNotesPerSecond && Math.abs(mm.notesPerSecond?.[keyBase + 'PerSecond'] - computedNotesPerSecond) > 0.01

                                        if (mm.bpm === 108 || isNotesPerSecondDiff) {
                                          console.group(`-- ${isNotesPerSecondDiff ? 'isNotesPerSecondDiff' : 'BPM = 108 DEBUG'} --`)
                                          console.log(`[] mm.notesPerSecond?.[${keyBase + 'PerSecond'}] :`, mm.notesPerSecond?.[keyBase + 'PerSecond'])
                                          console.log(`[] notesPerSecondComputed?.[${keyBase + 'PerSecond'}] :`, notesPerSecondComputed?.[keyBase + 'PerSecond'])
                                          console.log(`[] section`, JSON.stringify(section))
                                          console.groupEnd()
                                        }

                                        return (
                                          <Fragment key={mm.id}>
                                            {
                                              mm.notesPerSecond?.[keyBase + 'PerSecond'] && (
                                                <div className="mr-4">
                                                  {keyBase}:
                                                  <span className={`${fastestNote >= 15 ? "bg-red-500" : fastestNote >= 11 ? "bg-orange-400" : fastestNote >= 8 ? "bg-amber-200" : "bg-white"} px-2`}>{mm.notesPerSecond[keyBase + 'PerSecond']}</span>
                                                  (
                                                  <span className={!mm.noteValues?.[keyBase + 'Value'] ? "text-red-500" : ""}>{mm.noteValues?.[keyBase + 'Value'] || "Unable to find note value"}</span>
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
                                              )
                                            }
                                          </Fragment>
                                        )
                                      })}
                                    </div>
                                  )
                                })
                              }
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
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
                          <div className="mr-4">{contribution.person?.fullName || contribution.organization?.name}</div>
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
