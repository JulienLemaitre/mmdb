/**
 * Remove everything after a potential open parenthesis from string value
 * @param value
 */
export default function parseValueRemoveParenthesis(value: any) {
  if (typeof value === "string") {
    return value.split("(")[0].trim()
  }
  return value
}