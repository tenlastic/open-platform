import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Connection,
  ConnectionQuery,
  ConnectionService,
  Friend,
  FriendQuery,
  FriendService,
  Game,
  GameQuery,
  GameServerService,
  Group,
  GroupInvitation,
  GroupInvitationQuery,
  GroupInvitationService,
  GroupQuery,
  GroupService,
  GroupStore,
  Ignoration,
  IgnorationQuery,
  IgnorationService,
  Message,
  MessageQuery,
  MessageService,
  QueueMember,
  QueueMemberQuery,
  QueueMemberService,
  QueueQuery,
  QueueService,
  User,
  UserQuery,
  UserService,
  UserStore,
  GameServer,
} from '@tenlastic/ng-http';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { ElectronService, IdentityService, UpdateService } from '../../../core/services';
import { InputDialogComponent } from '../input-dialog/input-dialog.component';
import { PromptComponent } from '../prompt/prompt.component';

export interface Conversation {
  messages: Message[];
  user: User;
}

@Component({
  selector: 'app-social',
  styleUrls: ['./social.component.scss'],
  templateUrl: './social.component.html',
})
export class SocialComponent implements OnDestroy, OnInit {
  public get $activeGroup() {
    return this.groupQuery.selectActive() as Observable<Group>;
  }
  public get $activeUser() {
    return this.userQuery.selectActive() as Observable<User>;
  }
  public $connections: Observable<Connection[]>;
  public $friends: Observable<Friend[]>;
  public $group: Observable<Group>;
  public $groupInvitation: Observable<GroupInvitation>;
  public get $groupUsersWithoutCurrentUser() {
    return this.$group.pipe(
      map(group => group && group.users.filter(u => u._id !== this.identityService.user._id)),
    );
  }
  public $ignorations: Observable<Ignoration[]>;
  public $messages: Observable<Message[]>;
  public $queueMembers: Observable<QueueMember[]>;
  public $users: Observable<User[]>;
  public fetchFriendUser$ = new Subscription();
  public fetchIgnorationUser$ = new Subscription();
  public fetchMatchesQueues$ = new Subscription();
  public fetchMessageUser$ = new Subscription();
  public fetchQueueMembersQueues$ = new Subscription();
  public fetchUserConnections$ = new Subscription();
  public fetchUserGroup$ = new Subscription();
  public newMatchNotification$ = new Subscription();
  public newMessageNotification$ = new Subscription();
  public updateConversations$ = new Subscription();
  public conversations: Conversation[] = [];
  public isConversationsVisible = true;
  public isFriendsVisible = true;
  public isGroupVisible = true;
  public isIgnoredUsersVisible = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private connectionQuery: ConnectionQuery,
    private connectionService: ConnectionService,
    private electronService: ElectronService,
    private friendQuery: FriendQuery,
    private friendService: FriendService,
    private gameQuery: GameQuery,
    private gameServerService: GameServerService,
    private groupInvitationQuery: GroupInvitationQuery,
    private groupInvitationService: GroupInvitationService,
    private groupService: GroupService,
    private groupStore: GroupStore,
    public groupQuery: GroupQuery,
    public identityService: IdentityService,
    private ignorationQuery: IgnorationQuery,
    private ignorationService: IgnorationService,
    private matDialog: MatDialog,
    private messageQuery: MessageQuery,
    private messageService: MessageService,
    private queueMemberQuery: QueueMemberQuery,
    private queueMemberService: QueueMemberService,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
    private router: Router,
    private updateService: UpdateService,
    public userQuery: UserQuery,
    private userService: UserService,
    private userStore: UserStore,
    private zone: NgZone,
  ) {}

  public async ngOnInit() {
    this.$connections = this.connectionQuery.selectAll();
    this.$friends = this.friendQuery.selectAll();
    this.$friends = this.friendQuery.populateUsers(this.$friends);
    const $groups = this.groupQuery.selectAll({
      filterBy: g => g.userIds.includes(this.identityService.user._id),
    });
    this.$group = this.groupQuery.populate($groups).pipe(map(groups => groups[0]));
    const $groupInvitations = this.groupInvitationQuery.selectAll({
      filterBy: gi => gi.toUserId === this.identityService.user._id,
      sortBy: 'createdAt',
    });
    this.$groupInvitation = this.groupInvitationQuery
      .populate($groupInvitations)
      .pipe(map(groupInvitations => groupInvitations[0]));
    this.$ignorations = this.ignorationQuery.selectAll();
    this.$ignorations = this.ignorationQuery.populateUsers(this.$ignorations);
    this.$messages = this.messageQuery.selectAll();
    const $queueMembers = this.queueMemberQuery.selectAll({
      filterBy: qm => qm.userId === this.identityService.user._id,
    });
    this.$queueMembers = this.queueMemberQuery.populate($queueMembers);
    this.$users = this.userQuery.selectAll();

    await Promise.all([
      this.connectionService.find({}),
      this.friendService.find({}),
      this.groupInvitationService.find({ where: { toUserId: this.identityService.user._id } }),
      this.groupService.find({}),
      this.ignorationService.find({}),
      this.messageService.find({ sort: '-createdAt' }),
      this.queueMemberService.find({}),
      this.userService.find({}),
    ]);

    this.fetchFriendUser$ = this.$friends.subscribe(friends => {
      const missingUserIds = friends
        .map(f => f.toUserId)
        .filter(toUserId => !this.userQuery.hasEntity(toUserId));

      return missingUserIds.length > 0
        ? this.userService.find({ where: { _id: { $in: missingUserIds } } })
        : null;
    });
    this.fetchIgnorationUser$ = this.$ignorations.subscribe(ignorations => {
      const missingUserIds = ignorations
        .map(f => f.toUserId)
        .filter(toUserId => !this.userQuery.hasEntity(toUserId));

      return missingUserIds.length > 0
        ? this.userService.find({ where: { _id: { $in: missingUserIds } } })
        : null;
    });
    this.fetchMessageUser$ = this.$messages.subscribe(messages => {
      const fromUserIds = messages.map(m => m.fromUserId);
      const toUserIds = messages.map(m => m.toUserId).filter(toUserId => toUserId);
      const missingUserIds = fromUserIds
        .concat(toUserIds)
        .filter(toUserId => !this.userQuery.hasEntity(toUserId));

      return missingUserIds.length > 0
        ? this.userService.find({ where: { _id: { $in: missingUserIds } } })
        : null;
    });
    this.fetchQueueMembersQueues$ = this.$queueMembers.subscribe(queueMembers => {
      const missingQueueIds = queueMembers
        .map(qm => qm.queueId)
        .filter(queueId => !this.queueQuery.hasEntity(queueId));

      return missingQueueIds.length > 0
        ? this.queueService.find({ where: { _id: { $in: missingQueueIds } } })
        : null;
    });
    this.fetchUserConnections$ = this.$users.subscribe(users => {
      return this.connectionService.find({ where: { userId: { $in: users.map(u => u._id) } } });
    });
    this.fetchUserGroup$ = this.$users.subscribe(users => {
      return this.groupService.find({ where: { userIds: { $in: users.map(u => u._id) } } });
    });

    this.updateConversations$ = combineLatest([
      this.$friends,
      this.$messages,
      this.$users,
    ]).subscribe(([friends, messages, users]) => {
      const friendIds = friends.map(f => f.toUserId);

      const conversationsMap = messages.reduce((previous, current) => {
        if (current.toGroupId) {
          return previous;
        }

        if (
          current.fromUserId === this.identityService.user._id &&
          current.toUserId === this.identityService.user._id
        ) {
          return previous;
        }

        const userId =
          current.fromUserId === this.identityService.user._id
            ? current.toUserId
            : current.fromUserId;

        if (friendIds.includes(userId)) {
          return previous;
        }

        previous[userId] = previous[userId] || [];
        previous[userId].push(current);

        return previous;
      }, {});

      this.conversations = Object.keys(conversationsMap).map(key => ({
        messages: conversationsMap[key],
        user: users.find(u => u._id === key),
      }));
    });

    this.newMessageNotification$ = this.messageService.onCreate.subscribe(message =>
      this.newMessageNotification(message),
    );

    this.newMatchNotification$ = this.gameServerService.onCreate.subscribe(gameServer =>
      this.newMatchNotification(gameServer),
    );
  }

  public ngOnDestroy() {
    this.fetchFriendUser$.unsubscribe();
    this.fetchIgnorationUser$.unsubscribe();
    this.fetchMatchesQueues$.unsubscribe();
    this.fetchMessageUser$.unsubscribe();
    this.fetchQueueMembersQueues$.unsubscribe();
    this.fetchUserConnections$.unsubscribe();
    this.fetchUserGroup$.unsubscribe();
    this.newMatchNotification$.unsubscribe();
    this.newMessageNotification$.unsubscribe();
    this.updateConversations$.unsubscribe();
  }

  public $getUnreadGroupMessagesCount(groupId: string) {
    return this.messageQuery
      .selectAllUnreadInGroup(groupId, this.identityService.user._id)
      .pipe(map(messages => messages.length));
  }

  public async acceptGroupInvitation() {
    const groupInvitation = await this.$groupInvitation.pipe(first()).toPromise();
    await this.groupService.join(groupInvitation.groupId);
  }

  public async leaveQueue(queueMemberId: string) {
    await this.queueMemberService.delete(queueMemberId);
  }

  public async newGroup() {
    const group = await this.groupService.create({});
    this.setGroup(group);
  }

  public newMessage() {
    const dialogRef = this.matDialog.open(InputDialogComponent, {
      data: {
        autocomplete: (value: string) => this.autocomplete(value),
        error: 'Enter a valid username.',
        label: 'Username',
        title: 'New Message',
        validators: [Validators.required],
        width: 300,
      },
    });

    dialogRef.afterClosed().subscribe(async username => {
      if (!username) {
        return;
      }

      const users = await this.userService.find({ where: { username } });
      if (users.length === 0) {
        return;
      }

      this.userStore.setActive(users[0]._id);
    });
  }

  public async rejectGroupInvitation() {
    const groupInvitation = await this.$groupInvitation.pipe(first()).toPromise();
    await this.groupInvitationService.delete(groupInvitation._id);
  }

  public setGroup(group: Group) {
    this.groupQuery.hasActive()
      ? this.groupStore.removeActive(this.groupQuery.getActiveId())
      : this.groupStore.setActive(group._id);

    if (this.userQuery.hasActive()) {
      this.userStore.removeActive(this.userQuery.getActiveId());
    }
  }

  private async autocomplete(value: string) {
    if (!value) {
      return [];
    }

    const users = await this.userService.find({
      where: {
        _id: { $ne: this.identityService.user._id },
        username: { $regex: `^${value}`, $options: 'i' },
      },
    });

    return users.map(u => ({ label: u.username, value: u.username }));
  }

  private async newMatchNotification(gameServer: GameServer) {
    if (
      !this.electronService.isElectron ||
      !gameServer.queueId ||
      !gameServer.allowedUserIds.includes(this.identityService.user._id)
    ) {
      return;
    }

    const game = new Game(this.gameQuery.getEntity(gameServer.gameId));
    const queue = this.queueQuery.getEntity(gameServer.queueId);

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'accent', label: 'Ignore' },
          { color: 'primary', label: 'Join' },
        ],
        message: `Game: ${game.fullTitle}\nQueue: ${queue.name} - ${queue.description}`,
        title: 'Match Found',
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Join') {
        this.updateService.play(game, { gameServer });
      }
    });

    if (this.electronService.isElectron) {
      this.electronService.remote.getCurrentWindow().show();
    }
  }

  private async newMessageNotification(message: Message) {
    if (message.fromUserId === this.identityService.user._id) {
      return;
    }

    const users = await this.$users.pipe(first()).toPromise();
    const user = users.find(u => u._id === message.fromUserId);

    this.zone.run(async () => {
      if (Notification.permission !== 'denied') {
        await new Promise(resolve => Notification.requestPermission(resolve));
      }

      const notification = new Notification('Tenlastic', {
        body: `New message from ${user.username}.`,
        requireInteraction: false,
      });
      notification.onclick = () => {
        this.router.navigate([user._id], { relativeTo: this.activatedRoute });

        if (this.electronService.isElectron) {
          this.electronService.remote.getCurrentWindow().show();
        }
      };
    });
  }
}
