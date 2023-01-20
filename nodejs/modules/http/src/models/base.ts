export abstract class BaseModel {
  public _id: string;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(parameters?: Partial<BaseModel>) {
    Object.assign(this, parameters);

    if (parameters?.createdAt) {
      this.createdAt = new Date(parameters.createdAt);
    }
    if (parameters?.updatedAt) {
      this.updatedAt = new Date(parameters.updatedAt);
    }
  }
}
