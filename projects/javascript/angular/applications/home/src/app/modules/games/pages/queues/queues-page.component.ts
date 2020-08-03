import { Component, OnInit } from '@angular/core';
import { GameQuery, Group, GroupQuery, Queue, QueueQuery, QueueService } from '@tenlastic/ng-http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IdentityService } from '../../../../core/services';

@Component({
  styleUrls: ['./queues-page.component.scss'],
  templateUrl: 'queues-page.component.html',
})
export class QueuesPageComponent implements OnInit {
  public $group: Observable<Group>;
  public $queues: Observable<Queue[]>;
  public displayedColumns = ['name', 'description', 'currentUsers', 'actions'];

  constructor(
    private gameQuery: GameQuery,
    private groupQuery: GroupQuery,
    public identityService: IdentityService,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
  ) {}

  public async ngOnInit() {
    this.$queues = this.queueQuery.selectAll({
      filterBy: gs => gs.gameId === this.gameQuery.getActiveId(),
    });
    this.$group = this.groupQuery
      .selectAll({ filterBy: g => g.userIds.includes(this.identityService.user._id) })
      .pipe(map(groups => groups[0]));

    await this.queueService.find({ where: { gameId: this.gameQuery.getActiveId() } });
  }

  public async joinAsGroup(queueId: string) {}

  public joinAsIndividual(queueId: string) {}
}
