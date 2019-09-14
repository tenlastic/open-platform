import { Context, MiddlewareCallback } from '../../';

/**
 * Catches all errors and returns the message in the body.
 */
export async function errorMiddleware(ctx: Context, next: MiddlewareCallback) {
  try {
    await next();
  } catch (e) {
    const status = e.status || 400;

    switch (e.name) {
      case 'PermissionError':
        ctx.response.status = 401;
        ctx.response.body = getError(e);
        break;

      case 'UniquenessError':
        ctx.response.status = status;
        ctx.response.body = getUniquenessError(e);
        break;

      case 'ValidationError':
        ctx.response.status = status;
        ctx.response.body = getValidationError(e);
        break;

      default:
        ctx.response.status = status;
        ctx.response.body = getError(e);
        break;
    }
  }
}

function getError(err: any) {
  const { message, name } = err;
  return { error: { message, name } };
}

function getUniquenessError(err: any) {
  const { message, name, paths, values } = err;
  return { error: { message, name, paths, values } };
}

function getValidationError(err: any) {
  const errors = Object.keys(err.errors).map(key => {
    const { kind, message, name, path, value } = err.errors[key];
    return { kind, message, name, path, value };
  });

  return { errors };
}
