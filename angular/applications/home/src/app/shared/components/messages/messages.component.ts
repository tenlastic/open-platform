import { Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  FriendModel,
  FriendQuery,
  FriendService,
  GroupInvitationService,
  GroupQuery,
  GroupService,
  IgnorationModel,
  IgnorationQuery,
  IgnorationService,
  MessageModel,
  MessageQuery,
  MessageService,
  UserModel,
  UserQuery,
  UserStore,
  WebSocketModel,
  WebSocketQuery,
} from '@tenlastic/http';
import { Subscription, Observable, combineLatest } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { IdentityService } from '../../../core/services';

@Component({
  selector: 'app-messages',
  styleUrls: ['./messages.component.scss'],
  templateUrl: 'messages.component.html',
})
export class MessagesComponent implements OnChanges, OnDestroy {
  @Input() public user: UserModel;
  @ViewChild('messagesScrollContainer')
  public messagesScrollContainer: ElementRef;

  public get $canInvite() {
    return combineLatest([this.$currentUserGroup, this.$group]).pipe(
      map(([currentUserGroup, group]) => {
        if (!currentUserGroup || currentUserGroup.userIds.includes(this.user._id) || group) {
          return false;
        }

        return (
          currentUserGroup.open || currentUserGroup.userIds[0] === this.identityService.user._id
        );
      }),
    );
  }
  public get $canKick() {
    return this.$currentUserGroup.pipe(
      map((currentUserGroup) => {
        if (!currentUserGroup || !currentUserGroup.userIds.includes(this.user._id)) {
          return false;
        }

        return currentUserGroup.userIds[0] === this.identityService.user._id;
      }),
    );
  }
  public get $currentUserGroup() {
    return this.groupQuery
      .selectAll({ filterBy: (g) => g.userIds.includes(this.identityService.user._id) })
      .pipe(map((groups) => groups[0]));
  }
  public $friends: Observable<FriendModel[]>;
  public get $group() {
    return this.groupQuery
      .selectAll({ filterBy: (g) => g.userIds.includes(this.user._id) })
      .pipe(map((groups) => groups[0]));
  }
  public $ignorations: Observable<IgnorationModel[]>;
  public $messages: Observable<MessageModel[]>;
  public $showJoinGroupButton: Observable<boolean>;
  public get $webSocket() {
    return this.webSocketQuery.selectCount((ws) => ws.userId === this.user._id);
  }
  public $webSockets: Observable<WebSocketModel[]>;
  public loadingMessage: string;

  private readUnreadMessages$ = new Subscription();
  private scrollToBottom$ = new Subscription();
  private setBackground$ = new Subscription();

  constructor(
    private friendQuery: FriendQuery,
    private friendService: FriendService,
    private groupQuery: GroupQuery,
    private groupService: GroupService,
    private groupInvitationService: GroupInvitationService,
    public identityService: IdentityService,
    private ignorationQuery: IgnorationQuery,
    private ignorationService: IgnorationService,
    private matSnackBar: MatSnackBar,
    private messageQuery: MessageQuery,
    private messageService: MessageService,
    private userQuery: UserQuery,
    private userStore: UserStore,
    private webSocketQuery: WebSocketQuery,
  ) {}

  public async ngOnChanges() {
    return this.setUser();
  }

  public ngOnDestroy() {
    this.readUnreadMessages$.unsubscribe();
    this.scrollToBottom$.unsubscribe();
    this.setBackground$.unsubscribe();
  }

  public async close() {
    this.userStore.removeActive(this.user._id);
  }

  public getUser(_id: string) {
    return this.userQuery.getEntity(_id);
  }

  public async inviteToGroup() {
    const currentUserGroup = await this.$currentUserGroup.pipe(first()).toPromise();

    try {
      await this.groupInvitationService.create({
        fromUserId: this.identityService.user._id,
        groupId: currentUserGroup._id,
        toUserId: this.user._id,
      });
    } catch {}

    this.matSnackBar.open('Group invitation sent.', null, { duration: 3000 });
  }

  public async joinGroup() {
    const group = await this.$group.pipe(first()).toPromise();
    return this.groupService.join(group._id);
  }

  public async kickFromGroup() {
    const currentUserGroup = await this.$currentUserGroup.pipe(first()).toPromise();

    try {
      await this.groupService.kick(currentUserGroup._id, this.user._id);
    } catch {}

    this.matSnackBar.open('User has been kicked from the group.', null, { duration: 3000 });
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
    const [friend] = await this.$friends.pipe(first()).toPromise();

    if (friend) {
      return this.friendService.delete(friend._id);
    } else {
      return this.friendService.create({
        fromUserId: this.identityService.user._id,
        toUserId: this.user._id,
      });
    }
  }

  public async toggleIgnoration() {
    const [ignoration] = await this.$ignorations.pipe(first()).toPromise();

    if (ignoration) {
      return this.ignorationService.delete(ignoration._id);
    } else {
      return this.ignorationService.create({
        fromUserId: this.identityService.user._id,
        toUserId: this.user._id,
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
      filterBy: (f) =>
        f.fromUserId === this.identityService.user._id && f.toUserId === this.user._id,
    });
    this.$ignorations = this.ignorationQuery.selectAll({
      filterBy: (f) =>
        f.fromUserId === this.identityService.user._id && f.toUserId === this.user._id,
    });
    this.$messages = this.messageQuery.selectAllInConversation(
      this.identityService.user._id,
      this.user._id,
    );
    this.$showJoinGroupButton = combineLatest([this.$currentUserGroup, this.$group]).pipe(
      map(([currentUserGroup, group]) => !currentUserGroup && group?.open),
    );

    this.loadingMessage = 'Loading conversation...';
    await this.messageService.find({
      sort: '-createdAt',
      where: {
        $or: [
          { fromUserId: this.user._id, toUserId: this.identityService.user._id },
          { fromUserId: this.identityService.user._id, toUserId: this.user._id },
        ],
      },
    });
    this.loadingMessage = null;

    // Mark unread messages as read.
    this.readUnreadMessages$ = this.messageQuery
      .selectAllUnreadFromUser(this.user._id, this.identityService.user._id)
      .pipe(map((messages) => messages[0]))
      .subscribe((message) => (message ? this.messageService.read(message._id) : null));

    // Scroll to the bottom when new message received.
    this.scrollToBottom$ = this.$messages.subscribe(() =>
      this.messagesScrollContainer
        ? (this.messagesScrollContainer.nativeElement.scrollTop =
            this.messagesScrollContainer.nativeElement.scrollHeight)
        : null,
    );
  }
}
