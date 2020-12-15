import { Model } from './model';
import { Pipeline } from './pipeline';

export class PipelineTemplate extends Model {
  public _id: string;
  public createdAt: Date;
  public namespaceId: string;
  public pipelineTemplate: Partial<Pipeline>;
  public updatedAt: Date;

  constructor(params: Partial<PipelineTemplate> = {}) {
    super(params);
  }
}
