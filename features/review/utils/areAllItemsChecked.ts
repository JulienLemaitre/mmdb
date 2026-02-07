export function areAllItemsChecked(items: any[], checkedFields: Set<string>) {
  return items.every((item) => checkedFields.has(item.fieldPath));
}
