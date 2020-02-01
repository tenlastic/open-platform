import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  UserService,
} from '@tenlastic/ng-http';

@Component({
  styleUrls: ['./messages-page.component.scss'],
  templateUrl: 'messages-page.component.html',
})
export class MessagesPageComponent implements OnInit {
  @ViewChild('messagesScrollContainer', { static: false })
  public messagesScrollContainer: ElementRef;

  public connections: Connection[] = [];
  public friend: Friend;
  public ignoration: Ignoration;
  public loadingMessage: string;
  public messages: Message[] = [];
  public user: User;

  constructor(
    private activatedRoute: ActivatedRoute,
    private connectionService: ConnectionService,
    private friendService: FriendService,
    public identityService: IdentityService,
    private ignorationService: IgnorationService,
    private messageService: MessageService,
    private userService: UserService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      this.loadingMessage = 'Loading conversation...';

      const _id = params.get('_id');
      if (!_id) {
        return;
      }

      this.connections = await this.connectionService.find({
        where: { disconnectedAt: { $exists: false } },
      });
      this.user = await this.userService.findOne(_id);

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
          $or: [{ fromUserId: _id }, { toUserIds: [_id] }],
        },
      });

      this.loadingMessage = null;
    });

    this.subscribeToServices();
  }

  public getConnection(userId: string) {
    return this.connections.find(c => c.userId === userId);
  }

  public async sendMessage($event) {
    $event.preventDefault();

    await this.messageService.create({
      body: $event.target.value,
      fromUserId: this.identityService.user._id,
      toUserIds: [this.user._id],
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
      this.friend = friend.toUserId === this.user._id ? friend : this.friend;
    });

    this.friendService.onDelete.subscribe(async friend => {
      this.friend = friend.toUserId === this.user._id ? null : this.friend;
    });

    this.ignorationService.onCreate.subscribe(async ignoration => {
      this.ignoration = ignoration.toUserId === this.user._id ? ignoration : this.ignoration;
    });

    this.ignorationService.onDelete.subscribe(async ignoration => {
      this.ignoration = ignoration.toUserId === this.user._id ? null : this.ignoration;
    });

    this.messageService.onCreate.subscribe(async message => {
      if (
        message.fromUserId !== this.identityService.user._id &&
        message.fromUserId !== this.user._id
      ) {
        return;
      }

      if (
        !message.toUserIds.includes(this.identityService.user._id) &&
        !message.toUserIds.includes(this.user._id)
      ) {
        return;
      }

      this.messages.unshift(message);

      try {
        setTimeout(() => {
          this.messagesScrollContainer.nativeElement.scrollTop = this.messagesScrollContainer.nativeElement.scrollHeight;
        }, 10);
      } catch (err) {}
    });
  }
}
