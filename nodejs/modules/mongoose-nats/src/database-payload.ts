export interface DatabasePayload<T> {
  documentKey: any;
  fullDocument?: T;
  ns: Namespace;
  operationType: DatabaseOperationType;
  updateDescription?: UpdateDescription;
}

export interface Namespace {
  coll: string;
  db: string;
}

export interface TruncatedArray {
  field: string;
  newSize: number;
}

export interface UpdateDescription {
  removedFields: string[];
  truncatedArrays?: TruncatedArray[];
  updatedFields: { [key: string]: any };
}

export type DatabaseOperationType = 'delete' | 'insert' | 'replace' | 'update';
