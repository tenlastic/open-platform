import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  Game,
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
import { map, take } from 'rxjs/operators';

import { IdentityService } from '../../../../core/services';

@Component({
  styleUrls: ['./queues-page.component.scss'],
  templateUrl: 'queues-page.component.html',
})
export class QueuesPageComponent implements OnDestroy, OnInit {
  public $group: Observable<Group>;
  public $queueMembers: Observable<QueueMember[]>;
  public $queues: Observable<Queue[]>;
  public currentUsers: { [key: string]: number } = {};
  public displayedColumns = ['name', 'description', 'currentUsers', 'actions'];

  private getCurrentUsersInterval: any;

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
    const game = this.gameQuery.getActive() as Game;

    this.$group = this.groupQuery
      .selectAll({ filterBy: g => g.userIds.includes(this.identityService.user._id) })
      .pipe(map(groups => groups[0]));
    const $queueMembers = this.queueMemberQuery.selectAll({
      filterBy: qm => qm.userId === this.identityService.user._id,
    });
    this.$queueMembers = this.queueMemberQuery.populate($queueMembers);
    this.$queues = this.queueQuery.selectAll({
      filterBy: gs => gs.namespaceId === game.namespaceId,
    });

    await Promise.all([
      this.queueMemberService.find({ where: { userId: this.identityService.user._id } }),
      this.queueService.find({ where: { namespaceId: game.namespaceId } }),
    ]);

    await this.getCurrentUsers();
    this.getCurrentUsersInterval = setInterval(() => this.getCurrentUsers(), 15000);
  }

  public ngOnDestroy() {
    clearInterval(this.getCurrentUsersInterval);
  }

  public $getQueueMember(queueId: string) {
    return this.$queueMembers.pipe(
      map(queueMembers => queueMembers.find(qm => qm.queueId === queueId)),
    );
  }

  public async joinAsGroup(queueId: string) {}

  public async joinAsIndividual(queueId: string) {
    await this.queueMemberService.create({ queueId, userId: this.identityService.user._id });
  }

  public async leaveSolo(queueMemberId: string) {
    await this.queueMemberService.delete(queueMemberId);
  }

  private async getCurrentUsers() {
    const queues = await this.$queues.pipe(take(1)).toPromise();
    const _ids = queues.map(q => q._id);

    for (const _id of _ids) {
      this.currentUsers[_id] = await this.queueMemberService.count({
        where: { queueId: _id },
      });
    }
  }
}
