import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  GroupModel,
  GroupInvitationService,
  GroupService,
  GroupStore,
  MessageModel,
  MessageQuery,
  MessageService,
  UserModel,
  UserQuery,
  UserService,
} from '@tenlastic/http';
import { Subscription, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IdentityService } from '../../../core/services';
import { InputDialogComponent } from '../input-dialog/input-dialog.component';
import { PromptComponent } from '../prompt/prompt.component';

@Component({
  selector: 'app-group-messages',
  styleUrls: ['./group-messages.component.scss'],
  templateUrl: 'group-messages.component.html',
})
export class GroupMessagesComponent implements OnChanges, OnDestroy {
  @Input() public group: GroupModel;
  @ViewChild('messagesScrollContainer') public messagesScrollContainer: ElementRef;

  public $messages: Observable<MessageModel[]>;
  public $users: Observable<UserModel[]>;
  public get canInvite() {
    return this.group.open || this.group.userIds[0] === this.identityService.user._id;
  }
  public get isLeader() {
    return this.group.userIds[0] === this.identityService.user._id;
  }
  public loadingMessage: string;
  public get usernames() {
    return this.group.userIds
      ? this.group.userIds.map((ui) => this.getUser(ui).username).join('\n')
      : null;
  }

  private readUnreadMessages$ = new Subscription();
  private scrollToBottom$ = new Subscription();
  private setBackground$ = new Subscription();
  private setGroup$ = new Subscription();

  constructor(
    private groupInvitationService: GroupInvitationService,
    private groupService: GroupService,
    private groupStore: GroupStore,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private messageQuery: MessageQuery,
    private messageService: MessageService,
    private userQuery: UserQuery,
    private userService: UserService,
  ) {}

  public async ngOnChanges(changes: SimpleChanges) {
    if (
      (changes.group.previousValue && changes.group.previousValue._id) ===
      (changes.group.currentValue && changes.group.currentValue._id)
    ) {
      return;
    }

    return this.setGroup();
  }

  public ngOnDestroy() {
    this.readUnreadMessages$.unsubscribe();
    this.scrollToBottom$.unsubscribe();
    this.setBackground$.unsubscribe();
    this.setGroup$.unsubscribe();
  }

  public close() {
    this.groupStore.removeActive(this.group._id);
  }

  public async deleteGroup() {
    await this.groupService.delete(this.group._id);
  }

  public editGroupName() {
    const dialogRef = this.matDialog.open(InputDialogComponent, {
      data: {
        error: 'Enter a valid name.',
        label: 'Name',
        maxlength: 24,
        title: 'Edit Group Name',
        width: 300,
      },
    });

    dialogRef.afterClosed().subscribe(async (name) => {
      if (name === undefined) {
        return;
      }

      try {
        this.group = await this.groupService.update(this.group._id, { name: name || null });
      } catch (err) {
        const duplicateKeyError = err?.errors.find((e) => e.name === 'DuplicateKeyError');
        if (duplicateKeyError) {
          this.matSnackBar.open('Group name is already taken.');
        }
      }
    });
  }

  public getUser(_id: string) {
    return this.userQuery.getEntity(_id);
  }

  public invite() {
    const dialogRef = this.matDialog.open(InputDialogComponent, {
      data: {
        autocomplete: (value: string) => this.autocomplete(value),
        error: 'Enter a valid username.',
        label: 'Username',
        title: 'Invite User',
        validators: [Validators.required],
        width: 300,
      },
    });

    dialogRef.afterClosed().subscribe(async (username) => {
      if (!username) {
        return;
      }

      const users = await this.userService.find({ where: { username } });
      if (users.length === 0) {
        return;
      }

      await this.groupInvitationService.create({
        fromUserId: this.identityService.user._id,
        groupId: this.group._id,
        toUserId: users[0]._id,
      });
    });
  }

  public async sendMessage($event) {
    $event.preventDefault();

    await this.messageService.create({
      body: $event.target.value,
      fromUserId: this.identityService.user._id,
      toGroupId: this.group._id,
    });

    $event.target.value = '';
  }

  public showDisbandPrompt() {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'accent', label: 'No' },
          { color: 'primary', label: 'Yes' },
        ],
        message: `Are you sure you want to disband this group?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.groupService.delete(this.group._id);
      }
    });
  }

  public async leave() {
    this.groupStore.removeActive(this.group._id);
    return this.groupService.leave(this.group._id);
  }

  public async toggleIsOpen() {
    return this.groupService.update(this.group._id, { open: !this.group.open });
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

    return users.map((u) => ({ label: u.username, value: u.username }));
  }

  private async setGroup() {
    this.readUnreadMessages$.unsubscribe();
    this.scrollToBottom$.unsubscribe();

    if (!this.group) {
      return;
    }

    this.$messages = this.messageQuery.selectAllInGroup(this.group._id);
    this.$users = this.userQuery.selectAll();

    this.loadingMessage = 'Loading conversation...';
    await this.messageService.find({ sort: '-createdAt', where: { toGroupId: this.group._id } });
    this.loadingMessage = null;

    // Mark unread messages as read.
    this.readUnreadMessages$ = this.messageQuery
      .selectAllUnreadInGroup(this.group._id, this.identityService.user._id)
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
