export enum Method {
  Delete = 'DELETE',
  Get = 'GET',
  Patch = 'PATCH',
  Post = 'POST',
  Put = 'PUT',
}

export interface Headers {
  authorization?: string;
}

export interface Request<T = { [key: string]: any }> {
  _id: string;
  body: T;
  headers: Headers;
  method: Method;
  path: string;
}
