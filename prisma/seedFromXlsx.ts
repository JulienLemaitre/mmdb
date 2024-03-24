import { db } from "@/utils/db";
import { CONTRIBUTION_ROLE, KEY, NOTE_VALUE, PIECE_CATEGORY, SOURCE_TYPE } from "@prisma/client";
import takeFirstOfPotentialRange from "@/utils/takeFirstOfPotentialRange";
import parseValueRemoveParenthesis from "@/utils/parseValueRemoveParenthesis";
import getNotesPerBarCollectionFromNotesPerSecondCollection
  from "@/utils/getNotesPerBarCollectionFromNotesPerSecondCollection";
import { TEMPO_INDICATION_NONE_ID } from "@/utils/constants";

function logTestError(bpm, ...props) {
  if (bpm === 108) {
    console.log(props)
  }
}

const fs = require('fs');
const path = require('path');
const util = require('util')
const readXlsxFile = require('read-excel-file/node')

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

// Build a map to convert beatUnit from Arjun's wording in XLSX files to NOTE_VALUE normalized terms
const beatUnitXlsToNorm: {[k: string]: string} = {}
Object.keys(NOTE_VALUE).forEach((beatUnit: string, index) => {
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

const directoryPath = path.join(__dirname, "ArjunData", "20230319_MM_folders");
console.log(`directoryPath :`, directoryPath)

const noteNotFoundList: any[] = []

// The schema is used to normalize the names of the xlsx columns in camelCase, and parse some of the values.
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
      // A metre expressed as a fraction, e.g. 4/4, is considered as a date by the library
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
    type: parseValueRemoveParenthesis,
  },
  'Fastest Stacatto Notes (notes/s)': {
    prop: 'fastestStaccatoNote',
    type: parseValueRemoveParenthesis,
  },
  'Fastest Ornamental Notes (notes/s)': {
    prop: 'fastestOrnamentalNote',
    type: parseValueRemoveParenthesis,
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

// Parse the xlsx file with the above schema and return the data as JSON
async function readExcelFile(filePath: string) {
  // @ts-ignore
  return await readXlsxFile(filePath, {schema}).then(({rows, errors}) => {
    // `rows` is an array of rows
    // each row being an array of cells.
    if (errors?.length > 0) {
      console.log(`[readExcelFile] errors :`, errors)
    }
    return rows
  })
}

const pieceCategory: {[key: string]: PIECE_CATEGORY} = {
  Chamber: PIECE_CATEGORY.CHAMBER_INSTRUMENTAL,
  Keyboard: PIECE_CATEGORY.KEYBOARD,
  Orchestral: PIECE_CATEGORY.ORCHESTRAL,
  Vocal: PIECE_CATEGORY.VOCAL,
  Autre: PIECE_CATEGORY.OTHER,
}

const composerBirthDeathYear: {[key: string]: [number, number]} = {
  "Aguado": [1784, 1849],
  "Albeniz": [1860, 1909],
  "Bach": [1685, 1750],
  "Beethoven": [1770, 1827],
  "Berlioz": [1803, 1869],
  "Brahms": [1833, 1897],
  "Chopin": [1810, 1849],
  "Coste": [1805, 1883],
  "Czerny": [1791, 1857],
  "Debussy": [1862, 1918],
  "Dvorak": [1841, 1904],
  "Dvořák": [1841, 1904],
  "Elgar": [1857, 1934],
  "Fossa": [1775, 1849],
  "Giuliani": [1781, 1829],
  "Grieg": [1843, 1907],
  "Haydn": [1732, 1809],
  "Liszt": [1811, 1886],
  "Mendelssohn": [1809, 1847],
  "Mozart": [1756, 1791],
  "Reger": [1873, 1916],
  "Rimsky Korsakov": [1844, 1908],
  "Rimsky-Korsakov": [1844, 1908],
  "Rossini": [1792, 1868],
  "Saint-Saens": [1835, 1921],
  "Schubert": [1797, 1828],
  "Schumann": [1810, 1856],
  "Shostakovich": [1906, 1975],
  "Stravinsky": [1882, 1971],
  "Tchaikovsky": [1840, 1893],
  "Wagner": [1813, 1883],
  "Webern": [1883, 1945],
}

// Recursively traverse the directory and return a list of dataSheet as an object {pieceListCategory, data: JSON}
async function traverseDirectory(directory: string) {
  let dataSheetList: any[] = []
  const files = await readdir(directory);
  // console.log(`[traverseDirectory] files :`, files)
  for (const file of files) {
    const filePath = path.join(directory, file);
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      // console.log(`>> directory: ${filePath}`)
      const subDataSheetList = await traverseDirectory(filePath);
      dataSheetList = [...dataSheetList, ...subDataSheetList]
      // console.log(`[traverseDirectory] subDataSheetList.length :`, subDataSheetList.length)
      // console.log(`[traverseDirectory] dataSheetList.length :`, dataSheetList.length)
    } else if (path.extname(filePath) === '.xlsx') {
      // console.log(`- file: ${filePath}`)
      const categoryKey = Object.keys(pieceCategory).find((key) => filePath.includes(key))
      const pieceListCategory = pieceCategory[categoryKey ?? "Autre"]
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

// This function takes the dataSheetList as an input and return a well-structured pieceList Array of piece object containing movements, sections and metronomeMarkList. It also determines note values from fastest note values, and output a list of pieces with note found notes.
async function processDataFromXlsx(dataSheetList: any) {
  const pieceList: any[] = []
  const metronomeMarkList: any[] = []
  dataSheetList.forEach(({ pieceListCategory, data }) => {
    // Single Excel file data
    const dataSheet = data
    let piece: any
    let movement: any
    let lastMMSource: any = {}
    let sourceRank: number = 0

    dataSheet.forEach((rowData: any) => {
      // Single row data
      const isPieceDescription = rowData.hasOwnProperty('composer') && rowData.hasOwnProperty('title')
      const isMovement = rowData.hasOwnProperty('movement') && rowData.hasOwnProperty('key')
      const isSectionDescription = rowData.hasOwnProperty('metre')

      if (isPieceDescription) {
        // - PUSH remaining movement in precedent piece
        // - RESET movement to null
        if (movement) {
          if (piece?.movements) {
            piece.movements.push(movement)
          } else {
            piece.movements = [movement]
          }
          movement = null
        }

        // PUSH precedent piece in pieceList if exists
        // RESET piece to null
        if (piece) {
          pieceList.push(piece)
          piece = null
        }
        // Generate yearOfComposition as number from string. If "(" is found in original string, take into account only the first part of the string
        const yearOfComposition = rowData.yearOfComposition.includes('(') ? rowData.yearOfComposition.split('(')[0] : rowData.yearOfComposition
        const collectionPartInTitle = /,(\s+Op.\d+\s+No.\d+)/
        const collectionTitleFull = collectionPartInTitle.exec(rowData.title)

        let collectionTitle : string
        let pieceRank : string
        let collection : any = {}
        if (collectionTitleFull) {
          console.log(`[processDataFromXlsx] collectionTitleFull :`, collectionTitleFull)
          const collectionTitlePart = /\s*(Op.\d+)\s+No.\d+/
          const collectionTitleMatch = collectionTitlePart.exec(collectionTitleFull[0])
          console.log(`[processDataFromXlsx] collectionTitleMatch :`, collectionTitleMatch)
          const pieceNumberPart = /\s*Op.\d+\s+No.(\d+)/
          const pieceNumberMatch = pieceNumberPart.exec(collectionTitleFull[0])
          console.log(`[processDataFromXlsx] pieceNumberMatch :`, pieceNumberMatch)
          if (collectionTitleMatch && pieceNumberMatch) {
            collectionTitle = collectionTitleMatch[1]
          console.log(`[processDataFromXlsx] collectionTitle :`, collectionTitle)
            pieceRank = pieceNumberMatch[1]
          console.log(`[processDataFromXlsx] pieceNumber :`, pieceRank)
            collection = {
              title: collectionTitle,
              pieceRank,
            }
          }
        }

        piece = {
          ...(collection?.title ? { collection } : {}),
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
          ...(rowData.additionalNotes && {comment: rowData.additionalNotes}),
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

        // Compare relevant infos to lastMMSource in order to either assign the rank 1 to the piece in a new MMSource, OR increment this piece rank in an existing MMSource
        const isSameMMSource = lastMMSource.year === source.year && lastMMSource.type === source.type && JSON.stringify(lastMMSource.contributions) === JSON.stringify(source.contributions)

        if (isSameMMSource) {
          sourceRank++
        } else {
          sourceRank = 1
        }
        lastMMSource = source
        source.rank = sourceRank

        piece.source = source
      }

      if (isMovement) {
        // NEW movement

        // - PUSH remaining precedent movement in current piece
          if (movement) {
            if (piece?.movements) {
              piece.movements.push(movement)
            } else {
              piece.movements = [movement]
            }
          }
          const key = getKeyEnumFromKeyString(rowData.key)
          if (!key) {
            console.log(`[ERROR] key not found in piece ${piece.title} (${piece.composer}) for movement ${rowData.movement}`)
          }
          movement = {
            rank: (piece?.movements || []).length + 1,
            key: getKeyEnumFromKeyString(rowData.key),
            sections: [],
          }
        // }
      }

      if (isSectionDescription) {

        const fastestStructuralNotesPerSecond = takeFirstOfPotentialRange(rowData.fastestStructuralNote)
        const fastestStaccatoNotesPerSecond = takeFirstOfPotentialRange(rowData.fastestStaccatoNote)
        const fastestOrnamentalNotesPerSecond = takeFirstOfPotentialRange(rowData.fastestOrnamentalNote)

        const beatUnitXls = parseValueRemoveParenthesis(rowData.metronomeMarking.split('=')[0].trim())
        const beatUnitXlsCleanKey = Object.keys(beatUnitXlsToNorm).find((bu) => beatUnitXls.startsWith(bu))
        if (!beatUnitXlsCleanKey) {
          throw new Error(`beatUnitXlsCleanKey not found for ${beatUnitXls}`)
        }
        const beatUnit = beatUnitXlsToNorm[beatUnitXlsCleanKey] as NOTE_VALUE
        const bpmRawString = rowData.metronomeMarking.split('=')[1].trim()
        const bpmString = bpmRawString.split('-')[0].trim()
        const bpm = Number(parseValueRemoveParenthesis(bpmString))
        const rawMetre = parseValueRemoveParenthesis(rowData.metre)
        const metreNumerator = rawMetre === 'C' ? 4 : rawMetre === 'C-' ? 2 : Number(rawMetre.split('/')[0])
        const metreDenominator = rawMetre === 'C' ? 4 : rawMetre === 'C-' ? 2 : Number(rawMetre.split('/')[1])
        const sectionComment = rowData.additionalNotes

        const notesPerBarObject = getNotesPerBarCollectionFromNotesPerSecondCollection({
          metronomeMark: {
            beatUnit,
            bpm,
            metreNumerator,
            metreDenominator,
            notesPerSecond: { fastestStructuralNotesPerSecond, fastestStaccatoNotesPerSecond, fastestOrnamentalNotesPerSecond}
          },
        })

        // NEW section
        const section = {
          rank: (movement?.sections || []).length + 1,
          tempoIndication: rowData.tempoIndication,
          isCommonTime: rawMetre === 'C',
          isCutTime: rawMetre === 'C-',
          metreNumerator,
          metreDenominator,
          ...notesPerBarObject,
          ...(sectionComment && {comment: sectionComment}),
        }

        // Error handling
        // @ts-ignore
        if (Object.keys(notesPerBarObject).some((note) => notesPerBarObject[note] === null)) {
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
              notesPerBar: notesPerBarObject,
              notesPerSecond: {
                fastestStructuralNotesPerSecond,
                fastestStaccatoNotesPerSecond,
                fastestOrnamentalNotesPerSecond
              },
            }
          })
        }

        // NEW metronomeMark
        const metronomeMark = {
          movementRank: movement?.rank,
          sectionRank: section?.rank,
          beatUnit,
          bpm,
          notesPerBar: notesPerBarObject,
          notesPerSecond: {
            fastestStructuralNotesPerSecond,
            fastestStaccatoNotesPerSecond,
            fastestOrnamentalNotesPerSecond
          },
        }
        if (piece.metronomeMarkList) {
          piece.metronomeMarkList.push(metronomeMark)
        } else {
          piece.metronomeMarkList = [metronomeMark]
        }

        if (movement) {
          movement.sections.push(section)
        } else {
          throw new Error(`movement not found to push section ${section.rank} of piece ${piece.title} (${piece.composer})`)
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
    if (piece) {
      pieceList.push(piece)
    }
  })

  if (noteNotFoundList.length > 0) {
    console.log(`---------------------------------------`)
    console.log(`[FINAL] noteNotFoundList :`)
    noteNotFoundList.forEach((noteNotFound) => {
      console.log(`[FINAL] noteNotFound :`, JSON.stringify(noteNotFound))
    })
    // console.log(`[] noteDurationValue :`, noteDurationValue)
    // const orderedNoteDurationValue = Object.values(noteDurationValue).sort((a, b) => a - b)
    // console.log(`[] orderedNoteDurationValue :`, orderedNoteDurationValue)
    // console.log(`[] noteDurationValue :`, orderedNoteDurationValue.map((v, index) => `${noteDurationValueKeys.find((k) => noteDurationValue[k] === v)} : ${v} (${v - orderedNoteDurationValue[index - 1]})`))
  }
  return {pieceList, noteNotFoundList}
}

async function getDatas() {
  // Verify if a parsedDataOutput.js file already exists
  const parsedDataOutputPath = path.join(__dirname, 'parsedDataOutput.js')
  const parsedDataOutputExists = fs.existsSync(parsedDataOutputPath)
  console.log(`[getDatas] parsedDataOutputExists :`, parsedDataOutputExists)

  // If it exists, just import it
  if (parsedDataOutputExists) {
    const parsedDataOutput = require(parsedDataOutputPath).default
    return parsedDataOutput
  }

  // If it doesn't exist, extract datas from the xlsx files
  // Extract datas from the xlsx files
  const datasFromXlsxFiles = await traverseDirectory(directoryPath)

  // Process the datas to build a well-structured object list
  const { pieceList, noteNotFoundList } = await processDataFromXlsx(datasFromXlsxFiles)

  // Extract the sections from the pieceList (just to count them ;-) )
  const sectionList = pieceList.reduce((acc, piece) => {
    if (!piece) {
      console.log(`[NO] piece`)
      return acc
    }
    let movementSections = []

    if (piece?.movements) {
      movementSections = piece.movements.reduce((acc, movement) => {
        return [...acc, ...movement.sections]
      }, [])
    }
    return [...acc, ...movementSections]
  }, [])

  // Write the objects to a new file parsedDataOutput.js
  const data = `const pieceList = ${JSON.stringify(pieceList, null, 2)};
const sectionList = ${JSON.stringify(sectionList, null, 2)};
const noteNotFoundList = ${JSON.stringify(noteNotFoundList, null, 2)};

const parsedData = { pieceList, sectionList, noteNotFoundList };

export default parsedData;`;

  fs.writeFileSync(parsedDataOutputPath, data);

  return { pieceList, sectionList, noteNotFoundList }
}

async function main() {
  const { pieceList, sectionList, noteNotFoundList } = await getDatas()
  console.log(`[MAIN] counts :`, {pieceList: pieceList.length, sectionList: sectionList.length, noteNotFoundList: noteNotFoundList.length})
  await seedDB({pieceList})
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
  if (!keyString) return null
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

async function seedDB({pieceList}: {pieceList: any[]}) {
  console.log(`-------- START - seedDB --------`)
  // console.log(`[] pieceList`, pieceList)
  const now = new Date()
  const userArjun = await db.user.create({
    data: {
      name: "Arjun Wasan",
      email: "arjunwasan@gmail.com",
      role: "EDITOR",
      emailVerified: now,
      passwordHash: "$2a$10$7EEZGctSWdX99AYhIVv.WuVPjSFUdlPcHsnQaSibin.YVilNJBBk2",
    }
  })

  // Create admin and editor test accounts
  await db.user.createMany({
    data: [
      {
        name: "mmdb ADMIN",
        email: "julem80+mmdbadmin@pm.me",
        role: "ADMIN",
        emailVerified: now,
        passwordHash: "$2a$10$XG46.V.GsuDeS/MhdP4EeuAldCkCXrbILQcTae1YXEHC5Knvwirnm",
      },
      {
        name: "mmdb EDITOR",
        email: "julem80+mmdbeditor@pm.me",
        role: "EDITOR",
        emailVerified: now,
        passwordHash: "$2a$10$wkkjfc62trF0/lxpEWeHMufw3/JfOayEyi37yjaJwQ18YBe580gmC",
      },
      {
        name: "Setfan Pospiech",
        email: "st.pospiech@web.de",
        role: "EDITOR",
        emailVerified: now,
        passwordHash: "$2a$10$NgfYJUZgxR8PxENV.2aE4.xJc.ayim2wljlquH.7xP01gbMbeBT3S",
      },
      {
        name: "Wim Winters",
        email: "wwinters@telenet.be",
        role: "EDITOR",
        emailVerified: now,
        passwordHash: "$2a$10$xa0I2y70qbNl3yC7AZepXuEO07WAcyNX2nRx4/dqWvHz5CdsbZ6uS",
      }
    ],
  })

  // Persist a TempoIndication "-- None --"
  await db.tempoIndication.create({
    data: {
      id: TEMPO_INDICATION_NONE_ID,
      text: "-- None --"
    }
  })

  const pieceListFixed = pieceList
  .map((piece) => {
    // Fix for wrongly written Beethoven name
    if (piece.composer === "Beethoven, Ludwig Van") {
      return {
        ...piece,
        composer: "Beethoven, Ludwig van"
      }
    }
    // Fix for wrongly written Schumann name
    if (piece.composer === "Schumann Robert") {
      return {
        ...piece,
        composer: "Schumann, Robert"
      }
    }
    return piece
  })

  const collectionToCreateList : any[] = []
    pieceListFixed.filter((piece) => piece.collection).forEach((piece) => {
      if (!collectionToCreateList.some((collection) => collection.title === piece.collection.title && collection.composer === piece.composer)) {
        collectionToCreateList.push({
          title: piece.collection.title,
          composer: piece.composer,
        })
      }
  })

  const collectionTaskList = collectionToCreateList.map((collection) => {
    return async function () {
      const persistedCollection = await db.collection.create({
        data: {
          title: collection.title,
          composer: {
            connectOrCreate: {
              where: {
                firstName_lastName: {
                  firstName: collection.composer.split(',')[1].trim(),
                  lastName: collection.composer.split(',')[0].trim(),
                }
              },
              create: {
                firstName: collection.composer.split(',')[1].trim(),
                lastName: collection.composer.split(',')[0].trim(),
                birthYear: composerBirthDeathYear[collection.composer.split(',')[0].trim()][0],
                deathYear: composerBirthDeathYear[collection.composer.split(',')[0].trim()][1],
              },
            },
          }
        }
      })
      .catch((e) => {
        console.error(`[CREATE ERROR] collection`, collection.title, collection.composer)
        console.error(`[CREATE ERROR] e.message`, e.message)
        return null
      })

      return {
        ...persistedCollection,
      }
    }
  })

  const persistedCollectionList: any[] = []
  for (const task of collectionTaskList) {
    persistedCollectionList.push(await task())
  }

  console.log(`[SEED] persistedCollectionList`, JSON.stringify(persistedCollectionList, null, 2))

  const pieceTaskList = pieceListFixed.map((piece, pieceIndex, pieceArray) => {
    const birthDeath: [number, number] = composerBirthDeathYear[piece.composer.split(',')[0].trim()]
    const collectionId: string = persistedCollectionList.find((collection) => collection.title === piece.collection?.title)?.id
    if (!birthDeath) {
      console.log(`[SEED ERROR] birthDeath not found for ${piece.composer}`)
    }
    const shouldLinkToCollection = !!piece?.collection?.pieceRank && collectionId
    if (piece.collection) {
      console.log(`[SEED COLLECTION] Piece HAS Collection :`, piece.collection.title, piece.collection.pieceRank, piece.title)
      console.log(`[SEED COLLECTION] collectionId :`, collectionId)
      console.log(`[SEED COLLECTION] shouldLinkToCollection :`, shouldLinkToCollection)
    }

    return async function () {
      const persistedPiece = await db.piece.create({
        data: {
          creator: {
            connect: {
              id: userArjun.id
            },
          },
          ...(shouldLinkToCollection && {
            collection: { connect: { id: collectionId } },
            collectionRank: Number(piece.collection.pieceRank),
          }),
          title: piece.title,
          yearOfComposition: piece.yearOfComposition,
          composer: {
            connectOrCreate: {
              where: {
                firstName_lastName: {
                  firstName: piece.composer.split(',')[1].trim(),
                  lastName: piece.composer.split(',')[0].trim(),
                }
              },
              create: {
                firstName: piece.composer.split(',')[1].trim(),
                lastName: piece.composer.split(',')[0].trim(),
                birthYear: composerBirthDeathYear[piece.composer.split(',')[0].trim()][0],
                deathYear: composerBirthDeathYear[piece.composer.split(',')[0].trim()][1],
              },
            },
          },
          pieceVersions: {
            create: {
              category: piece.category,
              movements: {
                create: piece.movements.map((movement) => {
                  return {
                    rank: movement.rank,
                    key: movement.key,
                    sections: {
                      create: movement.sections.map((section) => {
                        return {
                          rank: section.rank,
                          isCommonTime: section.isCommonTime,
                          isCutTime: section.isCutTime,
                          metreNumerator: section.metreNumerator,
                          metreDenominator: section.metreDenominator,
                          // ...(section.fastestStructuralNoteValue && { fastestStructuralNotesPerBar: getNotesPerBar({ noteValue: section.fastestStructuralNoteValue, metreNumerator: section.metreNumerator, metreDenominator: section.metreDenominator }) }),
                          // ...(section.fastestStaccatoNoteValue && { fastestStaccatoNotesPerBar: getNotesPerBar({ noteValue: section.fastestStaccatoNoteValue, metreNumerator: section.metreNumerator, metreDenominator: section.metreDenominator }) }),
                          // ...(section.fastestOrnamentalNoteValue && { fastestOrnamentalNotesPerBar: getNotesPerBar({ noteValue: section.fastestOrnamentalNoteValue, metreNumerator: section.metreNumerator, metreDenominator: section.metreDenominator }) }),
                          ...(section.fastestStructuralNotesPerBar && { fastestStructuralNotesPerBar: section.fastestStructuralNotesPerBar }),
                          ...(section.fastestStaccatoNotesPerBar && { fastestStaccatoNotesPerBar: section.fastestStaccatoNotesPerBar }),
                          ...(section.fastestOrnamentalNotesPerBar && { fastestOrnamentalNotesPerBar: section.fastestOrnamentalNotesPerBar }),
                          ...(section.comment && { comment: section.comment }),
                          ...(section.tempoIndication ? {
                            tempoIndication: {
                              connectOrCreate: {
                                where: {
                                  text: section.tempoIndication,
                                },
                                create: {
                                  text: section.tempoIndication,
                                }
                              }
                            },
                          } : {
                            tempoIndication: {
                              connect: {
                                id: TEMPO_INDICATION_NONE_ID,
                              },
                            },
                          }),
                        }
                      }),
                    },
                  }
                }),
              },
            },
          },
        },
        include: {
          composer: true,
          pieceVersions: {
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
          }
        }
      }).catch((e) => {
        console.error(`[CREATE ERROR] piece`, piece.title, piece.composer)
        console.error(`[CREATE ERROR] e.message`, e.message)
        return null
      })
      // console.log(`[] persistedPiece`, JSON.stringify(persistedPiece, null, 2))
      return {
        ...persistedPiece,
        source: piece.source,
        metronomeMarkList: piece.metronomeMarkList,
      }
    }
  })
  const persistedPieceList: any[] = []
  for (const task of pieceTaskList) {
    persistedPieceList.push(await task())
  }

  const sourceTaskList = persistedPieceList.map((piece, index) => {
    // console.log(`[] piece.pieceVersions :`, piece.pieceVersions)
    if (!piece.pieceVersions) {
      console.log(`[ERROR] piece.pieceVersions is null`, piece.title, JSON.stringify(piece))
    }
    const pieceVersion = piece.pieceVersions[0]
    return async function () {
      const source = piece.source
      const metronomeMarkList = piece.metronomeMarkList
      if (!metronomeMarkList) {
        console.log(`[ERROR] metronomeMarkList is null`, piece.title, piece)
      }
      const movements = pieceVersion.movements.sort((a, b) => a.rank - b.rank)

      // Persist source and metronomeMarks
      const persistedSource = await db.mMSource.create({
        data: {
          creator: {
            connect: {
              id: userArjun.id
            },
          },
          type: source.type,
          link: source.link,
          year: source.year,
          ...(source.comment && { comment: source.comment }),
          pieceVersions: {
            create: {
              rank: source.rank,
              pieceVersion: {
                connect: {
                  id: pieceVersion.id
                }
              }
            }
          },
          metronomeMarks: {
            create: metronomeMarkList.map((metronomeMark) => {
              // test if bpm is float
              if (metronomeMark.bpm % 1 !== 0) {
                console.group(`[ERROR] FLOAT BPM`)
                console.log(`[] metronomeMark.bpm`, metronomeMark.bpm)
                console.log(`[] piece`, piece)
                console.groupEnd()
              }
              const sectionId = movements.sort((a, b) => a.rank - b.rank)[metronomeMark.movementRank - 1].sections.sort((a, b) => a.rank - b.rank)[metronomeMark.sectionRank - 1].id
              return {
                beatUnit: metronomeMark.beatUnit,
                bpm: metronomeMark.bpm,
                notesPerSecond: metronomeMark.notesPerSecond,
                notesPerBar: metronomeMark.notesPerBar,
                section: {
                  connect: {
                    id: sectionId,
                  },
                },
              }
            }),
          },
        },
        include: {
          metronomeMarks: true,
        }
      })
      // console.log(`[] persistedSource`, JSON.stringify(persistedSource, null, 2))

      return {
        ...persistedSource,
        piece,
      }
    }
  })

  const persistedSourceList: any[] = []
  for (const task of sourceTaskList) {
    persistedSourceList.push(await task())
  }
  // console.log(`[] persistedSourceList`, JSON.stringify(persistedSourceList, null, 2))

  const contributionsTaskList: any[] = []
  persistedSourceList.forEach((source, index) => {
    const piece = source.piece

    piece.source.contributions.forEach((contribution) => {
      contributionsTaskList.push(async function () {
        const persistedContribution = await db.contribution.create({
          data: {
            role: contribution.role,
            mMSource: {
              connect: {
                id: source.id,
              },
            },
            organization: {
              connectOrCreate: {
                where: {
                  name: contribution.organization.name,
                },
                create: {
                  name: contribution.organization.name,
                }
              }
            },
          },
          include: {
            organization: true,
          }
        })
        // console.log(`[] persistedContributions`, JSON.stringify(persistedContribution, null, 2))
        return persistedContribution
      })
    })
  })
  const persistedContributionsList: any[] = []
  for (const task of contributionsTaskList) {
    persistedContributionsList.push(await task())
  }

  console.log(`-------- END - seedDB --------`)
}
