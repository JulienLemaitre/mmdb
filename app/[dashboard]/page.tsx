import { FC } from "react";
import { Inter } from 'next/font/google'
import {db} from "@/lib/db";

const inter = Inter({ subsets: ['latin'] })

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

export default async function Home() {
const { persons } = await getData()
console.log(`[] persons :`, persons)
  return (
    <main className="p-8">
      {persons.map((person) => (
        <div key={person.id} className="my-16">
          <h1 className="text-3xl font-bold">{person.fullName}</h1>
          {person.compositions.map((piece) => (
            <div key={piece.id} className="my-8 border-solid border-l-4 border-l-emerald-500 pl-2">
              <h2 className="text-2xl font-bold">{piece.title}</h2>
                {/*<pre>{JSON.stringify(piece, null, 2)}</pre>*/}
              <div className="flex mb-4">
                {["yearOfComposition", "category"].map((key, index, array) => (
                  <>
                  <div key={key} className="mr-4">{key}: {piece[key]}</div>
                {
                  // Add separator if not last item
                  index !== Object.keys(array).length - 1 && (
                    <div className="mr-4">|</div>
                  )
                }
                  </>
                ))}
              </div>
              {piece.movements.sort((a, b) => a.rank - b.rank).map((movement) => (
                <div key={movement.id} className="flex">
                  <h3 className="text-xl my-1 flex-none pr-4">{movement.rank} - {movement.key}</h3>
                  <div className="">
                  {movement.sections.sort((a, b) => a.rank - b.rank).map((section, index, sectionList) => (
                    <div key={section.id}>
                      <h4 className="text-lg my-1 italic">{`${sectionList.length > 1 ? `${section.rank} - ` : ""}${section.tempoIndication?.baseTerm}`}</h4>
                      <div>
                        <div className="">metre : <b>{`${section.metreString !== `${section.metreNumerator}/${section.metreDenominator}` ? `${section.metreString} (${section.metreNumerator}/${section.metreDenominator})` : section.metreString}`}</b></div>

                      </div>

                      {
                        section.metronomeMarks.map((mm) => (
                        <>
                          <div key={mm.id} className="">
                            <div className="mr-4">{`${mm.beatUnit} = ${mm.bpm}`}</div>

                            {["fastestStructuralNote", "fastestStacattoNote", "fastestOrnamentalNote"].map((key, index) => (
                              <>
                              {
                                mm.notesPerSecond?.[key] && (
                                  <div key={key} className="mr-4">
                                    {key}: {mm.notesPerSecond[key]} ({mm.notes?.[key]})
                                  </div>
                                )
                              }
                              </>
                            ))}

                          </div>
                        </>
                        ))
                      }
                    </div>
                  ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </main>
  )
}
