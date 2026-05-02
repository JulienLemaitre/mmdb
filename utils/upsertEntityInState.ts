import { prodLog } from "@/utils/debugLogger";

export default function upsertEntityInState({
  state,
  entityName,
  entity,
  idKey = "id",
}) {
  let newState = state;

  if (!newState[entityName]) {
    prodLog.warn(
      `[upsertEntityInState] state[${entityName}] does not exist. return state:`,
      state,
    );
    return state;
  }

  const entityClone = structuredClone(entity);

  const isEntityInState = newState[entityName]?.some(
    (stateEntity) =>
      entityClone[idKey] && stateEntity[idKey] === entityClone[idKey],
  );

  if (isEntityInState) {
    // If we find an entity in state with the same id, we REPLACE it
    newState = {
      ...newState,
      [entityName]: newState[entityName].map((stateEntity) =>
        stateEntity[idKey] === entityClone[idKey] ? entityClone : stateEntity,
      ),
    };
  } else {
    // If not, we append the payload entity to the state array
    newState = {
      ...newState,
      [entityName]: [...newState[entityName], entityClone],
    };
  }
  return newState;
}
