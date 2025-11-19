import { Component, Input, OnInit } from '@angular/core';
import {
  GroupInvitationModel,
  GroupInvitationService,
  GroupService,
  UserService,
  UserState,
} from '@tenlastic/http';

@Component({
  selector: 'app-group-invitation-button',
  standalone: false,
  styleUrls: ['./group-invitation-button.component.scss'],
  templateUrl: './group-invitation-button.component.html',
})
export class GroupInvitationButtonComponent implements OnInit {
  @Input() public groupInvitation: GroupInvitationModel;

  constructor(
    private groupInvitationService: GroupInvitationService,
    private groupService: GroupService,
    private userState: UserState,
    private userService: UserService,
  ) {}

  public async ngOnInit() {
    if (!this.userState.hasOne(this.groupInvitation.fromUserId)) {
      await this.userService.find({ where: { _id: this.groupInvitation.fromUserId } });
    }
  }

  public async accept() {
    await this.groupService.join(this.groupInvitation.namespaceId, this.groupInvitation.groupId);
  }

  public async decline() {
    await this.groupInvitationService.delete(
      this.groupInvitation.namespaceId,
      this.groupInvitation._id,
    );
  }

  public getUser(_id: string) {
    return this.userState.getOne(_id);
  }
}
