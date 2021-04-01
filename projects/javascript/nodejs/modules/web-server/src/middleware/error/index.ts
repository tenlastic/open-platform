import { Context } from '../../context';

/**
 * Catches all errors and returns the message in the body.
 */
export async function errorMiddleware(ctx: Context, next: () => Promise<void>) {
  try {
    await next();
  } catch (e) {
    const status = e.status || 400;

    switch (e.name) {
      case 'NamespaceLimitError':
        ctx.response.status = status;
        ctx.response.body = getNamespaceLimitError(e);
        break;

      case 'PermissionError':
        ctx.response.status = 401;
        ctx.response.body = getError(e);
        break;

      case 'QueueMemberGameInvitationError':
        ctx.response.status = status;
        ctx.response.body = getQueueMemberGameInvitationError(e);
        break;

      case 'QueueMemberUniquenessError':
        ctx.response.status = status;
        ctx.response.body = getQueueMemberUniquenessError(e);
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
        if (process.env.NODE_ENV !== 'test') {
          console.error(e.stack);
        }
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

function getQueueMemberGameInvitationError(err: any) {
  const { message, name, userIds } = err;
  return { errors: [{ message, name, userIds }] };
}

function getQueueMemberUniquenessError(err: any) {
  const { message, name, userIds } = err;
  return { errors: [{ message, name, userIds }] };
}

function getUniquenessError(err: any) {
  const { message, name, paths, values } = err;
  return { errors: [{ message, name, paths, values }] };
}

function getValidationError(err: any) {
  const errors = Object.keys(err.errors).map(key => {
    const { kind, message, name, path, value } = err.errors[key];
    return { kind, message, name, path, value };
  });

  return { errors };
}
