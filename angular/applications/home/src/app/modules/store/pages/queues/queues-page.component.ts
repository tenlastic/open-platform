import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Group,
  GroupQuery,
  Queue,
  QueueMember,
  QueueMemberQuery,
  QueueMemberService,
  QueueQuery,
  QueueService,
  Storefront,
  StorefrontQuery,
} from '@tenlastic/ng-http';
import { environment } from 'applications/home/src/environments/environment';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { IdentityService, SocketService } from '../../../../core/services';

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
    private groupQuery: GroupQuery,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private queueMemberQuery: QueueMemberQuery,
    private queueMemberService: QueueMemberService,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
    private socketService: SocketService,
    private storefrontQuery: StorefrontQuery,
  ) {}

  public async ngOnInit() {
    const storefront = this.storefrontQuery.getActive() as Storefront;

    this.$group = this.groupQuery
      .selectAll({ filterBy: (g) => g.userIds.includes(this.identityService.user._id) })
      .pipe(map((groups) => groups[0]));
    this.$queueMembers = this.queueMemberQuery.selectAll({
      filterBy: (qm) => qm.userId === this.identityService.user._id,
    });
    this.$queues = this.queueQuery.selectAll({
      filterBy: (q) =>
        q.namespaceId === storefront.namespaceId && q.status && q.status.phase === 'Running',
    });

    await this.queueService.find({ where: { namespaceId: storefront.namespaceId } });

    this.updateQueueMembers$ = this.$group.subscribe((group) => {
      if (!group) {
        return;
      }

      const $queueMembers = this.queueMemberQuery.selectAll({
        filterBy: (qm) =>
          (group && qm.groupId === group._id) || qm.userId === this.identityService.user._id,
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
        queueMembers.find((qm) => group && qm.groupId === group._id && qm.queueId === queueId),
      ),
    );
  }

  public $getSoloQueueMember(queueId: string) {
    return this.$queueMembers.pipe(
      map((queueMembers) =>
        queueMembers.find(
          (qm) => qm.queueId === queueId && qm.userId === this.identityService.user._id,
        ),
      ),
    );
  }

  public $isGroupLeader() {
    return this.$group.pipe(
      map((group) => group && group.userIds[0] === this.identityService.user._id),
    );
  }

  public $isGroupSmallEnough(queue: Queue) {
    return this.$group.pipe(map((group) => group && group.userIds.length <= queue.usersPerTeam));
  }

  public async joinAsGroup(queue: Queue) {
    const group = await this.$group.pipe(first()).toPromise();
    const socket = await this.socketService.connect(environment.apiBaseUrl);

    try {
      await this.queueMemberService.create({
        groupId: group._id,
        namespaceId: queue.namespaceId,
        queueId: queue._id,
        userId: this.identityService.user._id,
        webSocketId: socket._id,
      });
    } catch (e) {
      if (e instanceof HttpErrorResponse) {
        if (e.error.errors[0].name === 'QueueMemberAuthorizationError') {
          this.matSnackBar.open('A User in your Group is not authorized to play this Storefront.');
        }

        if (e.error.errors[0].name === 'QueueMemberUniqueError') {
          this.matSnackBar.open('A User in your Group is already queued.');
        }
      }
    }

    await this.getCurrentUsers();
  }

  public async joinAsIndividual(queue: Queue) {
    const socket = await this.socketService.connect(environment.apiBaseUrl);

    try {
      await this.queueMemberService.create({
        namespaceId: queue.namespaceId,
        queueId: queue._id,
        userId: this.identityService.user._id,
        webSocketId: socket._id,
      });
    } catch (e) {
      if (e instanceof HttpErrorResponse) {
        if (e.error.errors[0].name === 'QueueMemberAuthorizationError') {
          this.matSnackBar.open('You are not authorized to play this Storefront.');
        }

        if (e.error.errors[0].name === 'QueueMemberUniqueError') {
          this.matSnackBar.open('You are already queued.');
        }
      }
    }

    await this.getCurrentUsers();
  }

  public async leaveQueue(queueMemberId: string) {
    await this.queueMemberService.delete(queueMemberId);
    await this.getCurrentUsers();
  }

  private async getCurrentUsers() {
    const queues = await this.$queues.pipe(first()).toPromise();
    const _ids = queues.map((q) => q._id);

    for (const _id of _ids) {
      this.currentUsers[_id] = await this.queueMemberService.count({
        where: { queueId: _id },
      });
    }
  }
}
