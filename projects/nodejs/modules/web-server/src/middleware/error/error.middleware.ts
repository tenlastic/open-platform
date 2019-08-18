import * as mongoose from 'mongoose';

import { Context, MiddlewareCallback } from '../../';

/**
 * Catches all errors and returns the message in the body.
 */
export async function errorMiddleware(ctx: Context, next: MiddlewareCallback) {
  try {
    await next();
  } catch (e) {
    let status = e.status || 400;

    if (e.name === 'ValidationError') {
      const errors = Object.keys(e.errors).map(key => {
        const { kind, message, name, path, value } = e.errors[key];
        return { kind, message, name, path, value };
      });

      ctx.response.status = status;
      ctx.response.body = { errors };

      return;
    }

    if (e.message === 'User does not have permission to perform this action.') {
      status = 401;
    }

    ctx.response.status = status;
    ctx.response.body = { error: e.message };
  }
}
