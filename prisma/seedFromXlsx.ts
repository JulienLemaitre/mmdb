// import { hashPassword } from "@/lib/auth";
import {db} from "@/lib/db";
import {BEAT_UNIT, KEY, SOURCE_TYPE, CONTRIBUTION_ROLE} from "@prisma/client";
import {getNotesFromNotesPerSecond, noteDurationValue} from "@/lib/notesCalculation";

// import Papa from "papaparse";
// import { unlinkSync } from 'node:fs';

const fs = require('fs');
const path = require('path');
const util = require('util')
// const xlsx = require('xlsx');
const readXlsxFile = require('read-excel-file/node')

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

const beatUnitXlsToNorm: {[k: string]: string} = {}
  Object.keys(BEAT_UNIT).forEach((beatUnit: string, index) => {
    // console.log(`[] beatUnit :`, beatUnit)
    let isDotted = beatUnit.startsWith("DOTTED_")
    if (beatUnit.startsWith("DOTTED_")) {
      isDotted = true
    }
    if (index < 9) {
      const beatUnitBase = isDotted ? beatUnit.split("_")[1] : beatUnit
      // console.log(`[] beatUnitBase :`, beatUnitBase)
      const newKey = `${isDotted ? "Dotted " : ""}${beatUnitBase.substring(0,1)}`
      // console.log(`[] newKey :`, newKey)
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
    // console.log(`[PARSED] notePerSecond as string :`, notePerSecond, `from value :`, value)
    return notePerSecond
  }
  // throw new Error(`[UNPARSABLE] notePerSecond ${typeof value} : ${value}`)
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
          // console.log(`[PARSED] ${month}/${day}`)
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
  console.log(`-------- START - traverseDirectory --------`)
  // Using read-excel-file
  // @ts-ignore
  const workbook = await readXlsxFile(filePath, { schema }).then(({ rows, errors }) => {
    // console.log(`[] rows :`, rows)
    console.log(`[] errors :`, errors)
    return rows
  });
  console.log(`-------- END - traverseDirectory --------`)
return workbook
  // // Using SheetJS (xlsx)
  // const workbook = xlsx.readFile(filePath, {
  //   type: "string",
  //   cellNF: true,
  //   raw: true,
  // });
  // const sheetName = workbook.SheetNames[0];
  // const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  // return sheetData;
}

async function traverseDirectory(directory: string) {
  console.log(`-------- START - traverseDirectory --------`)
  // const readTaskList: any[] = []
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
      console.log(`[traverseDirectory] subDataSheetList.length :`, subDataSheetList.length)
      console.log(`[traverseDirectory] dataSheetList.length :`, dataSheetList.length)
    } else if (path.extname(filePath) === '.xlsx') {
      console.log(`- file: ${filePath}`)
      const singleSheetData = await readExcelFile(filePath);
      // console.log(`[traverseDirectory] singleSheetData`, singleSheetData.map((data: any) => JSON.stringify(data)))
      // console.log(`[] singleSheetData`, JSON.stringify(singleSheetData, ["title", "movement", "metre"], 2))
      dataSheetList.push(singleSheetData)
    }
  }
  console.log(`[RETURN] dataSheetList.length :`, dataSheetList.length)
  console.log(`-------- END - traverseDirectory --------`)
  return dataSheetList

  // fs.readdirSync(directory).forEach((file: string) => {
  //   const filePath = path.join(directory, file);
  //   if (fs.statSync(filePath).isDirectory()) {
  //     console.log(`>> directory: ${filePath}`)
  //     traverseDirectory(filePath);
  //   } else if (path.extname(filePath) === '.xlsx') {
  //     console.log(`- file: ${filePath}`)
  //
  //     // using async read-excel-file
  //     readTaskList.push(readExcelFile(filePath).then((singleSheetData: any) => {
  //       console.log(`[] singleSheetData`, singleSheetData)
  //       // console.log(`[] singleSheetData`, JSON.stringify(singleSheetData, ["title", "movement", "metre"], 2))
  //       dataSheetList.push(singleSheetData)
  //       // return singleSheetData
  //     }));
  //
  //     // using sync SheetJS (xlsx)
  //     // const singleSheetData = readExcelFile(filePath);
  //     // console.log(`[] singleSheetData`, singleSheetData)
  //     // dataSheetList.push(singleSheetData)
  //   }
  // });
  // const resultList = await Promise.all(readTaskList)
  // console.log(`[traverseDirectory] dataSheetList :`, dataSheetList)
  // console.log(`[traverseDirectory] resultList :`, resultList)
  // return resultList
}

// Promise.all([traverseDirectory(directoryPath)])
//   .then((taskList) => {
// console.log(`[] taskList.length :`, taskList.length)
// const dataSheetList = taskList?.[0]
// console.log(`[] dataSheetList.length :`, dataSheetList.length)
//   });

async function getXlsxDatas() {
  console.log(`-------- START - getXlsxDatas --------`)
  const dataSheetList = await traverseDirectory(directoryPath)
  console.log(`[getXlsxDatas] dataSheetList.length :`, dataSheetList.length)
  console.log(`-------- END - getXlsxDatas --------`)
  return dataSheetList
}

async function processDataFromXlsx(dataSheetList: any) {
  console.log(`-------- START - processDataFromXlsx --------`)
  const pieceList: any[] = []
  const metronomeMarkList: any[] = []
  dataSheetList.forEach((dataSheet: any) => {

    // Single Excel file data
    // console.log(`[] dataSheet`, JSON.stringify(dataSheet, null, 2))

    // {
    //   "Composer": "Beethoven, Ludwig van",
    //   "Title": "Symphony No.1, Op.21",
    //   "Year of Composition": 1800,
    //   "Year of Publication": "1809 (1817)",
    //   "Publisher": "Cianchettini & Sperati",
    //   "Editor": "N/A",
    //   "Link": "https://ks.imslp.info/files/imglnks/usimg/4/4a/IMSLP46060-PMLP01582-Op.21.pdf"
    // }
    let piece: any
    let movement: any
    dataSheet.forEach((rowData: any) => {
      // Single row data
      console.log(``)
      console.log(`-------------------------------------------`)
      console.log(`[ROW] data`, JSON.stringify(rowData, null, 2))
      const isPieceDescription = rowData.hasOwnProperty('composer')
      const isMovement = rowData.hasOwnProperty('movement')
      const isSectionDescription = rowData.hasOwnProperty('tempoIndication')
      // const isPieceDescription = rowData.hasOwnProperty('Composer')
      // const isMovement = rowData.hasOwnProperty('Movement of Work')
      // const isSectionDescription = rowData.hasOwnProperty('Tempo Indication') && !rowData.hasOwnProperty('Movement')
      console.log(`ROW IS, piece: ${isPieceDescription}, movement: ${isMovement}, section: ${isSectionDescription}`)

      if (isPieceDescription) {
        // Push remaining movement in precedent piece
        if (movement) {
          console.log(`[PUSH] movement`, JSON.stringify(movement))
          if (piece?.movements) {
            piece.movements.push(movement)
          } else {
            piece.movements = [movement]
          }
          movement = null
        }

        // NEW piece
        console.log(`[ - PIECE -]`)
        if (piece) {
          console.log(`[PUSH] Piece`, JSON.stringify(piece))
          pieceList.push(piece)
          piece = null
        }
        piece = {
          title: rowData.title,
          yearOfComposition: rowData.yearOfComposition,
          // yearOfComposition: rowData['Year of Composition'],
        }
        console.log(`[NEW] Piece`, JSON.stringify(piece))

        // NEW source
        const source = {
          type: SOURCE_TYPE.EDITION,
          ...(rowData.link && {link: rowData.link}),
          year: typeof rowData.yearOfPublication === 'number' ? rowData.yearOfPublication : parseInt(rowData.yearOfPublication),
          // year: typeof rowData['Year of Publication'] === 'number' ? rowData['Year of Publication'] : parseInt(rowData['Year of Publication']),
          contributions: [],
        }
        if (rowData.publisher && rowData.publisher !== 'N/A') {
        // if (rowData.Publisher && rowData.Publisher !== 'N/A') {
          const publisherContribution = {
            role: CONTRIBUTION_ROLE.PUBLISHER,
            organization: {
              name: rowData.publisher,
              // name: rowData.Publisher,
            }
          }
          console.log(`[PUSH] publisherContribution`, JSON.stringify(publisherContribution))
          source.contributions.push(publisherContribution)
        }
        if (rowData.editor && rowData.editor !== 'N/A') {
        // if (rowData.Editor && rowData.Editor !== 'N/A') {
          const editorContribution = {
            role: CONTRIBUTION_ROLE.EDITOR,
            organization: {
              name: rowData.editor,
              // name: rowData.Editor,
            }
          }
          console.log(`[PUSH] editorContribution`, JSON.stringify(editorContribution))
          source.contributions.push(editorContribution)
        }
        console.log(`[NEW] source`, JSON.stringify(source))
        piece.source = source
      }

      if (isMovement) {
        // NEW movement
        console.log(`[ -- MOVEMENT -- ] `)
        // {
        //   "Movement of Work": "i",
        //   "Key": "C major",
        //   "Tempo Indication": "Adagio",
        //   "Metre": "C",
        //   "Metronome Marking": "E = 88",
        //   "Fastest Structural Notes (notes/s)": 5.86,
        //   "Fastest Ornamental Notes (notes/s)": 5.86
        // },

        if (rowData.movement) {
        // if (rowData.hasOwnProperty('Movement of Work')) {
          if (movement) {
            console.log(`[PUSH] movement`, JSON.stringify(movement))
            if (piece?.movements) {
              piece.movements.push(movement)
            } else {
              piece.movements = [movement]
            }
          }
          movement = {
            rank: (piece?.movements || []).length + 1,
            key: getKeyEnumFromKeyString(rowData.key),
            // key: getKeyEnumFromKeyString(rowData.Key),
            sections: [],
          }
          console.log(`[NEW] movement`, JSON.stringify(movement))
        }
      }

      if (isSectionDescription) {
        // [ROW] data {
        //   "Movement of Work": "i",
        //   "Key": "C major",
        //   "Tempo Indication": "Adagio",
        //   "Metre": "C",
        //   "Metronome Marking": "E = 88",
        //   "Fastest Structural Notes (notes/s)": 5.86,
        //   "Fastest Ornamental Notes (notes/s)": 5.86
        // }

        const fastestStructuralNote = rowData.fastestStructuralNote
        const fastestStacattoNote = rowData.fastestStacattoNote
        const fastestOrnamentalNote = rowData.fastestOrnamentalNote
        // const fastestStructuralNote = rowData["Fastest Structural Notes (notes/s)"]
        // const fastestStacattoNote = rowData["Fastest Stacatto Notes (notes/s)"]
        // const fastestOrnamentalNote = rowData["Fastest Ornamental Notes (notes/s)"]

        // NEW section
        console.log(`[ --- SECTION --- ]`)
        const section = {
          rank: (movement?.sections || []).length + 1,
          tempoIndication: rowData.tempoIndication,
          metreString: rowData.metre,
          metreNumerator: rowData.metre === 'C' ? 4 : Number(rowData.metre.split('/')[0]),
          metreDenominator: rowData.metre === 'C' ? 4 : Number(rowData.metre.split('/')[1]),
          // tempoIndication: rowData['Tempo Indication'],
          // metreString: rowData["Metre"],
          // metreNumerator: rowData["Metre"] === 'C' ? 4 : Number(rowData.Metre.split('/')[0]),
          // metreDenominator: rowData["Metre"] === 'C' ? 4 : Number(rowData.Metre.split('/')[1]),
          fastestStructuralNote,
          fastestStacattoNote,
          fastestOrnamentalNote,
        }


        // NEW metronomeMark
        console.log(`[ -- METROMONE MARK -- ]`)
        const beatUnitXls = rowData.metronomeMarking.split('=')[0].trim()
        // const beatUnitXls = rowData["Metronome Marking"].split('=')[0].trim()
        // console.log(`[] beatUnitXls :`, beatUnitXls)
        const beatUnitXlsCleanKey = Object.keys(beatUnitXlsToNorm).find((bu) => beatUnitXls.startsWith(bu))
        // console.log(`[] beatUnitXlsCleanKey :`, beatUnitXlsCleanKey)
        if (!beatUnitXlsCleanKey) {
          throw new Error(`beatUnitXlsCleanKey not found for ${beatUnitXls}`)
        }
        const beatUnit = beatUnitXlsToNorm[beatUnitXlsCleanKey] as BEAT_UNIT
        const bpmString = rowData.metronomeMarking.split('=')[1].trim()
        // const bpmString = rowData["Metronome Marking"].split('=')[1].trim()
        // console.log(`[] bpmString :`, bpmString)
        const bpm = Number(bpmString)
        const notes = getNotesFromNotesPerSecond({
          metronomeMark: {
            beatUnit,
            bpm,
            notesPerSecond: {fastestStructuralNote, fastestStacattoNote, fastestOrnamentalNote}
          }, section: {metreDenominator: rowData.metre === 'C' ? 4 : Number(rowData.metre.split('/')[1])}
          // }, section: {metreDenominator: rowData["Metre"] === 'C' ? 4 : Number(rowData.Metre.split('/')[1])}
        })
        // console.log(`[] notes :`, notes)
        // @ts-ignore
        if (Object.keys(notes).some((note) => notes[note] === null)) {
          // console.log(`[] Note not found`, notes)
          noteNotFoundList.push({
            pieceName: piece.title,
            movement: {
              rank: movement?.rank,
              key: movement?.key,
            },
            section: {
              rank: section?.rank,
              tempoIndication: section?.tempoIndication,
              // metreString: section?.metreString,
              // metreNumerator: section?.metreNumerator,
              // metreDenominator: section?.metreDenominator,
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
        console.log(`[PUSH] MetronomeMark`, JSON.stringify(metronomeMark))
        metronomeMarkList.push(metronomeMark)

        console.log(`[PUSH NEW] section`, JSON.stringify(section))
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
      console.log(`[PUSH LAST] movement`, JSON.stringify(movement))
      if (piece?.movements) {
        piece.movements.push(movement)
      } else {
        piece.movements = [movement]
      }
      movement = null
    }
    console.log(`[PUSH] piece`, JSON.stringify(piece))
    pieceList.push(piece)
  })

  // console.log(`[FINAL] pieceList`, JSON.stringify(pieceList, null, 2))
  console.log(`---------------------------------------`)
  // console.log(`[FINAL] metronomeMarkList`, metronomeMarkList.map((mm) => JSON.stringify(mm, null, 2)))
  // console.log(`[FINAL] metronomeMarkList`, JSON.stringify(metronomeMarkList, null, 2))
  if (noteNotFoundList.length > 0) {
    console.log(`---------------------------------------`)
    console.log(`[FINAL] noteNotFoundList`, JSON.stringify(noteNotFoundList, null, 2))
    console.log(`[] noteDurationValue :`, noteDurationValue)
    const orderedNoteDurationValue = Object.values(noteDurationValue).sort((a, b) => a - b)
    console.log(`[] orderedNoteDurationValue :`, orderedNoteDurationValue)
    console.log(`[] noteDurationValue :`, orderedNoteDurationValue.map((v, index) => `${Object.keys(noteDurationValue).find((k) => noteDurationValue[k] === v)} : ${v} (${v - orderedNoteDurationValue[index - 1]})`))
// console.log(`---------------------------------------`)
// console.log(`[FINAL] noteNotFoundList`, JSON.stringify(noteNotFoundList, ["piece", "title", "movement", "rank", "key", "section"], 2))
  }
  console.log(`-------- END - processDataFromXlsx --------`)
  return {pieceList, metronomeMarkList, noteNotFoundList}
}

async function main() {
  const datasFromXlsxFiles = await getXlsxDatas()
  const {pieceList, metronomeMarkList, noteNotFoundList} = await processDataFromXlsx(datasFromXlsxFiles)
  // console.log("[MAIN] results", {pieceList, metronomeMarkList, noteNotFoundList})
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
  console.log(`- KEY :`, `${key}_${mode}`)
  // @ts-ignore
  const keyEnum = KEY[`${key}_${mode}`]
  return keyEnum
}

// async function seedDB() {
//   const piece = await db.piece.create({
//     data: {
//       title: "Symphony No.1, Op.21",
//       yearOfComposition: 1800,
//       composer: {
//         connectOrCreate: {
//           where: {
//             fullName: "Beethoven, Ludwig van",
//           },
//           create: {
//             fullName: "Beethoven, Ludwig van",
//             birthYear: 1770,
//             deathYear: 1827,
//           },
//         },
//       },
//       movements: {
//         create: [
//           {
//             rank: 1,
//             key: KEY.C_MAJOR,
//             sections: {
//               create: [
//                 {
//                   rank: 1,
//                   metreNumerator: 4,
//                   metreDenominator: 4,
//                   tempoIndication: {
//                     connectOrCreate: {
//                       where: {
//                         baseTerm_additionalTerm: {
//                           baseTerm: "Adagio",
//                           additionalTerm: "",
//                         }
//                       },
//                       create: {
//                         baseTerm: "Adagio",
//                         additionalTerm: "",
//                       }
//                     }
//                   }
//                 },
//                 {
//                   rank: 2,
//                   metreNumerator: 2,
//                   metreDenominator: 2,
//                   tempoIndication: {
//                     connectOrCreate: {
//                       where: {
//                         baseTerm_additionalTerm: {
//                           baseTerm: "Allegro",
//                           additionalTerm: "con brio",                        }
//                       },
//                       create: {
//                         baseTerm: "Allegro",
//                         additionalTerm: "con brio",                      }
//                     }
//                   }
//                 }
//               ],
//             },
//           },
//           {
//             rank: 2,
//             key: KEY.F_MAJOR,
//             sections: {
//               create: [
//                 {
//                   rank: 1,
//                   metreNumerator: 3,
//                   metreDenominator: 8,
//                   tempoIndication: {
//                     connectOrCreate: {
//                       where: {
//                         baseTerm_additionalTerm: {
//                           baseTerm: "Andante",
//                           additionalTerm: "cantabile con moto",
//                         }
//                       },
//                       create: {
//                         baseTerm: "Andante",
//                         additionalTerm: "cantabile con moto",
//                       }
//                     }
//                   },
//                 },
//               ],
//             }
//           },
//           {
//             rank: 3,
//             key: KEY.C_MAJOR,
//             sections: {
//               create: [
//                 {
//                   rank: 1,
//                   metreNumerator: 3,
//                   metreDenominator: 4,
//                   tempoIndication: {
//                     connectOrCreate: {
//                       where: {
//                         baseTerm_additionalTerm: {
//                           baseTerm: "Allegro",
//                           additionalTerm: "molto e vivace",
//                         }
//                       },
//                       create: {
//                         baseTerm: "Allegro",
//                         additionalTerm: "molto e vivace",
//                       }
//                     }
//                   }
//                 }
//               ],
//             }
//           },
//           {
//             rank: 4,
//             key: KEY.C_MAJOR,
//             sections: {
//               create: [
//                 {
//                   rank: 1,
//                   metreNumerator: 2,
//                   metreDenominator: 4,
//                   tempoIndication: {
//                     connectOrCreate: {
//                       where: {
//                         baseTerm_additionalTerm: {
//                           baseTerm: "Adagio",
//                           additionalTerm: "",
//                         }
//                       },
//                       create: {
//                         baseTerm: "Adagio",
//                         additionalTerm: "",
//                       }
//                     }
//                   }
//                 },
//                 {
//                   rank: 2,
//                   metreNumerator: 2,
//                   metreDenominator: 4,
//                   tempoIndication: {
//                     connectOrCreate: {
//                       where: {
//                         baseTerm_additionalTerm: {
//                           baseTerm: "Allegro",
//                           additionalTerm: "molto e vivace",
//                         }
//                       },
//                       create: {
//                         baseTerm: "Allegro",
//                         additionalTerm: "molto e vivace",
//                       }
//                     }
//                   }
//                 }
//               ],
//             }
//           }
//         ],
//       },
//     },
//     include: {
//       movements: {
//         include: {
//           sections: true,
//         }
//       }
//     },
//   });
//   console.log(`[] piece :`, piece)
//
//   // const tasks = await Promise.all(
//   //   composer.compositions.map((composition) => {
//   //     if (composition.title === "Symphony No.1, Op.21") {
//   //       composition.movements.map((movement) => {
//   //         return db.task.createMany({
//   //           data: new Array(10).fill(1).map((_, i) => {
//   //             return {
//   //               name: `Task ${i}`,
//   //               ownerId: user.id,
//   //               projectId: project.id,
//   //               description: `Everything that describes Task ${i}`,
//   //               status: getRandomTaskStatus(),
//   //             };
//   //           }),
//   //         })
//   //       })
//   //     }
//   //   })
//   // );
//
//   // console.log({user, tasks});
// }
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