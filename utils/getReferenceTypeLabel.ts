import { REFERENCE_TYPE } from "@prisma/client";

export default function getReferenceTypeLabel(
  referenceType: REFERENCE_TYPE,
): string {
  switch (referenceType) {
    case REFERENCE_TYPE.ISBN:
      return "ISBN";
    case REFERENCE_TYPE.ISMN:
      return "ISMN";
    case REFERENCE_TYPE.PLATE_NUMBER:
      return "Plate number";
    default:
      throw new Error(`Unknown reference type: ${referenceType}`);
  }
}
