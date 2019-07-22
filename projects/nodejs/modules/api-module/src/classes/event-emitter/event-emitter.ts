/**
 * Typed Event Emitter
 * Source: https://basarat.gitbooks.io/typescript/docs/tips/typed-event.html
 */

type Listener<T> = (event: T) => any;

export interface Disposable {
  dispose(): any;
}

/** passes through events as they happen. You will not get events from before you start listening */
export class EventEmitter<T> {
  private listeners: Array<Listener<T>> = [];
  private listenersOnce: Array<Listener<T>> = [];

  public emit = (event: T) => {
    /** Update any general listeners */
    this.listeners.forEach(listener => listener(event));

    /** Clear the `once` queue */
    if (this.listenersOnce.length > 0) {
      this.listenersOnce.forEach(listener => listener(event));
      this.listenersOnce = [];
    }
  };

  public off = (listener: Listener<T>) => {
    const callbackIndex = this.listeners.indexOf(listener);

    if (callbackIndex > -1) {
      this.listeners.splice(callbackIndex, 1);
    }
  };

  public on = (listener: Listener<T>): Disposable => {
    this.listeners.push(listener);

    return {
      dispose: () => this.off(listener),
    };
  };

  public once = (listener: Listener<T>): void => {
    this.listenersOnce.push(listener);
  };

  public pipe = (te: EventEmitter<T>): Disposable => {
    return this.on(e => te.emit(e));
  };
}
