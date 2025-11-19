import { Response, StatusCode } from '../definitions';

export type ResponseMockInput<TRequest> = TRequest extends Response<infer TDocument>
  ? {
      _id?: string;
      body?: Partial<TDocument>;
      status?: StatusCode;
    }
  : never;

export function ResponseMock<TResponse extends Response>(input?: ResponseMockInput<TResponse>) {
  return { _id: input?._id, body: input?.body, status: input?.status } as TResponse;
}
