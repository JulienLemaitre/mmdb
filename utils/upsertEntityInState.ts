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

  // If we find an entity in state with the same id, we REPLACE it
  // TODO: a shelf change is ready to implement proper replace, but we need to be sure it will not break anything
  const isEntityInState = newState[entityName]?.some(
    (stateEntity) =>
      entityClone[idKey] && stateEntity[idKey] === entityClone[idKey],
  );

  if (isEntityInState) {
    newState = {
      ...newState,
      [entityName]: newState[entityName].map((stateEntity) =>
        stateEntity[idKey] === entityClone[idKey] ? entityClone : stateEntity,
      ),
    };
  } else {
    newState = {
      ...newState,
      [entityName]: [...newState[entityName], entityClone],
    };
  }
  return newState;
}
