import { EventEmitter } from 'events';

import { BaseModel } from '../models';

export class BaseStore<T extends BaseModel> {
  public array: T[] = [];
  public emitter = new EventEmitter();
  public map = new Map<string, T>();

  /**
   * Adds a Record to the Store if not already included.
   */
  public add(item: T) {
    const index = this.array.findIndex(a => a._id === item._id);
    if (index < 0) {
      this.array.push(item);
    }

    this.map.set(item._id, item);
  }

  /**
   * Deletes a Record from the Store. Emits a 'delete' event.
   */
  public delete(_id: string) {
    const index = this.array.findIndex(a => a._id === _id);
    if (index >= 0) {
      this.array.splice(index, 1);
    }

    const item = this.map.get(_id);
    this.map.delete(_id);

    if (item) {
      this.emitter.emit('delete', item);
    }
  }

  /**
   * Inserts a Record into the Store. Emits an 'insert' event.
   */
  public insert(item: T) {
    const index = this.array.findIndex(a => a._id === item._id);
    if (index < 0) {
      this.array.push(item);
    }

    this.map.set(item._id, item);
    this.emitter.emit('insert', item);
  }

  /**
   * Updates a Record in the Store. Emits an 'update' event.
   */
  public update(item: T) {
    const index = this.array.findIndex(a => a._id === item._id);
    if (index >= 0) {
      this.array[index] = item;
    } else {
      this.array.push(item);
    }

    this.map.set(item._id, item);
    this.emitter.emit('update', item);
  }
}
