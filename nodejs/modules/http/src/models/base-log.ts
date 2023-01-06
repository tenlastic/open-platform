import { BaseModel } from './base';

export class BaseLogModel extends BaseModel {
  public body: any;
  public container: string;
  public level: string;
  public pod: string;
  public unix: number;

  constructor(parameters?: Partial<BaseLogModel>) {
    super(parameters);
  }
}
