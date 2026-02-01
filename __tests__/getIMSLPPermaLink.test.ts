import { describe, expect, it } from "@jest/globals";
import getIMSLPPermaLink from "@/utils/getIMSLPPermaLink";

describe("getIMSLPPermaLink", () => {
  it("converts ephemeral mirror/file links containing IMSLP<id>- into ImagefromIndex permalink", () => {
    const input =
      "https://vmirror.imslp.org/files/imglnks/usimg/f/f8/IMSLP78946-PMLP159752-Mozart_Werke_Breitkopf_Serie_10_KV249.pdf";
    expect(getIMSLPPermaLink(input)).toBe(
      "https://imslp.org/wiki/Special:ImagefromIndex/78946",
    );
  });

  it("converts Special:ImagefromIndex/<id>/<random> links into ImagefromIndex permalink", () => {
    const input = "https://imslp.org/wiki/Special:ImagefromIndex/78946/senen";
    expect(getIMSLPPermaLink(input)).toBe(
      "https://imslp.org/wiki/Special:ImagefromIndex/78946",
    );
  });

  it("converts Special:ImagefromIndex/<id>%2F<random> links into ImagefromIndex permalink", () => {
    const input = "https://imslp.org/wiki/Special:ImagefromIndex/78946%2Fsevqs";
    expect(getIMSLPPermaLink(input)).toBe(
      "https://imslp.org/wiki/Special:ImagefromIndex/78946",
    );
  });

  it("converts Special:IMSLPImageHandler/<id>%2F<random> links into ImagefromIndex permalink", () => {
    const input =
      "https://imslp.org/wiki/Special:IMSLPImageHandler/78946%2Fsenen";
    expect(getIMSLPPermaLink(input)).toBe(
      "https://imslp.org/wiki/Special:ImagefromIndex/78946",
    );
  });

  it("converts Special:IMSLPImageHandler/<id>/<random> links into ImagefromIndex permalink", () => {
    const input =
      "https://imslp.org/wiki/Special:IMSLPImageHandler/78946/sevqs";
    expect(getIMSLPPermaLink(input)).toBe(
      "https://imslp.org/wiki/Special:ImagefromIndex/78946",
    );
  });

  it("returns the original link when no supported IMSLP id pattern is found", () => {
    const input = "https://example.com/not-imslp";
    expect(getIMSLPPermaLink(input)).toBe(input);
  });
});
