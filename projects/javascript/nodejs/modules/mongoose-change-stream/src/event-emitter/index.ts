/**
 * Typed Event Emitter
 * Source: https://basarat.gitbooks.io/typescript/docs/tips/typed-event.html
 */

export type AsyncListener<T> = (event: T) => Promise<any>;
export type SyncListener<T> = (event: T) => void;

interface Listener<T> {
  async: boolean;
  listener: AsyncListener<T> | SyncListener<T>;
}

export class EventEmitter<T> {
  private listeners: Array<Listener<T>> = [];

  public emit = async (event?: T) => {
    for (const listener of this.listeners) {
      if (listener.async) {
        await listener.listener(event);
      } else {
        listener.listener(event);
      }
    }
  };

  public async = (listener: AsyncListener<T>) => {
    this.listeners.push({ async: true, listener });
  };

  public sync = (listener: SyncListener<T>) => {
    this.listeners.push({ async: false, listener });
  };
}
