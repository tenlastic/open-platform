import { Component, OnDestroy, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  FriendModel,
  FriendQuery,
  FriendService,
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
  QueueMemberQuery,
  UserModel,
  UserQuery,
  UserService,
  UserStore,
  WebSocketService,
  MatchQuery,
  MatchService,
  MatchInvitationService,
} from '@tenlastic/http';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { ElectronService, IdentityService } from '../../../core/services';
import { InputDialogComponent } from '../input-dialog/input-dialog.component';

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
  public $group: Observable<GroupModel>;
  public $groupInvitations: Observable<GroupInvitationModel[]>;
  public get $groupUsersWithoutCurrentUser() {
    return this.$group.pipe(
      map((group) => group?.userIds.filter((ui) => ui !== this.identityService.user._id)),
    );
  }
  public $ignorations: Observable<IgnorationModel[]>;
  public $messages: Observable<MessageModel[]>;
  public $otherConversations: Observable<string[]>;
  public get isElectron() {
    return this.electronService.isElectron;
  }
  public get isLoggedIn() {
    return this.identityService.user;
  }

  private onMessageServiceCreate = this.newMessageNotification.bind(this);

  constructor(
    private electronService: ElectronService,
    private friendQuery: FriendQuery,
    private friendService: FriendService,
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
    private userQuery: UserQuery,
    private userService: UserService,
    private userStore: UserStore,
    private webSocketService: WebSocketService,
  ) {}

  public ngOnInit() {
    if (!this.identityService.user) {
      return;
    }

    const userId = this.identityService.user._id;

    this.$friends = this.friendQuery.selectAll();
    this.$group = this.groupQuery
      .selectAll({ filterBy: (g) => g.userIds.includes(userId) })
      .pipe(map((groups) => groups[0]));
    this.$groupInvitations = this.groupInvitationQuery.selectAll({
      filterBy: (gi) => gi.expiresAt.getTime() > Date.now() && gi.toUserId === userId,
      sortBy: 'createdAt',
    });
    this.$ignorations = this.ignorationQuery.selectAll();
    this.$messages = this.messageQuery.selectAll();

    this.$otherConversations = combineLatest([this.$friends, this.$messages]).pipe(
      map(([friends, messages]) => {
        const friendIds = friends.map((f) => f.toUserId);

        return messages
          .filter((m) => !m.toGroupId)
          .map((m) => (m.fromUserId === userId ? m.toUserId : m.fromUserId))
          .filter((ui) => !friendIds.includes(ui));
      }),
    );

    this.messageService.emitter.on('create', this.onMessageServiceCreate);

    return Promise.all([
      this.friendService.find({ where: { fromUserId: userId } }),
      this.groupInvitationService.find({ where: { toUserId: userId } }),
      this.groupService.find({ where: { userIds: userId } }),
      this.ignorationService.find({ where: { fromUserId: userId } }),
      this.messageService.find({ sort: '-createdAt' }),
      this.userService.find({}),
      this.webSocketService.find(null, { sort: '-createdAt' }),
    ]);
  }

  public ngOnDestroy() {
    this.messageService.emitter.off('create', this.onMessageServiceCreate);
  }

  public $getUnreadGroupMessagesCount(groupId: string) {
    return this.messageQuery
      .selectAllUnreadInGroup(groupId, this.identityService.user._id)
      .pipe(map((messages) => messages.length));
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
        title: 'New Direct Message',
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

  private newMessageNotification(message: MessageModel) {
    if (message.fromUserId === this.identityService.user._id || !this.isElectron) {
      return;
    }

    const window = this.electronService.remote.getCurrentWindow();
    window.flashFrame(true);
  }
}
