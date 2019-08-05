import { RestPermissions } from '@tenlastic/api-module';

import { Database } from '../database/model';
import { Collection, CollectionDocument, CollectionModel } from './model';

enum AccessLevel {
  Admin,
  Owner,
  Other,
}

export class CollectionPermissions extends RestPermissions<CollectionDocument, CollectionModel> {
  constructor() {
    super();

    this.Model = Collection;
  }

  public async createPermissions(user: any): Promise<string[]> {
    const accessLevel = await this.getAccessLevel(null, user);
    const attributes: string[] = [];

    switch (accessLevel) {
      case AccessLevel.Admin:
        return attributes.concat('databaseId', 'jsonSchema', 'name');

      default:
        return attributes;
    }
  }

  public async findPermissions(user: any): Promise<any> {
    const accessLevel = await this.getAccessLevel(null, user);
    const query = {};

    switch (accessLevel) {
      case AccessLevel.Admin:
        return query;

      default:
        const databases = await Database.find({ userId: user._id })
          .select('_id')
          .lean();

        return Object.assign(query, {
          databaseId: { $in: databases._id },
        });
    }
  }

  public async readPermissions(record: CollectionDocument, user: any): Promise<string[]> {
    const accessLevel = await this.getAccessLevel(record, user);
    const attributes: string[] = ['_id', 'createdAt', 'databaseId', 'jsonSchema', 'name', 'updatedAt'];

    switch (accessLevel) {
      default:
        return attributes;
    }
  }

  public async removePermissions(record: CollectionDocument, user: any): Promise<boolean> {
    const accessLevel = await this.getAccessLevel(record, user);

    switch (accessLevel) {
      case AccessLevel.Admin:
      case AccessLevel.Owner:
        return true;

      default:
        return false;
    }
  }

  public async updatePermissions(record: CollectionDocument, user: any): Promise<string[]> {
    const accessLevel = await this.getAccessLevel(record, user);
    const attributes: string[] = [];

    switch (accessLevel) {
      case AccessLevel.Admin:
      case AccessLevel.Owner:
        return attributes.concat('databaseId', 'jsonSchema', 'name');

      default:
        return attributes;
    }
  }

  private async getAccessLevel(record: CollectionDocument, user: any) {
    if (user.roles.includes('Admin')) {
      return AccessLevel.Admin;
    }

    const database = await this.populate(record, 'databaseId', 'database');
    if (database && database.userId === user._id) {
      return AccessLevel.Owner;
    }

    return AccessLevel.Other;
  }
}
