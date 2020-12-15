import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { PipelineTemplate } from '../models/pipeline-template';
import { PipelineTemplateService } from '../services/pipeline-template/pipeline-template.service';

export interface PipelineTemplateState extends EntityState<PipelineTemplate> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'pipeline-templates' })
export class PipelineTemplateStore extends EntityStore<PipelineTemplateState, PipelineTemplate> {
  constructor(private pipelineTemplateService: PipelineTemplateService) {
    super();

    this.pipelineTemplateService.onCreate.subscribe(record => this.add(record));
    this.pipelineTemplateService.onDelete.subscribe(record => this.remove(record._id));
    this.pipelineTemplateService.onRead.subscribe(records => this.upsertMany(records));
    this.pipelineTemplateService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class PipelineTemplateQuery extends QueryEntity<PipelineTemplateState, PipelineTemplate> {
  constructor(protected store: PipelineTemplateStore) {
    super(store);
  }
}
