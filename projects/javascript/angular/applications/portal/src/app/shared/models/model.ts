export abstract class Model {
  public _id: string;
  public createdAt: Date;
  public updatedAt: Date;

  constructor(params?: Partial<Model>) {
    params = params || {};

    Object.keys(params).forEach(key => {
      this[key] = params[key];
    });

    this.createdAt = new Date(params.createdAt);
    this.updatedAt = new Date(params.updatedAt);
  }
}
