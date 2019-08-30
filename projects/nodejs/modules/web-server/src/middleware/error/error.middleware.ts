import { Context, MiddlewareCallback } from '../../';

/**
 * Catches all errors and returns the message in the body.
 */
export async function errorMiddleware(ctx: Context, next: MiddlewareCallback) {
  try {
    await next();
  } catch (e) {
    const status = e.status || 400;

    console.error(e);
    switch (e.name) {
      case 'PermissionError':
        ctx.response.status = 401;
        ctx.response.body = { error: e.message };
        break;

      case 'ValidationError':
        const errors = Object.keys(e.errors).map(key => {
          const { kind, message, name, path, value } = e.errors[key];
          return { kind, message, name, path, value };
        });

        ctx.response.status = status;
        ctx.response.body = { errors };
        break;

      default:
        ctx.response.status = status;
        ctx.response.body = { error: e.message };
        break;
    }
  }
}
