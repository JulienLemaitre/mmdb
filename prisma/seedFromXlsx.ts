import {db} from "@/lib/db";
import {BEAT_UNIT, KEY, SOURCE_TYPE, CONTRIBUTION_ROLE, PIECE_CATEGORY} from "@prisma/client";
import {getNotesFromNotesPerSecond, noteDurationValue, noteDurationValueKeys} from "@/lib/notesCalculation";

const fs = require('fs');
const path = require('path');
const util = require('util')
const readXlsxFile = require('read-excel-file/node')

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

const beatUnitXlsToNorm: {[k: string]: string} = {}
  Object.keys(BEAT_UNIT).forEach((beatUnit: string, index) => {
    let isDotted = beatUnit.startsWith("DOTTED_")
    if (beatUnit.startsWith("DOTTED_")) {
      isDotted = true
    }
    if (index < 9) {
      const beatUnitBase = isDotted ? beatUnit.split("_")[1] : beatUnit
      const newKey = `${isDotted ? "Dotted " : ""}${beatUnitBase.substring(0,1)}`
      beatUnitXlsToNorm[newKey] = beatUnit
    }
  })
console.log(`[] beatUnitXlsToNorm :`, beatUnitXlsToNorm)

const directoryPath = path.join(__dirname, "ArjunData", "20230319_MM_folders", "19th Century Composers", "Beethoven");
// const directoryPath = path.join(__dirname, "ArjunData", "20230319_MM_folders", "19th Century Composers", "Beethoven", "Orchestral ");
// const directoryPath = path.join(__dirname, '/ArjunData/20230319_MM_folders/19th Century Composers/Beethoven/Orchestral');
console.log(`directoryPath :`, directoryPath)

const noteNotFoundList: any[] = []

function structuralNoteParsing(value: any) {
  if (typeof value === "number") {
    return value
  }
  if (typeof value === "string") {
    const notePerSecond = value.split("(")[0].trim()
    return notePerSecond
  }
}

const schema = {
  'Composer': {
    prop: 'composer',
    type: String,
  },
  'Title': {
    prop: 'title',
    type: String,
  },
  'Year of Composition': {
    prop: 'yearOfComposition',
    type: String,
  },
  'Year of Publication': {
    prop: 'yearOfPublication',
    type: String,
  },
  'Publisher': {
    prop: 'publisher',
    type: String,
  },
  'Editor': {
    prop: 'editor',
    type: String,
  },
  'Movement of Work': {
    prop: 'movement',
    type: String,
  },
  'Key': {
    prop: 'key',
    type: String,
  },
  'Tempo Indication': {
    prop: 'tempoIndication',
    type: String,
  },
  'Metre': {
    prop: 'metre',
    type: (value: any) => {
      if (typeof value === 'string') {
        // console.log(`[PARSE] Mettre value is string: ${value}`)
        return value
      }
      if (value instanceof Date) {
        // console.log(`[PARSE] Mettre value as date: ${value}`)
        const day = value.getDate()
        const month = value.getMonth() + 1
        if (day && month) {
          return `${month}/${day}`
        }
      }
      throw new Error(`[UNPARSABLE] Mettre value is not string or date: ${value}`)
    },
  },
  'Metronome Marking': {
    prop: 'metronomeMarking',
    type: String,
  },
  'Fastest Structural Notes (notes/s)': {
    prop: 'fastestStructuralNote',
    type: structuralNoteParsing,
  },
  'Fastest Stacatto Notes (notes/s)': {
    prop: 'fastestStacattoNote',
    type: structuralNoteParsing,
  },
  'Fastest Ornamental Notes (notes/s)': {
    prop: 'fastestOrnamentalNote',
    type: structuralNoteParsing,
  },
  'Additional Notes': {
    prop: 'additionalNotes',
    type: String,
  },
  'Link': {
    prop: 'link',
    type: String,
  }
}

async function readExcelFile(filePath: string) {
  // @ts-ignore
  const workbook = await readXlsxFile(filePath, { schema }).then(({ rows, errors }) => {
    if (errors?.length > 0) {
      console.log(`[readExcelFile] errors :`, errors)
    }
    return rows
  });
return workbook
}

const category: {[key: string]: PIECE_CATEGORY} = {
  Chamber: PIECE_CATEGORY.CHAMBER_INSTRUMENTAL,
  Keyboard: PIECE_CATEGORY.KEYBOARD,
  Orchestral: PIECE_CATEGORY.ORCHESTRAL,
  Vocal: PIECE_CATEGORY.VOCAL,
}

async function traverseDirectory(directory: string) {
  let dataSheetList: any[] = []
  const files = await readdir(directory);
  console.log(`[traverseDirectory] files :`, files)
  for (const file of files) {
    const filePath = path.join(directory, file);
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      console.log(`>> directory: ${filePath}`)
      const subDataSheetList = await traverseDirectory(filePath);
      dataSheetList = [...dataSheetList, ...subDataSheetList]
      // console.log(`[traverseDirectory] subDataSheetList.length :`, subDataSheetList.length)
      // console.log(`[traverseDirectory] dataSheetList.length :`, dataSheetList.length)
    } else if (path.extname(filePath) === '.xlsx') {
      console.log(`- file: ${filePath}`)
      const categoryKey = Object.keys(category).find((key) => filePath.includes(key))
      if (!categoryKey) {
        throw new Error(`[ERROR] categoryKey not found for ${filePath}`)
      }
      const pieceListCategory = category[categoryKey]
      // console.log(`[] pieceListCategory :`, pieceListCategory)
      const singleSheetData = await readExcelFile(filePath);
      // console.log(`[traverseDirectory] singleSheetData`, singleSheetData.map((data: any) => JSON.stringify(data)))
      // console.log(`[] singleSheetData`, JSON.stringify(singleSheetData, ["title", "movement", "metre"], 2))
      dataSheetList.push({pieceListCategory, data: singleSheetData})
    }
  }
  // console.log(`[RETURN] dataSheetList.length :`, dataSheetList.length)
  return dataSheetList
}

async function getXlsxDatas() {
  const dataSheetList = await traverseDirectory(directoryPath)
  // console.log(`[getXlsxDatas] dataSheetList.length :`, dataSheetList.length)
  return dataSheetList
}

async function processDataFromXlsx(dataSheetList: any) {
  const pieceList: any[] = []
  const metronomeMarkList: any[] = []
  dataSheetList.forEach(({pieceListCategory, data}) => {
    // Single Excel file data
    const dataSheet = data
    let piece: any
    let movement: any
    dataSheet.forEach((rowData: any) => {
      // Single row data
      const isPieceDescription = rowData.hasOwnProperty('composer')
      const isMovement = rowData.hasOwnProperty('movement')
      const isSectionDescription = rowData.hasOwnProperty('tempoIndication')

      if (isPieceDescription) {
        // Push remaining movement in precedent piece
        if (movement) {
          if (piece?.movements) {
            piece.movements.push(movement)
          } else {
            piece.movements = [movement]
          }
          movement = null
        }

        // NEW piece
        if (piece) {
          pieceList.push(piece)
          piece = null
        }
        // Generate yearOfComposition as number from string. If "(" is found in original string, take into account only the first part of the string
        const yearOfComposition = rowData.yearOfComposition.includes('(') ? rowData.yearOfComposition.split('(')[0] : rowData.yearOfComposition

        piece = {
          title: rowData.title,
          category: pieceListCategory,
          composer: rowData.composer,
          yearOfComposition: parseInt(yearOfComposition, 10),
        }

        // NEW source
        const source = {
          type: SOURCE_TYPE.EDITION,
          ...(rowData.link && {link: rowData.link}),
          year: typeof rowData.yearOfPublication === 'number' ? rowData.yearOfPublication : parseInt(rowData.yearOfPublication),
          contributions: [],
        }
        if (rowData.publisher && rowData.publisher !== 'N/A') {
          const publisherContribution = {
            role: CONTRIBUTION_ROLE.PUBLISHER,
            organization: {
              name: rowData.publisher,
            }
          }
          source.contributions.push(publisherContribution)
        }
        if (rowData.editor && rowData.editor !== 'N/A') {
          const editorContribution = {
            role: CONTRIBUTION_ROLE.EDITOR,
            organization: {
              name: rowData.editor,
            }
          }
          source.contributions.push(editorContribution)
        }
        piece.source = source
      }

      if (isMovement) {
        // NEW movement

        if (rowData.movement) {
          if (movement) {
            if (piece?.movements) {
              piece.movements.push(movement)
            } else {
              piece.movements = [movement]
            }
          }
          movement = {
            rank: (piece?.movements || []).length + 1,
            key: getKeyEnumFromKeyString(rowData.key),
            sections: [],
          }
        }
      }

      if (isSectionDescription) {

        const fastestStructuralNote = rowData.fastestStructuralNote
        const fastestStacattoNote = rowData.fastestStacattoNote
        const fastestOrnamentalNote = rowData.fastestOrnamentalNote

        // NEW section
        const section = {
          rank: (movement?.sections || []).length + 1,
          tempoIndication: rowData.tempoIndication,
          metreString: rowData.metre,
          metreNumerator: rowData.metre === 'C' ? 4 : Number(rowData.metre.split('/')[0]),
          metreDenominator: rowData.metre === 'C' ? 4 : Number(rowData.metre.split('/')[1]),
          fastestStructuralNote,
          fastestStacattoNote,
          fastestOrnamentalNote,
        }


        // NEW metronomeMark
        const beatUnitXls = rowData.metronomeMarking.split('=')[0].trim()
        const beatUnitXlsCleanKey = Object.keys(beatUnitXlsToNorm).find((bu) => beatUnitXls.startsWith(bu))
        if (!beatUnitXlsCleanKey) {
          throw new Error(`beatUnitXlsCleanKey not found for ${beatUnitXls}`)
        }
        const beatUnit = beatUnitXlsToNorm[beatUnitXlsCleanKey] as BEAT_UNIT
        const bpmString = rowData.metronomeMarking.split('=')[1].trim()
        const bpm = Number(bpmString)
        const notes = getNotesFromNotesPerSecond({
          metronomeMark: {
            beatUnit,
            bpm,
            notesPerSecond: {fastestStructuralNote, fastestStacattoNote, fastestOrnamentalNote}
          }, section: {metreDenominator: rowData.metre === 'C' ? 4 : Number(rowData.metre.split('/')[1])}
        })
        // @ts-ignore
        if (Object.keys(notes).some((note) => notes[note] === null)) {
          noteNotFoundList.push({
            pieceName: piece.title,
            movement: {
              rank: movement?.rank,
              key: movement?.key,
            },
            section: {
              rank: section?.rank,
              tempoIndication: section?.tempoIndication,
            },
            metronomeMark: {
              beatUnit,
              bpm,
              notes,
              notesPerSecond: {
                fastestStructuralNote,
                fastestStacattoNote,
                fastestOrnamentalNote
              },
            }
          })
        }
        const metronomeMark = {
          beatUnit,
          bpm,
          notes,
          notesPerSecond: {
            fastestStructuralNote,
            fastestStacattoNote,
            fastestOrnamentalNote
          },
        }
        metronomeMarkList.push(metronomeMark)

        if (movement) {
          movement.sections.push(section)
        } else if (piece.sections) {
          piece.sections.push(section)
        } else {
          piece.sections = [section]
        }
      }
    })
    if (movement) {
      if (piece?.movements) {
        piece.movements.push(movement)
      } else {
        piece.movements = [movement]
      }
      movement = null
    }
    pieceList.push(piece)
  })

  if (noteNotFoundList.length > 0) {
    console.log(`---------------------------------------`)
    console.log(`[FINAL] noteNotFoundList`, JSON.stringify(noteNotFoundList, null, 2))
    // console.log(`[] noteDurationValue :`, noteDurationValue)
    // const orderedNoteDurationValue = Object.values(noteDurationValue).sort((a, b) => a - b)
    // console.log(`[] orderedNoteDurationValue :`, orderedNoteDurationValue)
    // console.log(`[] noteDurationValue :`, orderedNoteDurationValue.map((v, index) => `${noteDurationValueKeys.find((k) => noteDurationValue[k] === v)} : ${v} (${v - orderedNoteDurationValue[index - 1]})`))
  }
  return {pieceList, metronomeMarkList, noteNotFoundList}
}

async function main() {
  const datasFromXlsxFiles = await getXlsxDatas()
  const {pieceList, metronomeMarkList, noteNotFoundList} = await processDataFromXlsx(datasFromXlsxFiles)
  const sectionList = pieceList.reduce((acc, piece) => {
    let pieceSections = []
    let movementSections = []
    if (piece.sections) {
      pieceSections = piece.sections
    }
    if (piece.movements) {
     movementSections = piece.movements.reduce((acc, movement) => {
      return [...acc, ...movement.sections]
    }, [])
    }
    return [...acc, ...pieceSections, ...movementSections]
  }, [])
  console.log(`[MAIN] counts :`, {pieceList: pieceList.length, sectionList: sectionList.length, metronomeMarkList: metronomeMarkList.length, noteNotFoundList: noteNotFoundList.length})
  await seedDB({pieceList, metronomeMarkList, noteNotFoundList})
.then(async () => {
  await db.$disconnect();
})
.catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
}

main().then(() => {
  console.log("Done")
}).catch((e) => {
  console.error(e)
})


function getKeyEnumFromKeyString(keyString: string) {
  const keyStringArray = keyString.split(' ')
  // If keyString is 'C major', keyStringArray = ['C', 'major']

  // If first part ends with 'b', it is a flat key. 'b' is replaced by '_FLAT' in the key name
  if (keyStringArray[0].endsWith('b')) {
    keyStringArray[0] = keyStringArray[0].replace('b', '_FLAT')
  }
  // If first part ends with '#', it is a sharp key. '#' is replaced by '_SHARP' in the key name
  if (keyStringArray[0].endsWith('#')) {
    keyStringArray[0] = keyStringArray[0].replace('#', '_SHARP')
  }
  const key = keyStringArray[0].toUpperCase()
  const mode = keyStringArray[1].toUpperCase()
  // @ts-ignore
  const keyEnum = KEY[`${key}_${mode}`]
  return keyEnum
}

async function seedDB({pieceList, metronomeMarkList, noteNotFoundList}: {pieceList: any[], metronomeMarkList: any[], noteNotFoundList: any[]}) {
  console.log(`-------- START - seedDB --------`)
  const taskList = pieceList.map((piece, index) => {
    return async function () {
      // console.log(`[TASK] piece`, JSON.stringify(piece, null, 2))
      if (index === 0) {
        console.log(`[TASK] piece`, JSON.stringify(piece, null, 2))
      }
      const persistedPiece = await db.piece.create({
        data: {
          title: piece.title,
          category: piece.category,
          yearOfComposition: piece.yearOfComposition,
          composer: {
            connectOrCreate: {
              where: {
                fullName: piece.composer,
              },
              create: {
                fullName: piece.composer,
                // birthYear: piece.composer.birthYear,
                // deathYear: piece.composer.deathYear,
              },
            },
          },
          movements: {
            create: piece.movements.map((movement) => {
              return {
                rank: movement.rank,
                key: movement.key,
                sections: {
                  create: movement.sections.map((section) => {
                    return {
                      rank: section.rank,
                      metreString: section.metreString,
                      metreNumerator: section.metreNumerator,
                      metreDenominator: section.metreDenominator,
                      tempoIndication: {
                        connectOrCreate: {
                          where: {
                            baseTerm: section.tempoIndication,
                          },
                          create: {
                            baseTerm: section.tempoIndication,
                          }
                        }
                      },
                    }
                  }),
                },
              }
            }),
          },
        },
        include: {
          movements: {
            include: {
              sections: {
                include: {
                  tempoIndication: true,
                }
              }
            }
          }
        }
      })
      // console.log(`[] persistedPiece`, JSON.stringify(persistedPiece, null, 2))
      return persistedPiece
    }
  })
  const persistedPieceList: any[] = []
  for (const task of taskList) {
    persistedPieceList.push(await task())
  }

  persistedPieceList.forEach((piece) => {
      console.log(`[] persistedPiece`, JSON.stringify(piece, null, 2))
  })
  console.log(`-------- END - seedDB --------`)
}


//
// seedDB()
// .then(async () => {
//   await db.$disconnect();
// })
// .catch(async (e) => {
//   console.error(e);
//   await db.$disconnect();
//   process.exit(1);
// });