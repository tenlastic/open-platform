import * as mongoose from 'mongoose';

export class PermissionError extends Error {
  constructor() {
    super('User does not have permission to perform this action.');

    this.name = 'PermissionError';
  }
}

export interface IAuthorization {
  _id?: string;
  roles?: string[];
}

export interface IContext<TDocument extends mongoose.Document> {
  credentials: ICredentials;
  Model: mongoose.Model<TDocument>;
  options: IOptions<TDocument>;
}

export interface ICredentials {
  apiKey?: string;
  authorization?: IAuthorization;
  user?: IUser;
}

export interface IFindQuery<TDocument extends mongoose.Document> {
  limit?: number;
  select?: string | string[];
  skip?: number;
  sort?: string;
  where?: mongoose.FilterQuery<TDocument>;
}

export interface IOptions<TDocument extends mongoose.Document> {
  create?: { [key: string]: string[] };
  delete?: { [key: string]: boolean };
  find?: { [key: string]: mongoose.FilterQuery<TDocument> };
  populate?: IPopulate<TDocument>[];
  read?: { [key: string]: string[] };
  roles?: { [key: string]: mongoose.FilterQuery<TDocument> };
  update?: { [key: string]: string[] };
}

export interface IPopulate<TDocument extends mongoose.Document> {
  match?: mongoose.FilterQuery<TDocument>;
  path: string;
  populate?: IPopulate<TDocument>[];
}

export interface IReferences<TDocument extends mongoose.Document> {
  apiKey?: string;
  authorization?: IAuthorization;
  now?: Date;
  record?: TDocument;
  user?: IUser;
}

export interface IUser {
  _id?: string;
  username?: string;
}

export type DocumentToObject<TDocument extends mongoose.Document> = Omit<
  TDocument,
  keyof mongoose.Document
> & { _id: mongoose.Types.ObjectId };
