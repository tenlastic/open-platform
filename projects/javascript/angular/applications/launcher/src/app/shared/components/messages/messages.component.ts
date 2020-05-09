import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IdentityService } from '@tenlastic/ng-authentication';
import {
  Connection,
  ConnectionService,
  Friend,
  FriendService,
  Ignoration,
  IgnorationService,
  Message,
  MessageService,
  User,
} from '@tenlastic/ng-http';
import { Subscription } from 'rxjs';

import { SocialService } from '../../../core/services';

@Component({
  selector: 'app-messages',
  styleUrls: ['./messages.component.scss'],
  templateUrl: 'messages.component.html',
})
export class MessagesComponent implements OnDestroy, OnInit {
  @ViewChild('messagesScrollContainer', { static: false })
  public messagesScrollContainer: ElementRef;

  public connections: Connection[] = [];
  public friend: Friend;
  public ignoration: Ignoration;
  public loadingMessage: string;
  public messages: Message[] = [];
  public user: User;

  private subscriptions: Subscription[] = [];

  constructor(
    private connectionService: ConnectionService,
    private friendService: FriendService,
    public identityService: IdentityService,
    private ignorationService: IgnorationService,
    private messageService: MessageService,
    private socialService: SocialService,
  ) {}

  public async ngOnInit() {
    this.setUser(this.socialService.user);
    this.subscriptions.push(this.socialService.OnUserSet.subscribe(user => this.setUser(user)));

    this.subscribeToServices();
  }

  public ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  public close() {
    this.socialService.user = null;
  }

  public getConnection(userId: string) {
    return this.connections.find(c => c.userId === userId);
  }

  public async sendMessage($event) {
    $event.preventDefault();

    await this.messageService.create({
      body: $event.target.value,
      fromUserId: this.identityService.user._id,
      toUserId: this.user._id,
    });

    $event.target.value = '';
  }

  public async toggleFriend() {
    if (this.friend) {
      await this.friendService.delete(this.friend._id);
      this.friend = null;
    } else {
      this.friend = await this.friendService.create({
        fromUserId: this.identityService.user._id,
        toUserId: this.user._id,
      });
    }
  }

  public async toggleIgnoration() {
    if (this.ignoration) {
      await this.ignorationService.delete(this.ignoration._id);
      this.ignoration = null;
    } else {
      this.ignoration = await this.ignorationService.create({
        fromUserId: this.identityService.user._id,
        toUserId: this.user._id,
      });
    }
  }

  private async setUser(user: User) {
    this.user = user;
    if (!this.user) {
      return;
    }

    this.loadingMessage = 'Loading conversation...';

    this.connections = await this.connectionService.find({});

    const friends = await this.friendService.find({
      where: { fromUserId: this.identityService.user._id, toUserId: this.user._id },
    });
    this.friend = friends[0];

    const ignorations = await this.ignorationService.find({
      where: { fromUserId: this.identityService.user._id, toUserId: this.user._id },
    });
    this.ignoration = ignorations[0];

    this.messages = await this.messageService.find({
      sort: '-createdAt',
      where: {
        $or: [{ fromUserId: this.user._id }, { toUserId: this.user._id }],
      },
    });

    const unreadMessages = this.messages.filter(
      m => !m.readAt && m.toUserId === this.identityService.user._id,
    );
    for (const message of unreadMessages) {
      try {
        message.readAt = new Date();
        await this.messageService.update(message);
      } catch (e) {
        console.error('Error marking message as read:', e);
      }
    }

    this.loadingMessage = null;
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
        this.friend = friend.toUserId === this.user._id ? friend : this.friend;
      }),
    );

    this.subscriptions.push(
      this.friendService.onDelete.subscribe(async friend => {
        this.friend = friend.toUserId === this.user._id ? null : this.friend;
      }),
    );

    this.subscriptions.push(
      this.ignorationService.onCreate.subscribe(async ignoration => {
        this.ignoration = ignoration.toUserId === this.user._id ? ignoration : this.ignoration;
      }),
    );

    this.subscriptions.push(
      this.ignorationService.onDelete.subscribe(async ignoration => {
        this.ignoration = ignoration.toUserId === this.user._id ? null : this.ignoration;
      }),
    );

    this.subscriptions.push(
      this.messageService.onCreate.subscribe(async message => {
        if (
          (message.fromUserId !== this.identityService.user._id &&
            message.fromUserId !== this.user._id) ||
          (message.toUserId !== this.identityService.user._id && message.toUserId !== this.user._id)
        ) {
          return;
        }

        this.messages.unshift(message);

        message.readAt = new Date();
        await this.messageService.update(message);

        try {
          setTimeout(() => {
            this.messagesScrollContainer.nativeElement.scrollTop = this.messagesScrollContainer.nativeElement.scrollHeight;
          }, 10);
        } catch (err) {}
      }),
    );
  }
}
