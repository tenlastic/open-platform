import { Component, Input, OnInit } from '@angular/core';
import {
  GroupInvitationModel,
  GroupInvitationService,
  GroupService,
  UserQuery,
  UserService,
} from '@tenlastic/http';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-group-invitation-button',
  styleUrls: ['./group-invitation-button.component.scss'],
  templateUrl: './group-invitation-button.component.html',
})
export class GroupInvitationButtonComponent implements OnInit {
  @Input() public groupInvitation: GroupInvitationModel;

  private get webSocketUrl() {
    return `${environment.wssUrl}/namespaces/${this.groupInvitation.namespaceId}`;
  }

  constructor(
    private groupInvitationService: GroupInvitationService,
    private groupService: GroupService,
    private userQuery: UserQuery,
    private userService: UserService,
  ) {}

  public async ngOnInit() {
    if (!this.userQuery.hasEntity(this.groupInvitation.fromUserId)) {
      await this.userService.find({ where: { _id: this.groupInvitation.fromUserId } });
    }
  }

  public async accept() {
    await this.groupService.addMember(this.groupInvitation.groupId, this.webSocketUrl);
  }

  public getUser(_id: string) {
    return this.userQuery.getEntity(_id);
  }

  public async reject() {
    await this.groupInvitationService.delete(
      this.groupInvitation.namespaceId,
      this.groupInvitation._id,
    );
  }
}
