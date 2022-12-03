import { Next } from 'koa';

import { Context } from '../../context';

/**
 * Catches all errors and returns the message in the body.
 */
export async function errorMiddleware(ctx: Context, next: Next) {
  try {
    await next();
  } catch (e) {
    const status = e.status || 400;

    switch (e.name) {
      case 'DuplicateKeyError':
      case 'DuplicateKeyIndexError':
        ctx.response.status = status;
        ctx.response.body = getDuplicateKeyError(e);
        break;

      case 'NamespaceLimitError':
        ctx.response.status = status;
        ctx.response.body = getNamespaceLimitError(e);
        break;

      case 'PermissionError':
        ctx.response.status = 401;
        ctx.response.body = getError(e);
        break;

      case 'QueueMemberAuthorizationError':
        ctx.response.status = status;
        ctx.response.body = getQueueMemberAuthorizationError(e);
        break;

      case 'QueueMemberDuplicateKeyError':
        ctx.response.status = status;
        ctx.response.body = getQueueMemberDuplicateKeyError(e);
        break;

      case 'RecordNotFoundError':
        ctx.response.status = 404;
        ctx.response.body = getError(e);
        break;

      case 'RefreshTokenError':
        ctx.response.status = status;
        ctx.response.body = getError(e);
        break;

      case 'ValidationError':
        ctx.response.status = status;
        ctx.response.body = getValidationError(e);
        break;

      default:
        console.error(e.stack);
        ctx.response.status = status;
        ctx.response.body = getError(e);
        break;
    }
  }
}

function getError(err: any) {
  const { message, name } = err;
  return { errors: [{ message, name }] };
}

function getNamespaceLimitError(err: any) {
  const { message, name, path, value } = err;
  return { errors: [{ message, name, path, value }] };
}

function getQueueMemberAuthorizationError(err: any) {
  const { message, name, userIds } = err;
  return { errors: [{ message, name, userIds }] };
}

function getQueueMemberDuplicateKeyError(err: any) {
  const { message, name, userIds } = err;
  return { errors: [{ message, name, userIds }] };
}

function getDuplicateKeyError(err: any) {
  const { message, name, paths, values } = err;
  return { errors: [{ message, name, paths, values }] };
}

function getValidationError(err: any) {
  const errors = Object.keys(err.errors)
    .filter((key) => err.errors[key].name !== 'ValidationError')
    .sort()
    .map((key) => {
      const { kind, message, name, value } = err.errors[key];
      return { kind, message, name, path: key, value };
    });

  return { errors };
}
