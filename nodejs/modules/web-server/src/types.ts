import { DocumentToObject, IFindQuery } from '@tenlastic/mongoose-permissions';
import * as koa from 'koa';
import * as mongoose from 'mongoose';

export interface Context<TParams = unknown, TRequestBody = unknown, TResponseBody = unknown>
  extends koa.Context {
  params?: TParams;
  request: Request<TRequestBody>;
  response: Response<TResponseBody>;
  state: State;
}

export interface CountRequest<TDocument extends mongoose.Document> {
  where?: mongoose.FilterQuery<TDocument>;
}

export interface CountResponse {
  count: number;
}

export interface FindLogsParameters {
  _id?: string;
  container?: string;
  pod?: string;
}

export interface FindLogsRequest {
  since?: string;
  tail?: number;
}

export interface FindLogsResponse {
  records: Array<{ body: string; level?: string; unix: number }>;
}

export type FindRequest<TDocument extends mongoose.Document> = IFindQuery<TDocument>;

export interface Jwt {
  authorization?: { _id?: string; roles?: string[] };
  jti?: string;
  type?: 'access' | 'refresh';
  user?: { _id?: string; username?: string };
}

export type RecordRequest<TDocument extends mongoose.Document> = Partial<TDocument>;

export interface RecordResponse<TDocument extends mongoose.Document> {
  record: Partial<DocumentToObject<TDocument>>;
}

export interface RecordsResponse<TDocument extends mongoose.Document> {
  records: Partial<DocumentToObject<TDocument>>[];
}

export interface Request<T = unknown> extends koa.Request {
  body?: T;
  query: T;
  rawQuery?: { [key: string]: string };
}

export interface Response<T = unknown> extends koa.Response {
  body: T;
  status: number;
}

export interface State {
  apiKey?: string;
  authorization?: { _id?: string; roles?: string[] };
  jwt?: Jwt;
  user?: { _id?: string; username?: string };
}
