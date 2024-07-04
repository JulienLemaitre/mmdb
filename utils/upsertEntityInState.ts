export default function upsertEntityInState({
  state,
  entityName,
  entity,
  idKey = "id",
  replace = false,
}) {
  console.log("[upsertEntityInState]", { state, entityName, entity, idKey });
  let newState = state;
  // If we find an entity in state with the same id, we update it
  const isEntityInState = newState[entityName]?.find(
    (stateEntity) => entity[idKey] && stateEntity[idKey] === entity[idKey],
  );
  if (isEntityInState) {
    console.log(
      `[] UPDATE entity in array with idKey [${idKey}] new value :`,
      entity,
    );
    newState = {
      ...newState,
      [entityName]: newState[entityName].map((stateEntity) =>
        stateEntity[idKey] === entity[idKey] ? entity : stateEntity,
      ),
    };
  } else {
    // otherwise, we push the entity to the array
    console.log(`[] ADD new entity in array :`, entity);
    newState = {
      ...newState,
      [entityName]: [...newState[entityName], entity],
    };
  }
  return newState;
}
