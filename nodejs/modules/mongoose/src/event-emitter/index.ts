export type AsyncListener<T> = (event: T) => Promise<any>;
export type SyncListener<T> = (event: T) => void;

interface Listener<T> {
  async: boolean;
  listener: AsyncListener<T> | SyncListener<T>;
}

export class EventEmitter<T> {
  private listeners: Array<Listener<T>> = [];

  public async = (listener: AsyncListener<T>) => this.listeners.push({ async: true, listener });

  public emit = async (event?: T) => {
    for (const listener of this.listeners) {
      if (listener.async) {
        await listener.listener(event);
      } else {
        listener.listener(event);
      }
    }
  };

  public remove = (listener: AsyncListener<T> | SyncListener<T>) => {
    const index = this.listeners.findIndex((l) => l.listener === listener);
    this.listeners.splice(index, 1);
  };

  public sync = (listener: SyncListener<T>) => this.listeners.push({ async: false, listener });
}
