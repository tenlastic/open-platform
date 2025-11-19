import { IncomingMessage } from 'http';
import { Context, Request, Response, State } from '../types';
import { RequestMock } from './request';
import { ResponseMock } from './response';

export type ContextMockInput<TContext> = TContext extends Context<
  infer TParams,
  infer TRequest,
  infer TResponse
>
  ? {
      params?: TParams;
      req?: IncomingMessage;
      request?: Partial<Request<TRequest>>;
      response?: Partial<Response<TResponse>>;
      state?: Partial<State>;
    }
  : never;

export function ContextMock<TContext extends Context>(input?: ContextMockInput<TContext>) {
  return {
    params: input?.params || {},
    req: input?.req,
    request: RequestMock(input?.request),
    response: ResponseMock(input?.response),
    state: input?.state || {},
  } as TContext;
}
