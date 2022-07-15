import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import {
  AuthorizationQuery,
  IAuthorization,
  User,
  UserQuery,
  UserService,
  WebSocket,
  WebSocketQuery,
  WebSocketService,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class UsersListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<User>;

  public $users: Observable<User[]>;
  public dataSource = new MatTableDataSource<User>();
  public displayedColumns = ['webSocket', 'username', 'email', 'createdAt', 'updatedAt', 'actions'];
  public hasWriteAuthorization: boolean;
  public get user() {
    return this.identityService.user;
  }
  public webSockets: { [key: string]: WebSocket } = {};

  private fetchWebSockets$ = new Subscription();
  private updateDataSource$ = new Subscription();
  private updateWebSockets$ = new Subscription();

  constructor(
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private titleService: Title,
    private userQuery: UserQuery,
    private userService: UserService,
    private webSocketQuery: WebSocketQuery,
    private webSocketService: WebSocketService,
  ) {}

  public ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Users`);

    const roles = [IAuthorization.AuthorizationRole.NamespacesReadWrite];
    const userId = this.identityService.user?._id;
    this.hasWriteAuthorization = this.authorizationQuery.hasRoles(null, roles, userId);

    this.fetchUsers();
  }

  public ngOnDestroy() {
    this.fetchWebSockets$.unsubscribe();
    this.updateDataSource$.unsubscribe();
    this.updateWebSockets$.unsubscribe();
  }

  public showDeletePrompt($event: Event, user: User) {
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
    this.$users = this.userQuery.selectAll();

    this.fetchWebSockets$ = this.$users.subscribe((users) =>
      this.webSocketService.find({
        where: {
          disconnectedAt: { $exists: false },
          userId: { $in: users.map((u) => u._id) },
        },
      }),
    );
    this.updateDataSource$ = this.$users.subscribe((users) => (this.dataSource.data = users));
    this.updateWebSockets$ = this.webSocketQuery
      .selectAll({ filterBy: (ws) => !ws.disconnectedAt })
      .subscribe((webSockets) => {
        this.webSockets = {};

        for (const webSocket of webSockets) {
          this.webSockets[webSocket.userId] = webSocket;
        }
      });

    const users = await this.userService.find({ sort: 'username' });
    await this.webSocketService.find({
      where: {
        disconnectedAt: { $exists: false },
        userId: { $in: users.map((u) => u._id) },
      },
    });

    this.dataSource.filterPredicate = (data: User, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      const status = this.webSockets[data._id] ? 'Online' : 'Offline';

      return regex.test(data.email) || regex.test(data.username) || regex.test(status);
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
