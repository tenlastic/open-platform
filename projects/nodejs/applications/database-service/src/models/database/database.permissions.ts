import { RestPermissions } from '@tenlastic/api-module';
import { Database, DatabaseDocument, DatabaseModel } from './database.model';

enum AccessLevel {
  Admin,
  Other,
}

export class DatabasePermissions extends RestPermissions<DatabaseDocument, DatabaseModel> {
  constructor() {
    super();

    this.Model = Database;
  }

  public async createPermissions(user: any): Promise<string[]> {
    const accessLevel = this.getAccessLevel(null, user);
    const attributes: string[] = [];

    switch (accessLevel) {
      case AccessLevel.Admin:
        return attributes.concat('name', 'userId');

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
          userId: user._id,
        });
    }
  }

  public async readPermissions(record: DatabaseDocument, user: any): Promise<string[]> {
    const accessLevel = this.getAccessLevel(record, user);
    const attributes: string[] = ['_id', 'createdAt', 'name', 'updatedAt', 'userId'];

    switch (accessLevel) {
      default:
        return attributes;
    }
  }

  public async removePermissions(record: DatabaseDocument, user: any): Promise<boolean> {
    const accessLevel = this.getAccessLevel(record, user);

    switch (accessLevel) {
      case AccessLevel.Admin:
        return true;

      default:
        return false;
    }
  }

  public async updatePermissions(record: DatabaseDocument, user: any): Promise<string[]> {
    const accessLevel = this.getAccessLevel(record, user);
    const attributes: string[] = [];

    switch (accessLevel) {
      case AccessLevel.Admin:
        return attributes.concat('name', 'userId');

      default:
        return attributes;
    }
  }

  private getAccessLevel(record: DatabaseDocument, user: any) {
    if (user.roles.includes('Admin')) {
      return AccessLevel.Admin;
    }

    return AccessLevel.Other;
  }
}
