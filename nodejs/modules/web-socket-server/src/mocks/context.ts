import { Context, Request, Response, State } from '../definitions';
import { RequestMock } from './request';
import { ResponseMock } from './response';

export type ContextMockInput<TContext> = TContext extends Context<infer TRequest, infer TResponse>
  ? {
      params?: { [key: string]: string };
      request?: Partial<Request<TRequest>>;
      response?: Partial<Response<TResponse>>;
      state?: Partial<State>;
    }
  : never;

export function ContextMock<TContext extends Context>(input?: ContextMockInput<TContext>) {
  return {
    params: input?.params || {},
    request: RequestMock(input?.request),
    response: ResponseMock(input?.response),
    state: input?.state || {},
  } as TContext;
}
