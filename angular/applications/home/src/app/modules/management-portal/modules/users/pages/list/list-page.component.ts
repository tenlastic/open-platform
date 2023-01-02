import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
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
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<UserModel>;

  public $users: Observable<UserModel[]>;
  public dataSource = new MatTableDataSource<UserModel>();
  public displayedColumns = ['webSocket', 'username', 'email', 'createdAt', 'updatedAt', 'actions'];
  public hasWriteAuthorization: boolean;
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

  public ngOnInit() {
    const roles = [IAuthorization.Role.NamespacesWrite];
    const userId = this.identityService.user?._id;
    this.hasWriteAuthorization = this.authorizationQuery.hasRoles(null, roles, userId);

    this.fetchUsers();
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

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
