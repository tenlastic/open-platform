import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material';
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
import { Observable, Subscription, combineLatest } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { IdentityService } from '../../../../core/services';

@Component({
  styleUrls: ['./queues-page.component.scss'],
  templateUrl: 'queues-page.component.html',
})
export class QueuesPageComponent implements OnDestroy, OnInit {
  public $group: Observable<Group>;
  public $queueMembers: Observable<QueueMember[]>;
  public $queues: Observable<Queue[]>;
  public updateQueueMembers$ = new Subscription();
  public currentUsers: { [key: string]: number } = {};
  public displayedColumns = ['name', 'description', 'currentUsers', 'actions'];

  private getCurrentUsersInterval: any;

  constructor(
    private gameQuery: GameQuery,
    private groupQuery: GroupQuery,
    public identityService: IdentityService,
    private matSnackBar: MatSnackBar,
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
    this.$queueMembers = this.queueMemberQuery.selectAll({ filterBy: () => false });
    this.$queues = this.queueQuery.selectAll({
      filterBy: gs => gs.namespaceId === game.namespaceId,
    });

    await this.queueService.find({ where: { namespaceId: game.namespaceId } });

    this.updateQueueMembers$ = this.$group.subscribe(group => {
      const $queueMembers = this.queueMemberQuery.selectAll({
        filterBy: qm => qm.groupId === group._id || qm.userId === this.identityService.user._id,
      });
      this.$queueMembers = this.queueMemberQuery.populate($queueMembers);

      return this.queueMemberService.find({
        where: {
          $or: [{ groupId: group._id }, { userId: this.identityService.user._id }],
          userId: this.identityService.user._id,
        },
      });
    });

    await this.getCurrentUsers();
    this.getCurrentUsersInterval = setInterval(() => this.getCurrentUsers(), 15000);
  }

  public ngOnDestroy() {
    clearInterval(this.getCurrentUsersInterval);
    this.updateQueueMembers$.unsubscribe();
  }

  public $getGroupQueueMember(queueId: string) {
    return combineLatest([this.$group, this.$queueMembers]).pipe(
      map(([group, queueMembers]) =>
        queueMembers.find(qm => qm.groupId === group._id && qm.queueId === queueId),
      ),
    );
  }

  public $getSoloQueueMember(queueId: string) {
    return this.$queueMembers.pipe(
      map(queueMembers =>
        queueMembers.find(
          qm => qm.queueId === queueId && qm.userId === this.identityService.user._id,
        ),
      ),
    );
  }

  public $isGroupLeader() {
    return this.$group.pipe(
      map(group => group && group.userIds[0] === this.identityService.user._id),
    );
  }

  public $isGroupSmallEnough(queue: Queue) {
    return this.$group.pipe(map(group => group.userIds.length <= queue.usersPerTeam));
  }

  public async joinAsGroup(queueId: string) {
    const group = await this.$group.pipe(first()).toPromise();

    try {
      await this.queueMemberService.create({ groupId: group._id, queueId });
    } catch (e) {
      if (e instanceof HttpErrorResponse) {
        if (e.error.errors[0].name === 'QueueMemberGameInvitationError') {
          this.matSnackBar.open('A User in your Group is missing a Game Invitation.');
        }

        if (e.error.errors[0].name === 'QueueMemberUniquenessError') {
          this.matSnackBar.open('A User in your Group is already queued.');
        }
      }
    }
  }

  public async joinAsIndividual(queueId: string) {
    await this.queueMemberService.create({ queueId, userId: this.identityService.user._id });
  }

  public async leaveQueue(queueMemberId: string) {
    await this.queueMemberService.delete(queueMemberId);
  }

  private async getCurrentUsers() {
    const queues = await this.$queues.pipe(first()).toPromise();
    const _ids = queues.map(q => q._id);

    for (const _id of _ids) {
      this.currentUsers[_id] = await this.queueMemberService.count({
        where: { queueId: _id },
      });
    }
  }
}
