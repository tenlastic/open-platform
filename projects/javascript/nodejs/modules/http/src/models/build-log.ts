import { BaseModel } from './base';

export interface BuildLogModel extends BaseModel {
  body: string;
  buildId: string;
  nodeId: string;
  unix: number;
}
