import { isJsonValid } from '../is-json-valid';

export interface IOptions {
  create?: { [key: string]: string[] };
  delete?: { [key: string]: boolean };
  find?: { [key: string]: any };
  populate?: IPopulate[];
  read?: { [key: string]: string[] };
  roles?: IRole[];
  update?: { [key: string]: string[] };
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
    const roles = this.options.delete || {};

    if (role in roles) {
      return roles[role];
    }

    return roles.default || false;
  }

  /**
   * Returns the base find query for a user.
   */
  public async find(user: any) {
    if (!this.options.find) {
      return null;
    }

    const role = this.getRole(null, user);
    const roles = this.options.find;
    const roleAttributes = roles ? roles[role] : undefined;

    if (roleAttributes === null || (roleAttributes === undefined && !roles.default)) {
      return null;
    }

    return roleAttributes || roles.default || {};
  }

  /**
   * Returns the fields the user has permission to access.
   * @param key The key within the permissions configuration.
   * @param record The record being accessed.
   * @param user The user accessing the record.
   */
  public getFieldPermissions(key: 'create' | 'read' | 'update', record: any, user: any) {
    const roles = this.options[key];

    if (!roles) {
      return [];
    }

    const role = this.getRole(record, user);
    const roleAttributes = roles ? roles[role] : undefined;

    return roleAttributes || roles.default || [];
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
      record: record ? this.toPlainObject(record) : null,
      user: typeof user !== 'string' && user ? this.toPlainObject(user) : null,
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

  /**
   * Primarily used to convert all ObjectId instances to regular strings.
   */
  private toPlainObject(obj: any) {
    const json = obj && obj.toJSON ? obj.toJSON({ virtuals: true }) : obj;
    return JSON.parse(JSON.stringify(json));
  }
}
