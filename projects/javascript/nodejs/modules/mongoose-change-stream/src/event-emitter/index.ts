/**
 * Typed Event Emitter
 * Source: https://basarat.gitbooks.io/typescript/docs/tips/typed-event.html
 */

type Listener<T> = (event: T) => void | Promise<any>;

export interface Disposable {
  dispose(): any;
}

export class EventEmitter<T> {
  private listeners: Array<Listener<T>> = [];
  private listenersOnce: Array<Listener<T>> = [];

  public emit = async (event?: T) => {
    /** Update any general listeners */
    for (const listener of this.listeners) {
      await listener(event);
    }

    /** Clear the `once` queue */
    for (const listener of this.listenersOnce) {
      const index = this.listeners.findIndex(l => l === listener);

      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    }
  };

  public off = (listener: Listener<T>) => {
    const listenersIndex = this.listeners.indexOf(listener);
    const listenersOnceIndex = this.listenersOnce.indexOf(listener);

    if (listenersIndex >= 0) {
      this.listeners.splice(listenersIndex, 1);
    }

    if (listenersOnceIndex >= 0) {
      this.listenersOnce.splice(listenersOnceIndex, 1);
    }
  };

  public on = (listener: Listener<T>): Disposable => {
    this.listeners.push(listener);

    return {
      dispose: () => this.off(listener),
    };
  };

  public once = (listener: Listener<T>): void => {
    this.listeners.push(listener);
    this.listenersOnce.push(listener);
  };

  public pipe = (te: EventEmitter<T>): Disposable => {
    return this.on(e => te.emit(e));
  };
}
