import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { Pipeline } from '../models/pipeline';
import { PipelineService } from '../services/pipeline/pipeline.service';

export interface PipelineState extends EntityState<Pipeline> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'pipelines' })
export class PipelineStore extends EntityStore<PipelineState, Pipeline> {
  constructor(private pipelineService: PipelineService) {
    super();

    this.pipelineService.onCreate.subscribe(record => this.add(record));
    this.pipelineService.onDelete.subscribe(record => this.remove(record._id));
    this.pipelineService.onRead.subscribe(records => this.upsertMany(records));
    this.pipelineService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class PipelineQuery extends QueryEntity<PipelineState, Pipeline> {
  constructor(protected store: PipelineStore) {
    super(store);
  }
}
