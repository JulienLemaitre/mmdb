import { Prisma } from "@prisma/client";
import { PersistableFeedFormState } from "@/types/feedFormTypes";

export default function getTempoIndicationNestedDBInputFromState(
  tempoIndicationId: string,
  state: PersistableFeedFormState,
  creatorId: string,
): Prisma.TempoIndicationCreateNestedOneWithoutSectionsInput {
  const newTempoIndication = state.tempoIndications.find(
    (ti) => ti.id === tempoIndicationId && ti.isNew,
  );

  if (!newTempoIndication) {
    return {
      connect: {
        id: tempoIndicationId,
      },
    };
  }

  return {
    connectOrCreate: {
      where: {
        text: newTempoIndication.text,
      },
      create: {
        text: newTempoIndication.text,
        creator: {
          connect: {
            id: creatorId,
          },
        },
      },
    },
  };
}
