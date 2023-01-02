export abstract class BaseModel {
  public _id: string;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(parameters?: Partial<BaseModel>) {
    Object.assign(this, parameters);

    this.createdAt = parameters?.createdAt ? new Date(parameters.createdAt) : null;
    this.updatedAt = parameters?.updatedAt ? new Date(parameters.updatedAt) : null;
  }
}
