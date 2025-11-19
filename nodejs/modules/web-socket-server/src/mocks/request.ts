import { Headers, Method, Request } from '../definitions';

export type RequestMockInput<TRequest> = TRequest extends Request<infer TDocument>
  ? {
      _id?: string;
      body?: Partial<TDocument>;
      headers?: Partial<Headers>;
      method?: Method;
      path?: string;
    }
  : never;

export function RequestMock<TRequest extends Request>(input?: RequestMockInput<TRequest>) {
  return {
    _id: input?._id,
    body: input?.body,
    headers: input?.headers || {},
    method: input?.method,
    path: input?.path,
  } as TRequest;
}
