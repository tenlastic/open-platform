import { Component, OnInit } from '@angular/core';
import {
  GameQuery,
  Group,
  GroupQuery,
  Queue,
  QueueMember,
  QueueMemberQuery,
  QueueMemberService,
  QueueQuery,
  QueueService,
} from '@tenlastic/ng-http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IdentityService } from '../../../../core/services';

@Component({
  styleUrls: ['./queues-page.component.scss'],
  templateUrl: 'queues-page.component.html',
})
export class QueuesPageComponent implements OnInit {
  public $group: Observable<Group>;
  public $queueMembers: Observable<QueueMember[]>;
  public $queues: Observable<Queue[]>;
  public displayedColumns = ['name', 'description', 'currentUsers', 'actions'];

  constructor(
    private gameQuery: GameQuery,
    private groupQuery: GroupQuery,
    public identityService: IdentityService,
    private queueMemberQuery: QueueMemberQuery,
    private queueMemberService: QueueMemberService,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
  ) {}

  public async ngOnInit() {
    this.$group = this.groupQuery
      .selectAll({ filterBy: g => g.userIds.includes(this.identityService.user._id) })
      .pipe(map(groups => groups[0]));
    const $queueMembers = this.queueMemberQuery.selectAll({
      filterBy: qm => qm.userId === this.identityService.user._id,
    });
    this.$queueMembers = this.queueMemberQuery.populate($queueMembers);
    this.$queues = this.queueQuery.selectAll({
      filterBy: gs => gs.gameId === this.gameQuery.getActiveId(),
    });

    await Promise.all([
      this.queueMemberService.find({ where: { userId: this.identityService.user._id } }),
      this.queueService.find({ where: { gameId: this.gameQuery.getActiveId() } }),
    ]);
  }

  public $getQueueMember(queueId: string) {
    return this.$queueMembers.pipe(
      map(queueMembers => queueMembers.find(qm => qm.queueId === queueId)),
    );
  }

  public async joinAsGroup(queueId: string) {}

  public async joinSolo(queueId: string) {
    await this.queueMemberService.create({ queueId, userId: this.identityService.user._id });
  }

  public async leaveSolo(queueMemberId: string) {
    await this.queueMemberService.delete(queueMemberId);
  }
}
