import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Params } from '@angular/router';
import {
  GroupModel,
  GroupInvitationModel,
  GroupInvitationQuery,
  GroupInvitationService,
  GroupQuery,
  GroupService,
  UserService,
  UserQuery,
  IGroup,
} from '@tenlastic/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../../../../environments/environment';
import { ElectronService, IdentityService } from '../../../../../../core/services';
import { InputDialogComponent } from '../../../../../../shared/components/input-dialog/input-dialog.component';

@Component({
  selector: 'app-social',
  styleUrls: ['./social.component.scss'],
  templateUrl: './social.component.html',
})
export class SocialComponent implements OnInit {
  public $group: Observable<GroupModel>;
  public $groupInvitations: Observable<GroupInvitationModel[]>;
  public get $members() {
    return this.$group.pipe(map((group) => group?.members));
  }
  public get isElectron() {
    return this.electronService.isElectron;
  }
  public get user() {
    return this.identityService.user;
  }

  private get namespaceId() {
    return this.params.namespaceId;
  }
  private params: Params;
  private get webSocketUrl() {
    return `${environment.wssUrl}/namespaces/${this.namespaceId}`;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private electronService: ElectronService,
    private groupInvitationQuery: GroupInvitationQuery,
    private groupInvitationService: GroupInvitationService,
    private groupService: GroupService,
    private groupQuery: GroupQuery,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private userQuery: UserQuery,
    private userService: UserService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      if (!this.identityService.user || !this.namespaceId) {
        return;
      }

      const userId = this.identityService.user._id;

      this.$group = this.groupQuery
        .selectAll({
          filterBy: (g) =>
            g.members?.some((m) => m.userId === userId) && g.namespaceId === this.namespaceId,
        })
        .pipe(map((groups) => groups[0]));
      this.$groupInvitations = this.groupInvitationQuery.selectAll({
        filterBy: (gi) =>
          gi.expiresAt.getTime() > Date.now() &&
          gi.namespaceId === this.namespaceId &&
          gi.toUserId === userId,
        sortBy: 'createdAt',
      });

      return Promise.all([
        this.groupInvitationService.find(this.namespaceId, { where: { toUserId: userId } }),
        this.groupService.find(this.namespaceId, { where: { userIds: userId } }),
        this.userService.find({}),
      ]);
    });
  }

  public getUser(_id: string) {
    return this.userQuery.getEntity(_id);
  }

  public isLeader(group: GroupModel, userId: string) {
    return group.members[0].userId === userId;
  }

  public async createGroup() {
    await this.groupService.create(null, this.webSocketUrl);
  }

  public createGroupInvitation(group: GroupModel) {
    const dialogRef = this.matDialog.open(InputDialogComponent, {
      data: {
        autocomplete: (value: string) => this.autocomplete(value),
        error: 'Enter a valid username.',
        label: 'Username',
        title: 'Invite to Group',
        validators: [Validators.required],
        width: 300,
      },
    });

    dialogRef.afterClosed().subscribe(async (value) => {
      if (!value) {
        return;
      }

      const users = await this.userService.find({
        where: {
          $or: [
            { steamPersonaName: { $regex: `^${value}`, $options: 'i' } },
            { username: { $regex: `^${value}`, $options: 'i' } },
          ],
        },
      });
      if (users.length === 0) {
        return;
      }

      return this.groupInvitationService.create(this.namespaceId, {
        groupId: group._id,
        toUserId: users[0]._id,
      });
    });
  }

  public async deleteGroup(group: GroupModel) {
    await this.groupService.delete(this.namespaceId, group._id);
  }

  public async removeMember(group: GroupModel, member: IGroup.Member) {
    member ||= group.members.find((m) => m.userId === this.user._id);
    await this.groupService.removeMember(this.namespaceId, group._id, member._id);
  }

  private async autocomplete(value: string) {
    if (!value) {
      return [];
    }

    const users = await this.userService.find({
      where: {
        _id: { $ne: this.identityService.user._id },
        $or: [
          { steamPersonaName: { $regex: `^${value}`, $options: 'i' } },
          { username: { $regex: `^${value}`, $options: 'i' } },
        ],
      },
    });

    return users.map((u) => ({ label: u.username, value: u.username }));
  }
}
