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
  Ignoration,
  IgnorationQuery,
  IgnorationService,
  Message,
  MessageQuery,
  MessageService,
  User,
  UserQuery,
  UserService,
} from '@tenlastic/ng-http';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { first } from 'rxjs/operators';

import { SocialService } from '../../../core/services';
import { MessageState } from '../../../core/states';
import { InputDialogComponent } from '../input-dialog/input-dialog.component';

export interface MessageGroup {
  messages: Message[];
  user: User;
}

@Component({
  selector: 'app-social',
  styleUrls: ['./social.component.scss'],
  templateUrl: './social.component.html',
})
export class SocialComponent implements OnDestroy, OnInit {
  public $connections: Observable<Connection[]>;
  public $friends: Observable<Friend[]>;
  public $ignorations: Observable<Ignoration[]>;
  public $messages: Observable<Message[]>;
  public $users: Observable<User[]>;
  public fetchFriendUser$ = new Subscription();
  public fetchIgnorationUser$ = new Subscription();
  public fetchMessageUser$ = new Subscription();
  public newMessageNotification$ = new Subscription();
  public updateGroups$ = new Subscription();
  public groups: MessageGroup[] = [];
  public isConversationsVisible = true;
  public isFriendsVisible = true;
  public isIgnoredUsersVisible = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private connectionQuery: ConnectionQuery,
    private connectionService: ConnectionService,
    private electronService: ElectronService,
    private friendQuery: FriendQuery,
    private friendService: FriendService,
    public identityService: IdentityService,
    private ignorationQuery: IgnorationQuery,
    private ignorationService: IgnorationService,
    private matDialog: MatDialog,
    private messageQuery: MessageQuery,
    private messageService: MessageService,
    public messageState: MessageState,
    private router: Router,
    public socialService: SocialService,
    private userQuery: UserQuery,
    private userService: UserService,
    private zone: NgZone,
  ) {}

  public async ngOnInit() {
    this.$connections = this.connectionQuery.selectAll();
    this.$friends = this.friendQuery.selectAll();
    this.$friends = this.friendQuery.populateUsers(this.$friends);
    this.$ignorations = this.ignorationQuery.selectAll();
    this.$ignorations = this.ignorationQuery.populateUsers(this.$ignorations);
    this.$messages = this.messageQuery.selectAll();
    this.$users = this.userQuery.selectAll();

    await Promise.all([
      this.connectionService.find({}),
      this.friendService.find({}),
      this.ignorationService.find({}),
      this.messageService.find({}),
      this.userService.find({}),
    ]);

    this.fetchFriendUser$ = this.$friends.subscribe(friends =>
      this.userService.find({ where: { _id: { $in: friends.map(f => f.toUserId) } } }),
    );
    this.fetchIgnorationUser$ = this.$ignorations.subscribe(ignorations =>
      this.userService.find({ where: { _id: { $in: ignorations.map(i => i.toUserId) } } }),
    );
    this.fetchMessageUser$ = this.$messages.subscribe(messages =>
      this.userService.find({ where: { _id: { $in: messages.map(m => m.toUserId) } } }),
    );

    this.updateGroups$ = combineLatest([this.$friends, this.$messages, this.$users]).subscribe(
      ([friends, messages, users]) => {
        const friendIds = friends.map(f => f.toUserId);

        const groupsMap = messages.reduce((previous, current) => {
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

        this.groups = Object.keys(groupsMap).map(key => ({
          messages: groupsMap[key],
          user: users.find(u => u._id === key),
        }));
      },
    );

    this.newMessageNotification$ = this.messageService.onCreate.subscribe(message =>
      this.newMessageNotification(message),
    );
  }

  public ngOnDestroy() {
    this.fetchFriendUser$.unsubscribe();
    this.fetchIgnorationUser$.unsubscribe();
    this.fetchMessageUser$.unsubscribe();
    this.newMessageNotification$.unsubscribe();
    this.updateGroups$.unsubscribe();
  }

  public $getConnection(userId: string) {
    return this.connectionQuery.selectCount(c => c.userId === userId);
  }

  public $getUnreadMessagesCount(userId: string) {
    return this.messageQuery.selectCount(m => !m.readAt && m.fromUserId === userId);
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

      this.socialService.user = users[0];
    });
  }

  public setUser(user: User) {
    this.socialService.user = user;
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
