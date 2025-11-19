import { Request } from '../types';

export type RequestMockInput<TRequest> = TRequest extends Request<infer TDocument>
  ? {
      body?: Partial<TDocument>;
      headers?: Partial<Record<string, string>>;
      host?: string;
      query?: Partial<TDocument>;
      protocol?: string;
      rawQuery?: Partial<Record<string, string>>;
    }
  : never;

export function RequestMock<TRequest extends Request>(input?: RequestMockInput<TRequest>) {
  return {
    body: input?.body || {},
    headers: input?.headers || {},
    host: input?.host,
    query: input?.query || {},
    protocol: input?.protocol,
    rawQuery: input?.rawQuery || {},
  } as TRequest;
}
