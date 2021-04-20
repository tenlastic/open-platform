import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Build } from '../models/build';
import { BuildService } from '../services/build/build.service';
import { GameQuery } from './game';

export interface BuildState extends EntityState<Build> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'builds', resettable: true })
export class BuildStore extends EntityStore<BuildState, Build> {
  constructor(private buildService: BuildService) {
    super([]);

    this.buildService.onCreate.subscribe(record => this.add(record));
    this.buildService.onDelete.subscribe(record => this.remove(record._id));
    this.buildService.onRead.subscribe(records => this.upsertMany(records));
    this.buildService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class BuildQuery extends QueryEntity<BuildState, Build> {
  constructor(protected gameQuery: GameQuery, protected store: BuildStore) {
    super(store);
  }

  public populate($input: Observable<Build[]>) {
    return combineLatest([$input, this.gameQuery.selectAll({ asObject: true })]).pipe(
      map(([builds, games]) => {
        return builds.map(build => {
          return new Build({ ...build, game: games[build.gameId] });
        });
      }),
    );
  }
}
