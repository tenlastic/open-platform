import { BaseModel } from './base';

export namespace ICollection {
  export interface Index {
    keys?: IndexKey[];
    options?: IndexOptions;
  }

  export interface IndexKey {
    direction?: number;
    field?: string;
  }

  export interface IndexOptions {
    expireAfterSeconds?: number;
    partialFilterExpression?: any;
    unique?: boolean;
  }

  export interface JsonSchemaProperty {
    default?: any;
    format?: string;
    items?: JsonSchemaProperty;
    properties?: { [key: string]: JsonSchemaProperty };
    required?: string[];
    type?: string;
  }

  export interface Permissions {
    create?: { [key: string]: string[] };
    delete?: { [key: string]: boolean };
    find?: { [key: string]: any };
    populate?: PopulatePermissions[];
    read?: { [key: string]: string[] };
    roles?: { [key: string]: any };
    update?: { [key: string]: string[] };
  }

  export interface PopulatePermissions {
    path?: string;
    populate?: PopulatePermissions;
  }
}

export class CollectionModel extends BaseModel {
  public indexes: ICollection.Index;
  public jsonSchema: ICollection.JsonSchemaProperty;
  public name: string;
  public namespaceId: string;
  public permissions: ICollection.Permissions;

  constructor(parameters?: Partial<CollectionModel>) {
    super(parameters);
  }
}
