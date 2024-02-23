// Given an object with potential nested objects, delete all properties that are null
export default function deleteNullPropertiesFromObject<T extends {}>(
  obj: T,
): T {
  const newObj = { ...obj };
  Object.keys(newObj).forEach((key) => {
    if (newObj[key] === null) {
      delete newObj[key];
    } else if (Array.isArray(newObj[key])) {
      newObj[key] = newObj[key].map((item: any) =>
        typeof item === "object" ? deleteNullPropertiesFromObject(item) : item,
      );
    } else if (typeof newObj[key] === "object") {
      newObj[key] = deleteNullPropertiesFromObject(newObj[key]);
    }
  });
  return newObj as T;
}
