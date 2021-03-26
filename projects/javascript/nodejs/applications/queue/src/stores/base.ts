import { EventEmitter } from 'events';

import { BaseModel } from '../models';

export class BaseStore<T extends BaseModel> {
  public emitter = new EventEmitter();
  public items: T[] = [];

  public delete(_id: string) {
    const index = this.items.findIndex(qm => qm._id === _id);
    const [item] = this.items.splice(index, 1);
    this.emitter.emit('delete', item);
  }

  public insert(item: T) {
    this.items.push(item);
    this.emitter.emit('insert', item);
  }

  public update(item: T) {
    const index = this.items.findIndex(qm => qm._id === item._id);
    this.items[index] = item;
    this.emitter.emit('update', item);
  }
}
