import { Context } from '../definitions';

export type MiddlewareLayer = (ctx: Context, next?: () => Promise<void>) => Promise<void>;

export class Middleware {
  private layers: MiddlewareLayer[];

  constructor(middleware?: MiddlewareLayer[]) {
    this.layers = middleware || [];
  }

  /**
   * Runs the middleware.
   */
  public async run(ctx: Context) {
    if (this.layers.length === 0) {
      return;
    }

    const layers = [];

    // Create a linked list of middleware functions,
    // pointing each middleware to the next one.
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const current = this.layers[i];

      const noop = () => {};
      const next = layers[i + 1] || noop;

      layers[i] = () => current(ctx, next);
    }

    // Call the first middleware to start the chain.
    const first = layers[0];
    return first();
  }

  /**
   * Adds layers to the stack.
   */
  public use(layer: MiddlewareLayer | MiddlewareLayer[]) {
    this.layers = this.layers.concat(layer);
  }
}
