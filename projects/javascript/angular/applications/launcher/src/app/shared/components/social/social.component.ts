import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';
import { ElectronService } from '@tenlastic/ng-electron';
import {
  Connection,
  ConnectionService,
  FriendService,
  IgnorationService,
  Message,
  MessageService,
  User,
  UserService,
} from '@tenlastic/ng-http';
import { Subscription } from 'rxjs';

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
  public connections: Connection[] = [];
  public friends: User[] = [];
  public groups: MessageGroup[] = [];
  public ignorations: User[] = [];
  public isConversationsVisible = true;
  public isFriendsVisible = true;
  public isIgnoredUsersVisible = false;
  public messages: Message[] = [];
  public users: User[] = [];

  private subscriptions: Subscription[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private connectionService: ConnectionService,
    private electronService: ElectronService,
    private friendService: FriendService,
    public identityService: IdentityService,
    private ignorationService: IgnorationService,
    private matDialog: MatDialog,
    private messageService: MessageService,
    public messageState: MessageState,
    private router: Router,
    public socialService: SocialService,
    private userService: UserService,
    private zone: NgZone,
  ) {}

  public async ngOnInit() {
    this.connections = await this.connectionService.find({});

    const friends = await this.friendService.find({});
    const ignorations = await this.ignorationService.find({});

    this.users = await this.userService.find({
      where: {
        _id: {
          $in: [...friends.map(f => f.toUserId), ...ignorations.map(i => i.toUserId)],
        },
      },
    });

    this.friends = friends.map(f => this.users.find(u => u._id === f.toUserId));
    this.ignorations = ignorations.map(i => this.users.find(u => u._id === i.toUserId));

    this.getMessages();
    this.subscribeToServices();
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  public addFriend() {
    const dialogRef = this.matDialog.open(InputDialogComponent, {
      data: {
        autocomplete: (value: string) => this.autocomplete(value),
        error: 'Enter a valid username.',
        label: 'Username',
        title: 'Add Friend',
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

      try {
        await this.friendService.create({
          fromUserId: this.identityService.user._id,
          toUserId: users[0]._id,
        });
      } catch {}
    });
  }

  public addIgnoredUser() {
    const dialogRef = this.matDialog.open(InputDialogComponent, {
      data: {
        autocomplete: (value: string) => this.autocomplete(value),
        error: 'Enter a valid username.',
        label: 'Username',
        title: 'Add Ignored User',
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

      try {
        await this.ignorationService.create({
          fromUserId: this.identityService.user._id,
          toUserId: users[0]._id,
        });
      } catch {}
    });
  }

  public getConnection(userId: string) {
    return this.connections.find(c => c.userId === userId);
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

  private async getMessages() {
    const messages = await this.messageService.find({ sort: '-createdAt' });

    const userMap: { [key: string]: User } = {};
    messages.forEach(m => {
      userMap[m.fromUserId] = null;
      userMap[m.toUserId] = null;
    });

    const users = await this.userService.find({ where: { _id: { $in: Object.keys(userMap) } } });
    users.forEach(u => (userMap[u._id] = u));

    const groupMap = messages.reduce((previous, current) => {
      const fromKey = current.fromUserId;

      if (previous[fromKey]) {
        previous[fromKey].push(current);
      } else {
        previous[fromKey] = [current];
      }

      const toKey = current.toUserId;

      if (previous[toKey]) {
        previous[toKey].push(current);
      } else {
        previous[toKey] = [current];
      }

      return previous;
    }, {});

    this.groups = Object.keys(groupMap)
      .map(key => {
        const value = groupMap[key];

        return { messages: value, user: userMap[key] };
      })
      .filter(g => g.user._id !== this.identityService.user._id);
  }

  private async subscribeToServices() {
    this.subscriptions.push(
      this.connectionService.onCreate.subscribe(async connection => {
        this.connections.push(connection);
      }),
    );
    this.subscriptions.push(
      this.connectionService.onDelete.subscribe(async connection => {
        const { _id } = connection;
        const connectionIndex = this.connections.findIndex(c => c._id === _id);

        if (connectionIndex >= 0) {
          this.connections.splice(connectionIndex, 1);
        }
      }),
    );

    this.subscriptions.push(
      this.friendService.onCreate.subscribe(async friend => {
        const user = await this.userService.findOne(friend.toUserId);
        this.friends.push(user);
      }),
    );
    this.subscriptions.push(
      this.friendService.onDelete.subscribe(async friend => {
        const index = this.friends.findIndex(f => f._id === friend.toUserId);
        this.friends.splice(index, 1);
      }),
    );

    this.subscriptions.push(
      this.ignorationService.onCreate.subscribe(async ignoration => {
        const user = await this.userService.findOne(ignoration.toUserId);
        this.ignorations.push(user);
      }),
    );
    this.subscriptions.push(
      this.ignorationService.onDelete.subscribe(async ignoration => {
        const index = this.ignorations.findIndex(f => f._id === ignoration.toUserId);
        this.ignorations.splice(index, 1);
      }),
    );

    this.subscriptions.push(
      this.messageService.onCreate.subscribe(async message => {
        this.messages.push(message);

        if (message.fromUserId !== this.identityService.user._id) {
          const user = this.users.find(u => u._id === message.fromUserId);

          this.zone.run(async () => {
            if (Notification.permission !== 'denied') {
              await new Promise(resolve => {
                Notification.requestPermission(resolve);
              });
            }

            const myNotification = new Notification('Tenlastic', {
              body: `New message from ${user.username}.`,
              requireInteraction: false,
            });
            myNotification.onclick = () => {
              this.router.navigate([user._id], { relativeTo: this.activatedRoute });

              if (this.electronService.isElectron) {
                this.electronService.remote.getCurrentWindow().show();
              }
            };
          });
        }
      }),
    );
  }
}
