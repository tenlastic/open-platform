import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';
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

import { InputDialogComponent } from '../../../../shared/components';

export interface MessageGroup {
  messages: Message[];
  users: User[];
}

@Component({
  styleUrls: ['./layout.component.scss'],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnDestroy, OnInit {
  public connections: Connection[] = [];
  public friends: User[] = [];
  public groups: MessageGroup[] = [];
  public ignorations: User[] = [];
  public isConversationsVisible = true;
  public isFriendsVisible = true;
  public isIgnoredUsersVisible = false;
  public messages: Message[] = [];
  public users: User[] = [];

  private sockets: WebSocket[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private connectionService: ConnectionService,
    private friendService: FriendService,
    private identityService: IdentityService,
    private ignorationService: IgnorationService,
    private matDialog: MatDialog,
    private messageService: MessageService,
    private router: Router,
    private userService: UserService,
    private zone: NgZone,
  ) {}

  public async ngOnInit() {
    this.connections = await this.connectionService.find({
      where: { disconnectedAt: { $exists: false } },
    });

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
    this.watchForConnectionChanges();
    this.watchForMessageChanges();
  }

  public ngOnDestroy() {
    this.sockets.forEach(s => s.close());
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
      const users = await this.userService.find({ where: { username } });

      if (users.length === 0) {
        return;
      }

      this.router.navigate([users[0]._id], { relativeTo: this.activatedRoute });
    });
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
      m.toUserIds.forEach(tui => (userMap[tui] = null));
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

      const toKey = current.toUserIds.join(',');

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

        return { messages: value, users: key.split(',').map(tui => userMap[tui]) };
      })
      .filter(g => g.users[0]._id !== this.identityService.user._id);
  }

  private async subscribeToServices() {
    this.connectionService.onCreate.subscribe(async connection => {
      this.connections.push(connection);
    });
    this.connectionService.onUpdate.subscribe(async connection => {
      const { _id, disconnectedAt } = connection;
      const connectionIndex = this.connections.findIndex(c => c._id === _id);

      if (connectionIndex >= 0 && disconnectedAt) {
        this.connections.splice(connectionIndex, 1);
      } else if (connectionIndex < 0 && !disconnectedAt) {
        this.connections.push(connection);
      }
    });

    this.friendService.onCreate.subscribe(async friend => {
      const user = await this.userService.findOne(friend.toUserId);
      this.friends.push(user);
    });
    this.friendService.onDelete.subscribe(async friend => {
      const index = this.friends.findIndex(f => f._id === friend.toUserId);
      this.friends.splice(index, 1);
    });

    this.ignorationService.onCreate.subscribe(async ignoration => {
      const user = await this.userService.findOne(ignoration.toUserId);
      this.ignorations.push(user);
    });
    this.ignorationService.onDelete.subscribe(async ignoration => {
      const index = this.ignorations.findIndex(f => f._id === ignoration.toUserId);
      this.ignorations.splice(index, 1);
    });

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

          const myNotification = new Notification(user.username, {
            body: message.body,
            requireInteraction: false,
          });
          myNotification.onclick = () => {
            this.router.navigate([user._id], { relativeTo: this.activatedRoute });
          };
        });
      }
    });
  }

  private watchForConnectionChanges() {
    const url = new URL(this.connectionService.basePath.replace('http', 'ws'));
    url.searchParams.append('token', this.identityService.accessToken);
    url.searchParams.append('watch', JSON.stringify({}));

    const socket = new WebSocket(url.href);
    socket.onmessage = msg => {
      const payload = JSON.parse(msg.data);

      if (payload.operationType === 'insert') {
        const connection = new Connection(payload.fullDocument);
        this.connectionService.onCreate.emit(connection);
      } else if (payload.operationType === 'update') {
        const connection = new Connection(payload.fullDocument);
        this.connectionService.onUpdate.emit(connection);
      }
    };

    this.sockets.push(socket);
  }

  private watchForMessageChanges() {
    const url = new URL(this.messageService.basePath.replace('http', 'ws'));
    url.searchParams.append('token', this.identityService.accessToken);
    url.searchParams.append(
      'watch',
      JSON.stringify({ fromUserId: { $ne: this.identityService.user._id } }),
    );

    const socket = new WebSocket(url.href);
    socket.onmessage = msg => {
      const payload = JSON.parse(msg.data);

      if (payload.operationType === 'insert') {
        const message = new Message(payload.fullDocument);
        this.messageService.onCreate.emit(message);
      } else if (payload.operationType === 'update') {
        const message = new Message(payload.fullDocument);
        this.messageService.onUpdate.emit(message);
      }
    };

    this.sockets.push(socket);
  }
}
