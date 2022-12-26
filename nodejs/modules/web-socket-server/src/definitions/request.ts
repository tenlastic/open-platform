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

export interface Request {
  _id: string;
  body: { [s: string]: any };
  headers: Headers;
  method: Method;
  params?: { [s: string]: string };
  path: string;
}
