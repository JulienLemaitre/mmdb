import getSourceTypeLabel from "@/utils/getSourceTypeLabel";
import {
  CONTRIBUTION_ROLE,
  KEY,
  NOTE_VALUE,
  REFERENCE_TYPE,
  SOURCE_TYPE,
} from "@/prisma/client";
import formatToPhraseCase from "@/utils/formatToPhraseCase";
import getKeyLabel from "@/utils/getKeyLabel";
import getNoteValueLabel from "@/utils/getNoteValueLabel";
import getReferenceTypeLabel from "@/utils/getReferenceTypeLabel";
import getRoleLabel from "@/utils/getRoleLabel";
import { ChecklistEntityType } from "@/types/reviewTypes";

const valueFormatFunctions = [
  {
    type: "MM_SOURCE",
    path: "type",
    format: (v: string) => getSourceTypeLabel(v as SOURCE_TYPE),
  },
  {
    type: "REFERENCE",
    path: "type",
    format: (v: string) => getReferenceTypeLabel(v as REFERENCE_TYPE),
  },
  {
    type: "CONTRIBUTION",
    path: "role",
    format: (v: string) => getRoleLabel(v as CONTRIBUTION_ROLE),
  },
  {
    type: "PIECE_VERSION",
    path: "category",
    format: (v: string) => formatToPhraseCase(v),
  },
  {
    type: "MOVEMENT",
    path: "key",
    format: (v: string) => getKeyLabel(v as KEY),
  },
  {
    type: "METRONOME_MARK",
    path: "beatUnit",
    format: (v: string) => getNoteValueLabel(v as NOTE_VALUE),
  },
];

export default function getItemValueDisplay({
  entityType,
  fieldPath,
  value,
}: {
  entityType: ChecklistEntityType;
  fieldPath: string;
  value: any;
}) {
  const formatFunction = valueFormatFunctions.find(
    (func) => func.type === entityType && func.path === fieldPath,
  );
  if (formatFunction) {
    return formatFunction.format(value);
  }

  // General case
  return value;
}
