import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';
import { ElectronService } from '@tenlastic/ng-electron';
import {
  Connection,
  ConnectionQuery,
  ConnectionService,
  Friend,
  FriendQuery,
  FriendService,
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
  User,
  UserQuery,
  UserService,
  UserStore,
} from '@tenlastic/ng-http';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { InputDialogComponent } from '../input-dialog/input-dialog.component';

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
  public $ignorations: Observable<Ignoration[]>;
  public $messages: Observable<Message[]>;
  public $users: Observable<User[]>;
  public fetchFriendUser$ = new Subscription();
  public fetchIgnorationUser$ = new Subscription();
  public fetchMessageUser$ = new Subscription();
  public fetchUserGroup$ = new Subscription();
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
    private router: Router,
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
      .pipe(map(groups => groups[0]));
    this.$ignorations = this.ignorationQuery.selectAll();
    this.$ignorations = this.ignorationQuery.populateUsers(this.$ignorations);
    this.$messages = this.messageQuery.selectAll();
    this.$users = this.userQuery.selectAll();

    await Promise.all([
      this.connectionService.find({}),
      this.friendService.find({}),
      this.groupInvitationService.find({ where: { toUserId: this.identityService.user._id } }),
      this.groupService.find({}),
      this.ignorationService.find({}),
      this.messageService.find({ sort: '-createdAt' }),
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
  }

  public ngOnDestroy() {
    this.fetchFriendUser$.unsubscribe();
    this.fetchIgnorationUser$.unsubscribe();
    this.fetchMessageUser$.unsubscribe();
    this.fetchUserGroup$.unsubscribe();
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
