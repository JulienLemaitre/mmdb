import { KeyBase } from "@/types/formTypes";

/**
 * This function take a js property name type KeyBase as input, and return the string to display
 * @param {string} keyBase
 * @example ("fastestStructuralNotes") => "Fastest structural notes"
 */
export default function getKeyBaseString(keyBase: KeyBase): string {
  switch (keyBase) {
    case "fastestStructuralNotes":
      return "Fastest structural note";
    case "fastestStaccatoNotes":
      return "Fastest staccato note";
    case "fastestOrnamentalNotes":
      return "Fastest ornamental note";
    case "fastestRepeatedNotes":
      return "Fastest repeated note";
    default:
      return "";
  }
}
