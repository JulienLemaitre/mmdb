/**
 * This function take the number of IMSLP score contained in the link given as argument, and return a link to the url that will generate a new valid ephemeral link.
 * @param link
 */
// Lines 1-26
export default function getIMSLPPermaLink(link: string) {
  const scoreNumber =
    // Ephemeral mirror/file links like:
    // https://vmirror.imslp.org/.../IMSLP78946-....pdf
    link.match(/IMSLP(\d+)-/)?.[1] ??
    // Special:ImagefromIndex links like:
    // https://imslp.org/wiki/Special:ImagefromIndex/78946/senen
    // https://imslp.org/wiki/Special:ImagefromIndex/78946%2Fsenen
    link.match(/\/Special:ImagefromIndex\/(\d+)(?:%2F|\/|$)/)?.[1] ??
    // Special:IMSLPImageHandler links like:
    // https://imslp.org/wiki/Special:IMSLPImageHandler/78946%2Fsenen
    // https://imslp.org/wiki/Special:IMSLPImageHandler/78946/senen
    link.match(
      /\/Special:IMSLPImageHandler\/(\d+)(?:%2F|\/)[A-Za-z0-9]+(?:[?#]|$)/,
    )?.[1];

  if (scoreNumber) {
    return `https://imslp.org/wiki/Special:ImagefromIndex/${scoreNumber}`;
  }

  return link; // Return the original link if it's not a valid IMSLP score link.
}
