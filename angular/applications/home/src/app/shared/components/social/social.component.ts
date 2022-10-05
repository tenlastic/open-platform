import { Component, OnDestroy, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  FriendModel,
  FriendQuery,
  FriendService,
  GameServerModel,
  GameServerQuery,
  GameServerService,
  GroupModel,
  GroupInvitationModel,
  GroupInvitationQuery,
  GroupInvitationService,
  GroupQuery,
  GroupService,
  GroupStore,
  IgnorationModel,
  IgnorationQuery,
  IgnorationService,
  MessageModel,
  MessageQuery,
  MessageService,
  QueueMemberModel,
  QueueMemberQuery,
  QueueMemberService,
  UserModel,
  UserQuery,
  UserService,
  UserStore,
  WebSocketService,
  StorefrontQuery,
} from '@tenlastic/http';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { ElectronService, IdentityService, UpdateService } from '../../../core/services';
import { InputDialogComponent } from '../input-dialog/input-dialog.component';
import { MatchPromptComponent } from '../match-prompt/match-prompt.component';

export interface Conversation {
  messages: MessageModel[];
  user: UserModel;
}

@Component({
  selector: 'app-social',
  styleUrls: ['./social.component.scss'],
  templateUrl: './social.component.html',
})
export class SocialComponent implements OnDestroy, OnInit {
  public get $activeGroup() {
    return this.groupQuery.selectActive() as Observable<GroupModel>;
  }
  public get $activeUser() {
    return this.userQuery.selectActive() as Observable<UserModel>;
  }
  public $friends: Observable<FriendModel[]>;
  public $gameServers: Observable<GameServerModel[]>;
  public $group: Observable<GroupModel>;
  public $groupInvitation: Observable<GroupInvitationModel>;
  public get $groupUsersWithoutCurrentUser() {
    return this.$group.pipe(
      map((group) => group && group.userIds.filter((ui) => ui !== this.identityService.user._id)),
    );
  }
  public $ignorations: Observable<IgnorationModel[]>;
  public $messages: Observable<MessageModel[]>;
  public $queueMembers: Observable<QueueMemberModel[]>;
  public $users: Observable<UserModel[]>;
  public fetchFriendUser$ = new Subscription();
  public fetchGroupInvitationUser$ = new Subscription();
  public fetchIgnorationUser$ = new Subscription();
  public fetchMatchesQueues$ = new Subscription();
  public fetchMessageUser$ = new Subscription();
  public fetchQueueMembersQueues$ = new Subscription();
  public fetchUserWebSockets$ = new Subscription();
  public fetchUserGroup$ = new Subscription();
  public updateConversations$ = new Subscription();
  public updateQueueMembers$ = new Subscription();
  public waitForGameServer$ = new Subscription();
  public conversations: Conversation[] = [];
  public isConversationsVisible = true;
  public get isElectron() {
    return this.electronService.isElectron;
  }
  public isFriendsVisible = true;
  public isGroupVisible = true;
  public isIgnoredUsersVisible = false;
  public get isLoggedIn() {
    return this.identityService.user;
  }
  public isWaitingForGameServer = false;

  private onGameServerServiceCreate = this.newMatchNotification.bind(this);
  private onMessageServiceCreate = this.newMessageNotification.bind(this);

  constructor(
    private electronService: ElectronService,
    private friendQuery: FriendQuery,
    private friendService: FriendService,
    private gameServerQuery: GameServerQuery,
    private gameServerService: GameServerService,
    private groupInvitationQuery: GroupInvitationQuery,
    private groupInvitationService: GroupInvitationService,
    private groupService: GroupService,
    private groupStore: GroupStore,
    private groupQuery: GroupQuery,
    private identityService: IdentityService,
    private ignorationQuery: IgnorationQuery,
    private ignorationService: IgnorationService,
    private matDialog: MatDialog,
    private messageQuery: MessageQuery,
    private messageService: MessageService,
    private queueMemberQuery: QueueMemberQuery,
    private queueMemberService: QueueMemberService,
    private storefrontQuery: StorefrontQuery,
    private updateService: UpdateService,
    private userQuery: UserQuery,
    private userService: UserService,
    private userStore: UserStore,
    private webSocketService: WebSocketService,
  ) {}

  public ngOnInit() {
    if (!this.identityService.user) {
      return;
    }

    this.$friends = this.friendQuery.selectAll();
    this.$gameServers = this.gameServerQuery.selectAll({
      filterBy: (g) =>
        g.authorizedUserIds.includes(this.identityService.user._id) && Boolean(g.queueId),
    });
    this.$group = this.groupQuery
      .selectAll({
        filterBy: (g) => g.userIds.includes(this.identityService.user._id),
      })
      .pipe(map((groups) => groups[0]));
    this.$groupInvitation = this.groupInvitationQuery
      .selectAll({
        filterBy: (gi) =>
          gi.expiresAt.getTime() > Date.now() && gi.toUserId === this.identityService.user._id,
        sortBy: 'createdAt',
      })
      .pipe(map((groupInvitations) => groupInvitations[0]));
    this.$ignorations = this.ignorationQuery.selectAll();
    this.$messages = this.messageQuery.selectAll();
    this.$queueMembers = this.queueMemberQuery.selectAll({ filterBy: () => false });
    this.$users = this.userQuery.selectAll();

    this.fetchFriendUser$ = this.$friends.subscribe((friends) => {
      const missingUserIds = friends
        .map((f) => f.toUserId)
        .filter((toUserId) => !this.userQuery.hasEntity(toUserId));

      return missingUserIds.length > 0
        ? this.userService.find({ where: { _id: { $in: missingUserIds } } })
        : null;
    });
    this.fetchGroupInvitationUser$ = this.$groupInvitation.subscribe((groupInvitation) => {
      if (groupInvitation && !this.userQuery.hasEntity(groupInvitation.fromUserId)) {
        return this.userService.find({ where: { _id: groupInvitation.fromUserId } });
      }
    });
    this.fetchIgnorationUser$ = this.$ignorations.subscribe((ignorations) => {
      const missingUserIds = ignorations
        .map((f) => f.toUserId)
        .filter((toUserId) => !this.userQuery.hasEntity(toUserId));

      return missingUserIds.length > 0
        ? this.userService.find({ where: { _id: { $in: missingUserIds } } })
        : null;
    });
    this.fetchMessageUser$ = this.$messages.subscribe((messages) => {
      const fromUserIds = messages.map((m) => m.fromUserId);
      const toUserIds = messages.map((m) => m.toUserId).filter((toUserId) => toUserId);
      const missingUserIds = fromUserIds
        .concat(toUserIds)
        .filter((toUserId) => !this.userQuery.hasEntity(toUserId));

      return missingUserIds.length > 0
        ? this.userService.find({ where: { _id: { $in: missingUserIds } } })
        : null;
    });

    this.gameServerService.emitter.on('create', this.onGameServerServiceCreate);
    this.messageService.emitter.on('create', this.onMessageServiceCreate);

    this.updateConversations$ = combineLatest([
      this.$friends,
      this.$messages,
      this.$users,
    ]).subscribe(([friends, messages, users]) => {
      const friendIds = friends.map((f) => f.toUserId);

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

      this.conversations = Object.keys(conversationsMap).map((key) => ({
        messages: conversationsMap[key],
        user: users.find((u) => u._id === key),
      }));
    });

    this.updateQueueMembers$ = this.$group.subscribe((group) => {
      this.$queueMembers = this.queueMemberQuery.selectAll({
        filterBy: (qm) =>
          this.electronService.isElectron &&
          ((group && group._id === qm.groupId) || qm.userId === this.identityService.user._id),
      });
    });

    return Promise.all([
      this.friendService.find({}),
      this.groupInvitationService.find({ where: { toUserId: this.identityService.user._id } }),
      this.groupService.find({}),
      this.ignorationService.find({}),
      this.messageService.find({ sort: '-createdAt' }),
      this.userService.find({}),
      this.webSocketService.find({}),
    ]);
  }

  public ngOnDestroy() {
    this.fetchFriendUser$.unsubscribe();
    this.fetchGroupInvitationUser$.unsubscribe();
    this.fetchIgnorationUser$.unsubscribe();
    this.fetchMatchesQueues$.unsubscribe();
    this.fetchMessageUser$.unsubscribe();
    this.fetchQueueMembersQueues$.unsubscribe();
    this.fetchUserWebSockets$.unsubscribe();
    this.fetchUserGroup$.unsubscribe();
    this.updateConversations$.unsubscribe();
    this.updateQueueMembers$.unsubscribe();
    this.waitForGameServer$.unsubscribe();

    this.gameServerService.emitter.off('create', this.onGameServerServiceCreate);
    this.messageService.emitter.off('create', this.onMessageServiceCreate);
  }

  public $getUnreadGroupMessagesCount(groupId: string) {
    return this.messageQuery
      .selectAllUnreadInGroup(groupId, this.identityService.user._id)
      .pipe(map((messages) => messages.length));
  }

  public async acceptGroupInvitation() {
    const groupInvitation = await this.$groupInvitation.pipe(first()).toPromise();
    await this.groupService.join(groupInvitation.groupId);
  }

  public getStorefront(_id: string) {
    return this.storefrontQuery.getEntity(_id);
  }

  public async joinGameServer(gameServer: GameServerModel) {
    this.isWaitingForGameServer = true;

    this.waitForGameServer$ = this.gameServerQuery.selectEntity(gameServer._id).subscribe((gs) => {
      // If the Game Server is not ready yet, do nothing.
      if (!gs.status || gs.status.phase !== 'Running') {
        return;
      }

      // If the Game Server does not have public endpoints yet, do nothing.
      if (!gs.status.endpoints) {
        return;
      }

      this.isWaitingForGameServer = false;
      this.updateService.play(gs.namespaceId, { gameServer: gs });
    });
  }

  public async leaveQueue(queueMember: QueueMemberModel) {
    await this.queueMemberService.delete(queueMember.namespaceId, queueMember._id);
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

    dialogRef.afterClosed().subscribe(async (username) => {
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

  public setGroup(group: GroupModel) {
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

    return users.map((u) => ({ label: u.username, value: u.username }));
  }

  private async newMatchNotification(gameServer: GameServerModel) {
    if (
      !this.electronService.isElectron ||
      !gameServer.queueId ||
      !gameServer.authorizedUserIds.includes(this.identityService.user._id)
    ) {
      return;
    }

    this.matDialog.open(MatchPromptComponent, { autoFocus: false, data: { gameServer } });

    if (this.electronService.isElectron) {
      const window = this.electronService.remote.getCurrentWindow();
      window.flashFrame(true);
      window.show();

      if (!window.isFocused()) {
        window.setAlwaysOnTop(true);
        window.on('focus', () => window.setAlwaysOnTop(false));
      }
    }
  }

  private async newMessageNotification(message: MessageModel) {
    if (message.fromUserId === this.identityService.user._id) {
      return;
    }

    if (this.electronService.isElectron) {
      const window = this.electronService.remote.getCurrentWindow();
      window.flashFrame(true);
    }
  }
}
