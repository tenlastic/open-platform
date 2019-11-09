import { Model } from './model';

export namespace Collection {
  export interface BooleanPermissions {
    base?: boolean;
    roles?: any;
  }

  export interface DynamicPermissions {
    base?: any;
    roles?: any;
  }

  export interface Index {
    key?: any;
    options?: IndexOptions;
  }

  export interface IndexOptions {
    expireAfterSeconds?: number;
    partialFilterExpression?: any;
    unique?: boolean;
  }

  export interface JsonSchemaProperty {
    additionalProperties?: boolean;
    default?: any;
    format?: string;
    items?: JsonSchemaProperty;
    properties?: JsonSchemaProperty;
    required?: string[];
    type?: string;
  }

  export interface Permissions {
    create?: StringPermissions;
    delete?: BooleanPermissions;
    find?: DynamicPermissions;
    populate?: PopulatePermissions[];
    read?: StringPermissions;
    roles?: RolePermissions[];
    update?: StringPermissions;
  }

  export interface PopulatePermissions {
    path?: string;
    populate?: PopulatePermissions;
  }

  export interface RolePermissions {
    name?: string;
    query?: any;
  }

  export interface StringPermissions {
    base?: string[];
    roles?: any;
  }
}

export class Collection extends Model {
  public databaseId: string;
  public indexes: Collection.Index;
  public jsonSchema: Collection.JsonSchemaProperty;
  public name: string;
  public permissions: Collection.Permissions;

  constructor(params?: Partial<Collection>) {
    super(params);
  }
}
