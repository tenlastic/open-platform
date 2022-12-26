import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params } from '@angular/router';
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
import { Observable, Subscription, combineLatest } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { environment } from '../../../../../../../environments/environment';
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
  private params: Params;
  private get streamServiceUrl() {
    return `${environment.wssUrl}/namespaces/${this.params.namespaceId}`;
  }
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
      this.params = params;

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
      this.getCurrentUsersInterval = setInterval(() => this.getCurrentUsers(), 5 * 1000);
    });
  }

  public async ngOnDestroy() {
    clearInterval(this.getCurrentUsersInterval);
    this.updateQueueMembers$.unsubscribe();
    await this.streamService.unsubscribe(this.subscription, this.streamServiceUrl);
  }

  public $getGroup(queue: QueueModel) {
    return combineLatest([
      this.$getGroupQueueMember(queue._id),
      this.$getIndividualQueueMember(queue._id),
      this.$group,
      this.$isGroupLeader(),
      this.$isGroupSmallEnough(queue),
    ]).pipe(
      map(([groupQueueMember, individualQueueMember, group, isGroupLeader, isGroupSmallEnough]) => {
        return !groupQueueMember && !individualQueueMember && isGroupLeader && isGroupSmallEnough
          ? group
          : null;
      }),
    );
  }

  public $getGroupQueueMember(queueId: string) {
    return combineLatest([this.$group, this.$queueMembers]).pipe(
      map(([group, queueMembers]) =>
        queueMembers.find((qm) => group && qm.groupId === group._id && qm.queueId === queueId),
      ),
    );
  }

  public $getIndividualQueueMember(queueId: string) {
    return this.$queueMembers.pipe(
      map((queueMembers) =>
        queueMembers.find(
          (qm) =>
            !qm.groupId && qm.queueId === queueId && qm.userId === this.identityService.user._id,
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
    const users = queue.usersPerTeam.reduce((a, b) => a + b, 0);
    return this.$group.pipe(map((g) => g?.userIds.length <= users));
  }

  public async join(group: GroupModel, queue: QueueModel) {
    try {
      await this.queueMemberService.create(queue.namespaceId, {
        groupId: group?._id,
        namespaceId: queue.namespaceId,
        queueId: queue._id,
        userId: this.identityService.user._id,
        webSocketId: this.streamService._ids.get(this.streamServiceUrl),
      });
    } catch (e) {
      if (e instanceof HttpErrorResponse) {
        if (e.error.errors[0].name === 'QueueMemberAuthorizationError') {
          this.matSnackBar.open('A User in your Group is not authorized to play this Storefront.');
        }

        if (e.error.errors[0].name === 'QueueMemberDuplicateKeyError') {
          this.matSnackBar.open(
            group ? 'A User in your Group is already queued.' : 'You are already queued.',
          );
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
