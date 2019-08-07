import { RestPermissions } from '@tenlastic/api-module';
import { Example, ExampleDocument, ExampleModel } from './model';

enum AccessLevel {
  Other,
}

export class ExamplePermissions extends RestPermissions<ExampleDocument, ExampleModel> {
  constructor() {
    super();

    this.Model = Example;
  }

  public async createPermissions(user: any): Promise<string[]> {
    const accessLevel = this.getAccessLevel(null, user);
    const attributes: string[] = [];

    switch (accessLevel) {
      default:
        return attributes;
    }
  }

  public async findPermissions(user: any): Promise<any> {
    const accessLevel = this.getAccessLevel(null, user);
    const query = {};

    switch (accessLevel) {
      default:
        return query;
    }
  }

  public async readPermissions(record: ExampleDocument, user: any): Promise<string[]> {
    const accessLevel = this.getAccessLevel(record, user);
    const attributes: string[] = ['_id', 'createdAt', 'updatedAt'];

    switch (accessLevel) {
      default:
        return attributes;
    }
  }

  public async removePermissions(record: ExampleDocument, user: any): Promise<boolean> {
    const accessLevel = this.getAccessLevel(record, user);

    switch (accessLevel) {
      default:
        return false;
    }
  }

  public async updatePermissions(record: ExampleDocument, user: any): Promise<string[]> {
    const accessLevel = this.getAccessLevel(record, user);
    const attributes: string[] = [];

    switch (accessLevel) {
      default:
        return attributes;
    }
  }

  private getAccessLevel(record: ExampleDocument, user: any) {
    return AccessLevel.Other;
  }
}
