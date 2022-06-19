import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { Record } from '../models/record';
import { RecordService } from '../services/record/record.service';

export interface RecordState extends EntityState<Record> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'records', resettable: true })
export class RecordStore extends EntityStore<RecordState, Record> {
  constructor(private recordService: RecordService) {
    super();

    this.recordService.onCreate.subscribe(record => this.add(record));
    this.recordService.onDelete.subscribe(record => this.remove(record._id));
    this.recordService.onRead.subscribe(records => this.upsertMany(records));
    this.recordService.onUpdate.subscribe(record => this.upsert(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class RecordQuery extends QueryEntity<RecordState, Record> {
  constructor(protected store: RecordStore) {
    super(store);
  }
}
