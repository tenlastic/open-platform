import { isJsonValid } from '../is-json-valid';

export interface IOptions {
  create?: {
    base?: string[];
    roles?: { [key: string]: string[] };
  };
  delete?: {
    base?: boolean;
    roles?: { [key: string]: boolean };
  };
  find?: {
    base?: any;
    roles?: { [key: string]: any };
  };
  populate?: IPopulate[];
  read?: {
    base?: string[];
    roles?: { [key: string]: string[] };
  };
  roles?: IRole[];
  update?: {
    base?: string[];
    roles?: { [key: string]: string[] };
  };
}

export interface IPopulate {
  path: string;
  populate?: IPopulate | IPopulate[];
}

export interface IRole {
  name: string;
  query: any;
}

export class AccessControl {
  public options: IOptions;

  constructor(options: IOptions) {
    this.options = options;
  }

  /**
   * Returns whether or not a user may delete a record.
   */
  public async delete(record: any, user: any) {
    if (!this.options.delete) {
      return false;
    }

    const role = this.getRole(record, user);
    const roles = this.options.delete.roles || {};

    if (role in roles) {
      return roles[role];
    }

    return this.options.delete.base || false;
  }

  /**
   * Returns the base find query for a user.
   */
  public async find(user: any) {
    if (!this.options.find) {
      return null;
    }

    const query = this.options.find.base;

    const role = this.getRole(null, user);
    const roles = this.options.find.roles;
    const roleAttributes = roles ? roles[role] : undefined;

    if (roleAttributes === null || (roleAttributes === undefined && !query)) {
      return null;
    }

    return roleAttributes || query || {};
  }

  /**
   * Returns the fields the user has permission to access.
   * @param key The key within the permissions configuration.
   * @param record The record being accessed.
   * @param user The user accessing the record.
   */
  public getFieldPermissions(key: 'create' | 'read' | 'update', record: any, user: any) {
    const options = this.options[key];

    if (!options) {
      return [];
    }

    const attributes = options.base || [];

    const role = this.getRole(record, user);
    const roles = options.roles;
    const roleAttributes = roles && roles[role] ? roles[role] : [];

    return attributes.concat(roleAttributes);
  }

  /**
   * Returns the role of the user accessing a record.
   * @param record The record being accessed.
   * @param user The user accessing the record.
   */
  public getRole(record: any, user: any) {
    if (!this.options.roles) {
      return 'default';
    }

    const json = {
      key: typeof user === 'string' ? user : null,
      record: record ? this.toPlainObject(record, { virtuals: true }) : null,
      user: typeof user !== 'string' ? this.toPlainObject(user, { virtuals: true }) : null,
    };

    for (const role of this.options.roles) {
      try {
        if (isJsonValid(json, role.query)) {
          return role.name;
        }
      } catch {}
    }

    return 'default';
  }

  private toPlainObject(obj: any, options: { virtuals?: boolean } = {}) {
    const json = obj && obj.toJSON ? obj.toJSON(options) : obj;
    return JSON.parse(JSON.stringify(json));
  }
}
