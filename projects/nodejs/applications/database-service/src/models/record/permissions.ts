// import { RestPermissions } from '@tenlastic/api-module';
// import { Record, RecordDocument, RecordModel } from './model';

// enum AccessLevel {
//   Other,
// }

// export class RecordPermissions extends RestPermissions<RecordDocument, RecordModel> {
//   constructor() {
//     super();

//     this.Model = Record;
//   }

//   public async createPermissions(user: any): Promise<string[]> {
//     const accessLevel = this.getAccessLevel(null, user);
//     const attributes: string[] = [];

//     switch (accessLevel) {
//       default:
//         return attributes;
//     }
//   }

//   public async findPermissions(user: any): Promise<any> {
//     const accessLevel = this.getAccessLevel(null, user);
//     const query = {};

//     switch (accessLevel) {
//       default:
//         return query;
//     }
//   }

//   public async readPermissions(record: RecordDocument, user: any): Promise<string[]> {
//     const accessLevel = this.getAccessLevel(record, user);
//     const attributes: string[] = ['_id', 'createdAt', 'updatedAt'];

//     switch (accessLevel) {
//       default:
//         return attributes;
//     }
//   }

//   public async removePermissions(record: RecordDocument, user: any): Promise<boolean> {
//     const accessLevel = this.getAccessLevel(record, user);

//     switch (accessLevel) {
//       default:
//         return false;
//     }
//   }

//   public async updatePermissions(record: RecordDocument, user: any): Promise<string[]> {
//     const accessLevel = this.getAccessLevel(record, user);
//     const attributes: string[] = [];

//     switch (accessLevel) {
//       default:
//         return attributes;
//     }
//   }

//   private getAccessLevel(record: RecordDocument, user: any) {
//     return AccessLevel.Other;
//   }
// }
