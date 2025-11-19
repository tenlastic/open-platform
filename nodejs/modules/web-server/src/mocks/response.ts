import { Response } from '../types';

export type ResponseMockInput<TResponse> = TResponse extends Response<infer TDocument>
  ? {
      body?: Partial<TDocument>;
      status?: number;
    }
  : never;

export function ResponseMock<TResponse extends Response>(input?: ResponseMockInput<TResponse>) {
  return {
    body: input?.body || {},
    status: input?.status || {},
  } as TResponse;
}
