import { Context, MiddlewareCallback } from '../../';

/**
 * Catches all errors and returns the message in the body.
 */
export async function errorMiddleware(ctx: Context, next: MiddlewareCallback) {
  try {
    await next();
  } catch (e) {
    let status = e.status || 400;

    if (e.message === 'User does not have permission to perform this action.') {
      status = 401;
    }

    ctx.response.status = status;
    ctx.response.body = { error: e.message };
  }
}
