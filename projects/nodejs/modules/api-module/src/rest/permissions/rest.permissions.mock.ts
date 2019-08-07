import { Rest, RestDocument, RestModel } from './rest.model';
import { RestPermissions } from './rest.permissions';

enum AccessLevel {
  Admin,
  Other,
}

export class RestPermissionsMock extends RestPermissions<RestDocument, RestModel> {
  constructor() {
    super();

    this.Model = Rest;
  }

  public async createPermissions(user: any): Promise<string[]> {
    const accessLevel = this.getAccessLevel(null, user);
    const attributes: string[] = [];

    switch (accessLevel) {
      case AccessLevel.Admin:
        return attributes.concat('name');

      default:
        return attributes;
    }
  }

  public async findPermissions(user: any): Promise<any> {
    const accessLevel = this.getAccessLevel(null, user);
    const query = {};

    switch (accessLevel) {
      case AccessLevel.Admin:
        return query;

      default:
        return Object.assign(query, {
          name: { $ne: null },
        });
    }
  }

  public async readPermissions(record: RestDocument, user: any): Promise<string[]> {
    const accessLevel = this.getAccessLevel(record, user);
    const attributes: string[] = ['_id', 'createdAt', 'updatedAt'];

    switch (accessLevel) {
      case AccessLevel.Admin:
        return attributes.concat('name');

      default:
        return attributes;
    }
  }

  public async removePermissions(record: RestDocument, user: any): Promise<boolean> {
    const accessLevel = this.getAccessLevel(record, user);

    switch (accessLevel) {
      case AccessLevel.Admin:
        return true;

      default:
        return false;
    }
  }

  public async updatePermissions(record: RestDocument, user: any): Promise<string[]> {
    const accessLevel = this.getAccessLevel(record, user);
    const attributes: string[] = [];

    switch (accessLevel) {
      case AccessLevel.Admin:
        return attributes.concat('name');

      default:
        return attributes;
    }
  }

  private getAccessLevel(record: RestDocument, user: any) {
    if (user && user.roles.includes('Admin')) {
      return AccessLevel.Admin;
    }

    return AccessLevel.Other;
  }
}
