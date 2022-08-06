import { Component, Input } from '@angular/core';
import {
  GroupQuery,
  GroupStore,
  MessageQuery,
  UserModel,
  UserQuery,
  UserStore,
  WebSocketQuery,
} from '@tenlastic/ng-http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IdentityService } from '../../../core/services';

@Component({
  selector: 'app-message-group',
  styleUrls: ['./message-group.component.scss'],
  templateUrl: './message-group.component.html',
})
export class MessageGroupComponent {
  @Input() public header: string;
  @Input() public isVisible: boolean;
  @Input() public showGroup = true;
  @Input() public users: UserModel[];
  public get $activeUser() {
    return this.userQuery.selectActive() as Observable<UserModel>;
  }

  constructor(
    private webSocketQuery: WebSocketQuery,
    private groupQuery: GroupQuery,
    private groupStore: GroupStore,
    private identityService: IdentityService,
    private messageQuery: MessageQuery,
    private userQuery: UserQuery,
    private userStore: UserStore,
  ) {}

  public $getWebSocket(userId: string) {
    return this.webSocketQuery
      .selectAll({ filterBy: (ws) => !ws.disconnectedAt && ws.userId === userId })
      .pipe(map((webSockets) => webSockets[0]));
  }

  public $getGroup(userId: string) {
    return this.groupQuery
      .selectAll({ filterBy: (g) => this.showGroup && g.userIds.includes(userId) })
      .pipe(map((groups) => groups[0]));
  }

  public $getUnreadMessagesCount(userId: string) {
    return this.messageQuery
      .selectAllUnreadInConversation(this.identityService.user._id, userId)
      .pipe(map((messages) => messages.length));
  }

  public setUser(user: UserModel) {
    if (this.groupQuery.hasActive()) {
      this.groupStore.removeActive(this.groupQuery.getActiveId());
    }

    this.userQuery.hasActive() && this.userQuery.getActiveId() === user._id
      ? this.userStore.removeActive(this.userQuery.getActiveId())
      : this.userStore.setActive(user._id);
  }
}
