import { URL_API_GETALL_TEMPO_INDICATIONS } from "@/utils/routes";
import { TEMPO_INDICATION_NONE_ID } from "@/utils/constants";

export default async function getTempoIndicationSelectList() {
  return fetch(URL_API_GETALL_TEMPO_INDICATIONS)
    .then((res) => res.json())
    .then((data) => {
      // Get the index of tempoIndication with id === TEMPO_INDICATION_NONE_ID (text === "-- None --")
      const noneIndex = data.findIndex(
        (tempoIndication) => tempoIndication.id === TEMPO_INDICATION_NONE_ID,
      );
      // Copy the tempoIndication with text === "-- None --"
      const noneTempoIndication = data[noneIndex];
      // Remove the targeted tempoIndication from the list
      data.splice(noneIndex, 1);
      // put the tempoIndication with text === "-- None --" as the first element in the array
      data.unshift(noneTempoIndication);

      return data;
    });
}
