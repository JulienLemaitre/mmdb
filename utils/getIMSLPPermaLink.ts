/**
 * This function take the number of IMSLP score contained in the link given as argument, and return a link to the url that will generate a new valid ephemeral link.
 * @param link
 */
export default function getIMSLPPermaLink(link: string) {
  const imslpScoreMatch = link.match(/IMSLP(\d+)-/);
  if (imslpScoreMatch) {
    const [_, scoreNumber] = imslpScoreMatch;
    return `https://imslp.org/wiki/Special:ImagefromIndex/${scoreNumber}/sevqs`;
  }
  return link; // Return the original link if it's not a valid IMSLP score link.
}
