/**
 * Checks if any fields in the provided object are dirty (i.e., have been modified).
 * This function deeply explores the object and returns a boolean indicating if any field is dirty.
 *
 * @param fields - An object where each property can be a boolean, an array of objects, or an object with the same type as the fields object.
 * @returns A boolean indicating if any field in the object is dirty.
 */
export default function checkAreFieldsDirty(
  fields: Record<string, unknown>,
): boolean {
  const flattenObject = (
    obj: Record<string, unknown>,
  ): Record<string, boolean> => {
    const result: Record<string, boolean> = {};
    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        if (typeof obj[key] === "object" && obj[key] !== null) {
          const flattened = flattenObject(obj[key] as Record<string, unknown>);
          for (const nestedKey in flattened) {
            if (Object.hasOwn(flattened, nestedKey)) {
              result[key + "." + nestedKey] = flattened[nestedKey];
            }
          }
        } else {
          result[key] = true;
        }
      }
    }
    return result;
  };
  const endObject = flattenObject(fields);
  return Object.keys(endObject).length > 0;
}
