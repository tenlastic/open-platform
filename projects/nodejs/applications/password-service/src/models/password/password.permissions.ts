import { RestPermissions } from '@tenlastic/api-module';
import { Password, PasswordDocument, PasswordModel } from './password.model';

enum AccessLevel {
  Other,
}

export class PasswordPermissions extends RestPermissions<PasswordDocument, PasswordModel> {
  constructor() {
    super();

    this.Model = Password;
  }

  public async createPermissions(password: any): Promise<string[]> {
    const accessLevel = this.getAccessLevel(null, password);
    const attributes: string[] = [];

    switch (accessLevel) {
      default:
        return attributes;
    }
  }

  public async findPermissions(password: any): Promise<any> {
    const accessLevel = this.getAccessLevel(null, password);
    const query = {};

    switch (accessLevel) {
      default:
        return query;
    }
  }

  public async readPermissions(record: PasswordDocument, password: any): Promise<string[]> {
    const accessLevel = this.getAccessLevel(record, password);
    const attributes: string[] = ['_id', 'createdAt', 'updatedAt'];

    switch (accessLevel) {
      default:
        return attributes;
    }
  }

  public async removePermissions(record: PasswordDocument, password: any): Promise<boolean> {
    const accessLevel = this.getAccessLevel(record, password);

    switch (accessLevel) {
      default:
        return false;
    }
  }

  public async updatePermissions(record: PasswordDocument, password: any): Promise<string[]> {
    const accessLevel = this.getAccessLevel(record, password);
    const attributes: string[] = [];

    switch (accessLevel) {
      default:
        return attributes;
    }
  }

  private getAccessLevel(record: PasswordDocument, password: any) {
    return AccessLevel.Other;
  }
}
