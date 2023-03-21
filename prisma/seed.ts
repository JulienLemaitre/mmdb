// import { hashPassword } from "@/lib/auth";
import {db} from "@/lib/db";
import {KEY} from "@prisma/client";
import Papa from "papaparse";
import { unlinkSync } from 'node:fs';

async function seedDB() {
  const piece = await db.piece.create({
    data: {
      title: "Symphony No.1, Op.21",
      yearOfComposition: 1800,
      composer: {
        connectOrCreate: {
          where: {
            fullName: "Beethoven, Ludwig van",
          },
          create: {
            fullName: "Beethoven, Ludwig van",
            birthYear: 1770,
            deathYear: 1827,
          },
        },
      },
      movements: {
        create: [
          {
            rank: 1,
            key: KEY.C_MAJOR,
            sections: {
              create: [
                {
                  rank: 1,
                  metreNumerator: 4,
                  metreDenominator: 4,
                  tempoIndication: {
                    connectOrCreate: {
                      where: {
                        baseTerm_additionalTerm: {
                          baseTerm: "Adagio",
                          additionalTerm: "",
                        }
                      },
                      create: {
                        baseTerm: "Adagio",
                        additionalTerm: "",
                      }
                    }
                  }
                },
                {
                  rank: 2,
                  metreNumerator: 2,
                  metreDenominator: 2,
                  tempoIndication: {
                    connectOrCreate: {
                      where: {
                        baseTerm_additionalTerm: {
                          baseTerm: "Allegro",
                          additionalTerm: "con brio",                        }
                      },
                      create: {
                        baseTerm: "Allegro",
                        additionalTerm: "con brio",                      }
                    }
                  }
                }
              ],
            },
          },
          {
            rank: 2,
            key: KEY.F_MAJOR,
            sections: {
              create: [
                {
                  rank: 1,
                  metreNumerator: 3,
                  metreDenominator: 8,
                  tempoIndication: {
                    connectOrCreate: {
                      where: {
                        baseTerm_additionalTerm: {
                          baseTerm: "Andante",
                          additionalTerm: "cantabile con moto",
                        }
                      },
                      create: {
                        baseTerm: "Andante",
                        additionalTerm: "cantabile con moto",
                      }
                    }
                  },
                },
              ],
            }
          },
          {
            rank: 3,
            key: KEY.C_MAJOR,
            sections: {
              create: [
                {
                  rank: 1,
                  metreNumerator: 3,
                  metreDenominator: 4,
                  tempoIndication: {
                    connectOrCreate: {
                      where: {
                        baseTerm_additionalTerm: {
                          baseTerm: "Allegro",
                          additionalTerm: "molto e vivace",
                        }
                      },
                      create: {
                        baseTerm: "Allegro",
                        additionalTerm: "molto e vivace",
                      }
                    }
                  }
                }
              ],
            }
          },
          {
            rank: 4,
            key: KEY.C_MAJOR,
            sections: {
              create: [
                {
                  rank: 1,
                  metreNumerator: 2,
                  metreDenominator: 4,
                  tempoIndication: {
                    connectOrCreate: {
                      where: {
                        baseTerm_additionalTerm: {
                          baseTerm: "Adagio",
                          additionalTerm: "",
                        }
                      },
                      create: {
                        baseTerm: "Adagio",
                        additionalTerm: "",
                      }
                    }
                  }
                },
                {
                  rank: 2,
                  metreNumerator: 2,
                  metreDenominator: 4,
                  tempoIndication: {
                    connectOrCreate: {
                      where: {
                        baseTerm_additionalTerm: {
                          baseTerm: "Allegro",
                          additionalTerm: "molto e vivace",
                        }
                      },
                      create: {
                        baseTerm: "Allegro",
                        additionalTerm: "molto e vivace",
                      }
                    }
                  }
                }
              ],
            }
          }
        ],
      },
    },
    include: {
      movements: {
        include: {
          sections: true,
        }
      }
    },
  });
  console.log(`[] piece :`, piece)

  // const tasks = await Promise.all(
  //   composer.compositions.map((composition) => {
  //     if (composition.title === "Symphony No.1, Op.21") {
  //       composition.movements.map((movement) => {
  //         return db.task.createMany({
  //           data: new Array(10).fill(1).map((_, i) => {
  //             return {
  //               name: `Task ${i}`,
  //               ownerId: user.id,
  //               projectId: project.id,
  //               description: `Everything that describes Task ${i}`,
  //               status: getRandomTaskStatus(),
  //             };
  //           }),
  //         })
  //       })
  //     }
  //   })
  // );

  // console.log({user, tasks});
}

seedDB()
.then(async () => {
  await db.$disconnect();
})
.catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});