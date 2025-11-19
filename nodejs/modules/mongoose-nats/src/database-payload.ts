export interface DatabasePayload<T> {
  documentKey: unknown;
  fullDocument?: T;
  ns: Namespace;
  operationType: DatabaseOperationType;
  updateDescription?: UpdateDescription<T>;
}

export interface Namespace {
  coll: string;
  db: string;
}

export interface TruncatedArray {
  field: string;
  newSize: number;
}

export interface UpdateDescription<T> {
  removedFields: string[];
  truncatedArrays?: TruncatedArray[];
  updatedFields: Partial<T>;
}

export type DatabaseOperationType = 'delete' | 'insert' | 'replace' | 'update';
