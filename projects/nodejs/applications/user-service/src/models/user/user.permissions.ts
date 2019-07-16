import { RestPermissions } from '@tenlastic/api-module';
import { User, UserDocument, UserModel } from './user.model';

enum AccessLevel {
  Admin,
  Other,
  Self,
}

export class UserPermissions extends RestPermissions<UserDocument, UserModel> {
  constructor() {
    super();

    this.Model = User;
  }

  public async createPermissions(user: any): Promise<string[]> {
    const accessLevel = this.getAccessLevel(null, user);
    const attributes: string[] = ['email', 'username'];

    switch (accessLevel) {
      case AccessLevel.Admin:
        return attributes.concat('activatedAt', 'level');

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
          activatedAt: { $ne: null },
        });
    }
  }

  public async readPermissions(record: UserDocument, user: any): Promise<string[]> {
    const accessLevel = this.getAccessLevel(record, user);
    const attributes: string[] = ['_id', 'createdAt', 'level', 'username', 'updatedAt'];

    switch (accessLevel) {
      case AccessLevel.Admin:
        return attributes.concat('activatedAt', 'email');

      case AccessLevel.Self:
        return attributes.concat('email');

      default:
        return attributes;
    }
  }

  public async removePermissions(record: UserDocument, user: any): Promise<boolean> {
    const accessLevel = this.getAccessLevel(record, user);

    switch (accessLevel) {
      case AccessLevel.Admin:
      case AccessLevel.Self:
        return true;

      default:
        return false;
    }
  }

  public async updatePermissions(record: UserDocument, user: any): Promise<string[]> {
    const accessLevel = this.getAccessLevel(record, user);
    const attributes: string[] = [];

    switch (accessLevel) {
      case AccessLevel.Admin:
        return attributes.concat('activatedAt', 'email', 'level', 'username');

      case AccessLevel.Self:
        return attributes.concat('email', 'username');

      default:
        return attributes;
    }
  }

  private getAccessLevel(record: UserDocument, user: any) {
    if (user && user.level === 1) {
      return AccessLevel.Admin;
    }

    if (record && user && record._id.equals(user._id)) {
      return AccessLevel.Self;
    }

    return AccessLevel.Other;
  }
}
