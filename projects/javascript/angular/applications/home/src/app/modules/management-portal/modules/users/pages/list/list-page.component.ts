import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import {
  User,
  UserQuery,
  UserService,
  WebSocket,
  WebSocketQuery,
  WebSocketService,
} from '@tenlastic/ng-http';
import { combineLatest, Observable, Subscription } from 'rxjs';

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
  public displayedColumns: string[] = ['webSocket', 'username', 'email', 'createdAt', 'updatedAt'];
  public webSockets: { [key: string]: WebSocket } = {};

  private fetchWebSockets$ = new Subscription();
  private updateDataSource$ = new Subscription();
  private updateWebSockets$ = new Subscription();

  constructor(
    public identityService: IdentityService,
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

    if (this.identityService.user.roles.includes('users')) {
      this.displayedColumns.push('actions');
    }

    this.fetchUsers();
  }

  public ngOnDestroy() {
    this.fetchWebSockets$.unsubscribe();
    this.updateDataSource$.unsubscribe();
    this.updateWebSockets$.unsubscribe();
  }

  public showDeletePrompt(user: User) {
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

    await this.userService.find({ sort: 'username' });

    this.fetchWebSockets$ = this.$users.subscribe((users) =>
      this.webSocketService.find({ where: { userId: { $in: users.map((u) => u._id) } } }),
    );
    this.updateDataSource$ = this.$users.subscribe((users) => (this.dataSource.data = users));
    this.updateWebSockets$ = this.webSocketQuery.selectAll().subscribe((webSockets) => {
      this.webSockets = {};

      for (const webSocket of webSockets) {
        this.webSockets[webSocket.userId] = webSocket;
      }
    });

    this.dataSource.filterPredicate = (data: User, filter: string) => {
      const regex = new RegExp(filter, 'i');
      const status = this.webSockets[data._id] ? 'Online' : 'Offline';

      return regex.test(data.email) || regex.test(data.username) || regex.test(status);
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
