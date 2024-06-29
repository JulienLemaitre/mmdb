import { CONTRIBUTION_ROLE } from "@prisma/client";

export default function getRoleLabel(role: CONTRIBUTION_ROLE) {
  switch (role) {
    case CONTRIBUTION_ROLE.MM_PROVIDER:
      return "Metronome mark provider";
    case CONTRIBUTION_ROLE.EDITOR:
      return "Editor";
    case CONTRIBUTION_ROLE.TRANSLATOR:
      return "Translator";
    case CONTRIBUTION_ROLE.TRANSCRIBER:
      return "Transcriber";
    case CONTRIBUTION_ROLE.ARRANGER:
      return "Arranger";
    case CONTRIBUTION_ROLE.PUBLISHER:
      return "Publisher";
    case CONTRIBUTION_ROLE.OTHER:
      return "Other";
    default:
      throw new Error(`Unknown role: ${role}`);
  }
}
