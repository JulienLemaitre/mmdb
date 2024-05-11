import { PersistableFeedFormState } from "@/components/context/feedFormContext";
import { Prisma } from "@prisma/client";

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
    create: {
      text: newTempoIndication.text,
      creator: {
        connect: {
          id: creatorId,
        },
      },
    },
  };
}
