/**
 * Takes the first value of a potential range of dash separated values
 * @param value
 */
export default function takeFirstOfPotentialRange(value: any) {
  if (typeof value === 'string' && value.includes('-')) {
    return value.split('-')[0].trim()
  }
  return value
}