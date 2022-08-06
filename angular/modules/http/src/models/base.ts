export abstract class BaseModel {
  public _id: string;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(parameters?: Partial<BaseModel>) {
    Object.assign(this, parameters);

    this.createdAt = this.createdAt ? new Date(this.createdAt) : null;
    this.updatedAt = this.updatedAt ? new Date(this.updatedAt) : null;
  }
}
