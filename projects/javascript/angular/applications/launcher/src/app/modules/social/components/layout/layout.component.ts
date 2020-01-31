import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';
import {
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
export class LayoutComponent implements OnInit {
  public friends: User[] = [];
  public groups: MessageGroup[] = [];
  public ignorations: User[] = [];
  public isConversationsVisible = true;
  public isFriendsVisible = true;
  public isIgnoredUsersVisible = false;
  public messages: Message[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private friendService: FriendService,
    private identityService: IdentityService,
    private ignorationService: IgnorationService,
    private matDialog: MatDialog,
    private messageService: MessageService,
    private router: Router,
    private userService: UserService,
  ) {}

  public async ngOnInit() {
    const friends = await this.friendService.find({});
    const ignorations = await this.ignorationService.find({});

    const users = await this.userService.find({
      where: {
        _id: {
          $in: [...friends.map(f => f.toUserId), ...ignorations.map(i => i.toUserId)],
        },
      },
    });

    this.friends = friends.map(f => users.find(u => u._id === f.toUserId));
    this.ignorations = ignorations.map(i => users.find(u => u._id === i.toUserId));

    this.getMessages();
    this.subscribeToServices();
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
  }
}
