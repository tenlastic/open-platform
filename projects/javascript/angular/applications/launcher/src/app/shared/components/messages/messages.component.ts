import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IdentityService } from '@tenlastic/ng-authentication';
import {
  Connection,
  ConnectionQuery,
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
} from '@tenlastic/ng-http';
import { Subscription, Observable } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { SocialService } from '../../../core/services';

@Component({
  selector: 'app-messages',
  styleUrls: ['./messages.component.scss'],
  templateUrl: 'messages.component.html',
})
export class MessagesComponent implements OnDestroy, OnInit {
  @ViewChild('messagesScrollContainer', { static: false })
  public messagesScrollContainer: ElementRef;

  public get $connection() {
    return this.connectionQuery.selectCount(c => c.userId === this.user._id);
  }
  public $connections: Observable<Connection[]>;
  public $friends: Observable<Friend[]>;
  public $ignorations: Observable<Ignoration[]>;
  public $messages: Observable<Message[]>;
  public readUnreadMessages$ = new Subscription();
  public scrollToBottom$ = new Subscription();
  public setUser$ = new Subscription();
  public loadingMessage: string;
  public get user() {
    return this.socialService.user;
  }

  constructor(
    private connectionQuery: ConnectionQuery,
    private friendQuery: FriendQuery,
    private friendService: FriendService,
    public identityService: IdentityService,
    private ignorationQuery: IgnorationQuery,
    private ignorationService: IgnorationService,
    private messageQuery: MessageQuery,
    private messageService: MessageService,
    private socialService: SocialService,
  ) {}

  public async ngOnInit() {
    this.setUser();
    this.setUser$ = this.socialService.OnUserSet.subscribe(() => this.setUser());
  }

  public ngOnDestroy() {
    this.readUnreadMessages$.unsubscribe();
    this.scrollToBottom$.unsubscribe();
    this.setUser$.unsubscribe();
  }

  public close() {
    this.socialService.user = null;
  }

  public async sendMessage($event) {
    $event.preventDefault();

    await this.messageService.create({
      body: $event.target.value,
      fromUserId: this.identityService.user._id,
      toUserId: this.socialService.user._id,
    });

    $event.target.value = '';
  }

  public async toggleFriend() {
    const [friend] = await this.$friends.pipe(first()).toPromise();

    if (friend) {
      this.friendService.delete(friend._id);
    } else {
      this.friendService.create({
        fromUserId: this.identityService.user._id,
        toUserId: this.socialService.user._id,
      });
    }
  }

  public async toggleIgnoration() {
    const [ignoration] = await this.$ignorations.pipe(first()).toPromise();

    if (ignoration) {
      this.ignorationService.delete(ignoration._id);
    } else {
      this.ignorationService.create({
        fromUserId: this.identityService.user._id,
        toUserId: this.socialService.user._id,
      });
    }
  }

  private async setUser() {
    this.readUnreadMessages$.unsubscribe();
    this.scrollToBottom$.unsubscribe();

    if (!this.user) {
      return;
    }

    this.$friends = this.friendQuery.selectAll({
      filterBy: f =>
        f.fromUserId === this.identityService.user._id &&
        f.toUserId === this.socialService.user._id,
    });
    this.$ignorations = this.ignorationQuery.selectAll({
      filterBy: f =>
        f.fromUserId === this.identityService.user._id &&
        f.toUserId === this.socialService.user._id,
    });
    this.$messages = this.messageQuery.selectAll({
      filterBy: m =>
        m.fromUserId === this.socialService.user._id || m.toUserId === this.socialService.user._id,
      sortBy: 'createdAt',
    });

    this.loadingMessage = 'Loading conversation...';

    await this.messageService.find({
      where: {
        $or: [
          { fromUserId: this.socialService.user._id },
          { toUserId: this.socialService.user._id },
        ],
      },
    });

    this.loadingMessage = null;

    // Mark unread messages as read.
    this.readUnreadMessages$ = this.messageQuery
      .selectAll({
        filterBy: m =>
          !m.readAt &&
          m.fromUserId === this.socialService.user._id &&
          m.toUserId === this.identityService.user._id,
      })
      .subscribe(ms => {
        for (const m of ms) {
          const message = new Message({ ...m, readAt: new Date() });
          this.messageService.update(message);
        }
      });

    // Scroll to the bottom when new message received.
    this.scrollToBottom$ = this.$messages.subscribe(() => {
      if (!this.messagesScrollContainer) {
        return;
      }

      this.messagesScrollContainer.nativeElement.scrollTop = this.messagesScrollContainer.nativeElement.scrollHeight;
    });
  }
}
