// import { hashPassword } from "@/lib/auth";
import {db} from "@/lib/db";
import {KEY, SOURCE_TYPE, CONTRIBUTION_ROLE} from "@prisma/client";
// import Papa from "papaparse";
// import { unlinkSync } from 'node:fs';

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const directoryPath = path.join(__dirname, "ArjunData", "20230319_MM_folders", "19th Century Composers", "Beethoven", "Orchestral ");
// const directoryPath = path.join(__dirname, "ArjunData", "20230319_MM_folders", "19th Century Composers", "Beethoven", "Orchestral");
// const directoryPath = path.join(__dirname, '/ArjunData/20230319_MM_folders/19th Century Composers/Beethoven/Orchestral');
console.log(`directoryPath :`, directoryPath)

const dataSheetList: any[] = []

function readExcelFile(filePath: string) {
  const workbook = xlsx.readFile(filePath, {type: "string", raw: true });
  const sheetName = workbook.SheetNames[0];
  const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  return sheetData;
}

function traverseDirectory(directory: string) {
  fs.readdirSync(directory).forEach((file: string) => {
    const filePath = path.join(directory, file);
    if (fs.statSync(filePath).isDirectory()) {
      console.log(`>> directory: ${filePath}`)
      traverseDirectory(filePath);
    } else if (path.extname(filePath) === '.xlsx') {
      console.log(`- file: ${filePath}`)
      const singleSheetData = readExcelFile(filePath);
      // console.log(`[] singleSheetData`, singleSheetData)
      dataSheetList.push(singleSheetData);
    }
  });
}

traverseDirectory(directoryPath);
console.log(`[] dataSheetList.length :`, dataSheetList.length)

const pieceList: any[] = []
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
  let publisher: any
  let editor: any
  dataSheet.forEach((rowData: any) => {
    // Single row data
    console.log(``)
    console.log(`-------------------------------------------`)
    console.log(`[ROW] data`, JSON.stringify(rowData, null, 2))
    const isPieceDescription = rowData.hasOwnProperty('Composer')
    const isMovement = rowData.hasOwnProperty('Movement of Work')
    const isSectionDescription = rowData.hasOwnProperty('Tempo Indication') && !rowData.hasOwnProperty('Movement')
    console.log(`ROW IS, piece: ${isPieceDescription}, movement: ${isMovement}, section: ${isSectionDescription}`)

    if (isPieceDescription) {
      // Push remaining movement in precedent piece
      if (movement) {
        console.log(`[PUSH] movement`, movement)
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
        console.log(`[PUSH] Piece`, piece)
        pieceList.push(piece)
        piece = null
      }
      piece = {
        title: rowData.Title,
        yearOfComposition: rowData['Year of Composition'],
      }
      console.log(`[NEW] Piece`, piece)

      // NEW source
      const source = {
        type: SOURCE_TYPE.EDITION,
        ...(rowData.link && {link: rowData.link}),
        year: typeof rowData['Year of Publication'] === 'number' ? rowData['Year of Publication'] : parseInt(rowData['Year of Publication']),
        contributions: [],
      }
      if (rowData.Publisher && rowData.Publisher !== 'N/A') {
        const publisherContribution = {
          role: CONTRIBUTION_ROLE.PUBLISHER,
          organization: {
            name: rowData.Publisher,
          }
        }
        console.log(`[PUSH] publisherContribution`, publisherContribution)
        source.contributions.push(publisherContribution)
      }
      if (rowData.Editor && rowData.Editor !== 'N/A') {
        const editorContribution = {
          role: CONTRIBUTION_ROLE.EDITOR,
          organization: {
            name: rowData.Editor,
          }
        }
        console.log(`[PUSH] editorContribution`, editorContribution)
        source.contributions.push(editorContribution)
      }
      console.log(`[NEW] source`, source)
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

      if (rowData.hasOwnProperty('Movement of Work')) {
        if (movement) {
          console.log(`[PUSH] movement`, movement)
          if (piece?.movements) {
            piece.movements.push(movement)
          } else {
            piece.movements = [movement]
          }
        }
        movement = {
          rank: (piece?.movements || []).length + 1,
          key: getKeyEnumFromKeyString(rowData.Key),
          sections: [],
        }
        console.log(`[NEW] movement`, movement)
      }
    }

    if (isSectionDescription) {
      // NEW section
      console.log(`[ --- SECTION --- ]`)
      const section = {
        rank: (movement?.sections || []).length + 1,
        tempoIndication: rowData['Tempo Indication'],
        metreSymbol: rowData["Metre"],
        metreNumerator: rowData["Metre"] === 'C' ? 4 : Number(rowData.Metre.split('/')[0]),
        metreDenominator: rowData["Metre"] === 'C' ? 4 : Number(rowData.Metre.split('/')[1]),
      }
      console.log(`[PUSH NEW] section`, section)
      movement.sections.push(section)
    }
  })
  if (movement) {
    console.log(`[PUSH LAST] movement`, movement)
    if (piece?.movements) {
      piece.movements.push(movement)
    } else {
      piece.movements = [movement]
    }
    movement = null
  }
  console.log(`[PUSH] piece`, piece)
  pieceList.push(piece)
})

console.log(`[FINAL] pieceList`, JSON.stringify(pieceList, null, 2))

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