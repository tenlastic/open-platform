import { EntityState, EntityStore } from '@datorama/akita';

export class BaseStore<TState extends EntityState, TModel> extends EntityStore<TState, TModel> {
  public upsertMany(entities: TModel[]) {
    const value = this.getValue();

    const newState = entities.reduce((previous, current) => {
      const id = current[this.idKey];
      return { ...previous, [id]: current };
    }, {});
    const oldState = value.entities;

    return this.set({ ...oldState, ...newState });
  }
}
