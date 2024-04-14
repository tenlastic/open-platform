import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import {
  AuthorizationQuery,
  IAuthorization,
  UserModel,
  UserQuery,
  UserService,
  WebSocketModel,
  WebSocketQuery,
  WebSocketService,
} from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class UsersListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }
  @ViewChild(MatSort) set sort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  public $users: Observable<UserModel[]>;
  public dataSource = new MatTableDataSource<UserModel>();
  public displayedColumns = [
    'webSocket',
    'username',
    'email',
    'steam',
    'createdAt',
    'updatedAt',
    'actions',
  ];
  public hasWriteAuthorization: boolean;
  public message: string;
  public get user() {
    return this.identityService.user;
  }
  public webSockets: { [key: string]: WebSocketModel } = {};

  private fetchWebSockets$ = new Subscription();
  private updateDataSource$ = new Subscription();
  private updateWebSockets$ = new Subscription();

  constructor(
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private userQuery: UserQuery,
    private userService: UserService,
    private webSocketQuery: WebSocketQuery,
    private webSocketService: WebSocketService,
  ) {}

  public async ngOnInit() {
    this.message = 'Loading...';

    const roles = [IAuthorization.Role.NamespacesWrite];
    const userId = this.identityService.user?._id;
    this.hasWriteAuthorization = this.authorizationQuery.hasRoles(null, roles, userId);

    await this.fetchUsers();

    this.message = null;
  }

  public ngOnDestroy() {
    this.fetchWebSockets$.unsubscribe();
    this.updateDataSource$.unsubscribe();
    this.updateWebSockets$.unsubscribe();
  }

  public showDeletePrompt($event: Event, user: UserModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this User?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.userService.delete(user._id);
        this.matSnackBar.open('User deleted successfully.');
      }
    });
  }

  private async fetchUsers() {
    this.$users = this.userQuery.selectAll({ sortBy: 'username' });

    this.fetchWebSockets$ = this.$users.subscribe((users) =>
      this.webSocketService.find(null, { where: { userId: { $in: users.map((u) => u._id) } } }),
    );
    this.updateDataSource$ = this.$users.subscribe((users) => (this.dataSource.data = users));
    this.updateWebSockets$ = this.webSocketQuery.selectAll().subscribe((webSockets) => {
      this.webSockets = {};

      for (const webSocket of webSockets) {
        this.webSockets[webSocket.userId] = webSocket;
      }
    });

    const users = await this.userService.find({ sort: 'username' });
    await this.webSocketService.find(null, { where: { userId: { $in: users.map((u) => u._id) } } });

    this.dataSource.filterPredicate = (data: UserModel, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      const status = this.webSockets[data._id] ? 'Online' : 'Offline';

      return regex.test(data.email) || regex.test(data.username) || regex.test(status);
    };
  }
}
