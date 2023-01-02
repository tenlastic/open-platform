import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import {
  GroupQuery,
  GroupStore,
  MessageQuery,
  MessageService,
  UserModel,
  UserQuery,
  UserService,
  UserStore,
  WebSocketModel,
  WebSocketQuery,
  WebSocketService,
} from '@tenlastic/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IdentityService } from '../../../core/services';

@Component({
  selector: 'app-message-group',
  styleUrls: ['./message-group.component.scss'],
  templateUrl: './message-group.component.html',
})
export class MessageGroupComponent implements OnChanges, OnInit {
  @Input() public header: string;
  @Input() public isVisible: boolean;
  @Input() public showGroup = true;
  @Input() public userIds: string[];

  public get $activeUser() {
    return this.userQuery.selectActive() as Observable<UserModel>;
  }
  public $users: Observable<UserModel[]>;

  constructor(
    private groupQuery: GroupQuery,
    private groupStore: GroupStore,
    private identityService: IdentityService,
    private messageQuery: MessageQuery,
    private messageService: MessageService,
    private userQuery: UserQuery,
    private userService: UserService,
    private userStore: UserStore,
    private webSocketQuery: WebSocketQuery,
    private webSocketService: WebSocketService,
  ) {}

  public async ngOnInit() {
    await this.messageService.find({
      where: {
        fromUserId: { $in: this.userIds },
        'readReceipts.userId': { $ne: this.identityService.user._id },
        toGroupId: { $exists: false },
        toUserId: this.identityService.user._id,
      },
    });
  }

  public async ngOnChanges(changes: SimpleChanges) {
    if (this.isEqual(changes.userIds.currentValue, changes.userIds.previousValue)) {
      return;
    }

    this.$users = this.userQuery.selectAll({ filterBy: (u) => this.userIds.includes(u._id) });

    const missingUserIds = this.userIds.filter((ui) => !this.userQuery.hasEntity(ui));
    if (missingUserIds.length > 0) {
      await this.userService.find({ where: { _id: { $in: missingUserIds } } });
    }

    const missingWebSocketUserIds = this.userIds.filter(
      (ui) => !this.webSocketQuery.hasEntity((ws: WebSocketModel) => ws.userId === ui),
    );
    if (missingWebSocketUserIds.length > 0) {
      await this.webSocketService.find(null, {
        where: { userId: { $in: missingWebSocketUserIds } },
      });
    }
  }

  public $getGroup(userId: string) {
    return this.groupQuery
      .selectAll({ filterBy: (g) => this.showGroup && g.userIds.includes(userId) })
      .pipe(map((groups) => groups[0]));
  }

  public $getUnreadMessages() {
    return this.messageQuery
      .selectAllUnreadFromUsers(this.userIds, this.identityService.user._id)
      .pipe(map((messages) => messages.length));
  }

  public $getUnreadMessagesFromUser(userId: string) {
    return this.messageQuery
      .selectAllUnreadFromUser(userId, this.identityService.user._id)
      .pipe(map((messages) => messages.length));
  }

  public $getWebSocket(userId: string) {
    return this.webSocketQuery
      .selectAll({ filterBy: (ws) => ws.userId === userId })
      .pipe(map((webSockets) => webSockets[0]));
  }

  public setUser(user: UserModel) {
    if (this.groupQuery.hasActive()) {
      this.groupStore.removeActive(this.groupQuery.getActiveId());
    }

    this.userQuery.hasActive() && this.userQuery.getActiveId() === user._id
      ? this.userStore.removeActive(this.userQuery.getActiveId())
      : this.userStore.setActive(user._id);
  }

  private isEqual(first: string[], second: string[]) {
    return first && second ? first.every((f, i) => f === second[i]) : false;
  }
}
