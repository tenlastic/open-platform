import { BaseModel } from './base';

export namespace IGroup {
  export interface Member {
    _id: string;
    userId: string;
    webSocketId: string;
  }
}

export class GroupModel extends BaseModel {
  public members: IGroup.Member[];
  public name: string;
  public namespaceId: string;

  constructor(parameters?: Partial<GroupModel>) {
    super(parameters);
  }
}
