import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import {
  GroupModel,
  GroupQuery,
  QueueModel,
  QueueMemberModel,
  QueueMemberQuery,
  QueueMemberService,
  QueueQuery,
  QueueService,
  StreamService,
} from '@tenlastic/http';
import { environment } from 'applications/home/src/environments/environment';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { IdentityService } from '../../../../../../core/services';

@Component({
  styleUrls: ['./queues-page.component.scss'],
  templateUrl: 'queues-page.component.html',
})
export class QueuesPageComponent implements OnDestroy, OnInit {
  public $group: Observable<GroupModel>;
  public $queueMembers: Observable<QueueMemberModel[]>;
  public $queues: Observable<QueueModel[]>;
  public updateQueueMembers$ = new Subscription();
  public currentUsers: { [key: string]: number } = {};
  public displayedColumns = ['name', 'description', 'currentUsers', 'actions'];

  private getCurrentUsersInterval: any;
  private subscription: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private groupQuery: GroupQuery,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private queueMemberQuery: QueueMemberQuery,
    private queueMemberService: QueueMemberService,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
    private streamService: StreamService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.$group = this.groupQuery
        .selectAll({ filterBy: (g) => g.userIds.includes(this.identityService.user._id) })
        .pipe(map((groups) => groups[0]));
      this.$queueMembers = this.queueMemberQuery.selectAll({
        filterBy: (qm) => qm.userId === this.identityService.user._id,
      });
      this.$queues = this.queueQuery.selectAll({
        filterBy: (q) =>
          q.namespaceId === params.namespaceId && q.status && q.status.phase === 'Running',
      });

      await this.queueService.find(params.namespaceId, {});

      this.updateQueueMembers$ = this.$group.subscribe((group) => {
        if (!group) {
          return;
        }

        this.$queueMembers = this.queueMemberQuery.selectAll({
          filterBy: (qm) =>
            (group && qm.groupId === group._id) || qm.userId === this.identityService.user._id,
        });

        return this.queueMemberService.find(params.namespaceId, {
          where: {
            $or: [{ groupId: group._id }, { userId: this.identityService.user._id }],
            userId: this.identityService.user._id,
          },
        });
      });

      await this.getCurrentUsers();
      this.getCurrentUsersInterval = setInterval(() => this.getCurrentUsers(), 15000);
    });
  }

  public ngOnDestroy() {
    clearInterval(this.getCurrentUsersInterval);
    this.updateQueueMembers$.unsubscribe();
    this.streamService.unsubscribe(this.subscription, environment.wssUrl);
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

  public $isGroupSmallEnough(queue: QueueModel) {
    return this.$group.pipe(map((group) => group && group.userIds.length <= queue.usersPerTeam));
  }

  public async joinAsGroup(queue: QueueModel) {
    const group = await this.$group.pipe(first()).toPromise();

    try {
      await this.queueMemberService.create(queue.namespaceId, {
        groupId: group._id,
        namespaceId: queue.namespaceId,
        queueId: queue._id,
        userId: this.identityService.user._id,
        webSocketId: this.streamService._ids.get(environment.wssUrl),
      });
    } catch (e) {
      if (e instanceof HttpErrorResponse) {
        if (e.error.errors[0].name === 'QueueMemberAuthorizationError') {
          this.matSnackBar.open(
            'A User in your Group is not authorized to play this StorefrontModel.',
          );
        }

        if (e.error.errors[0].name === 'QueueMemberUniqueError') {
          this.matSnackBar.open('A User in your Group is already queued.');
        }
      }
    }

    await this.getCurrentUsers();
  }

  public async joinAsIndividual(queue: QueueModel) {
    try {
      await this.queueMemberService.create(queue.namespaceId, {
        namespaceId: queue.namespaceId,
        queueId: queue._id,
        userId: this.identityService.user._id,
        webSocketId: this.streamService._ids.get(environment.wssUrl),
      });
    } catch (e) {
      if (e instanceof HttpErrorResponse) {
        if (e.error.errors[0].name === 'QueueMemberAuthorizationError') {
          this.matSnackBar.open('You are not authorized to play this StorefrontModel.');
        }

        if (e.error.errors[0].name === 'QueueMemberUniqueError') {
          this.matSnackBar.open('You are already queued.');
        }
      }
    }

    await this.getCurrentUsers();
  }

  public async leaveQueue(queueMember: QueueMemberModel) {
    await this.queueMemberService.delete(queueMember.namespaceId, queueMember._id);
    await this.getCurrentUsers();
  }

  private async getCurrentUsers() {
    const queues = await this.$queues.pipe(first()).toPromise();

    for (const queue of queues) {
      this.currentUsers[queue._id] = await this.queueMemberService.count(queue.namespaceId, {
        where: { queueId: queue._id },
      });
    }
  }
}
