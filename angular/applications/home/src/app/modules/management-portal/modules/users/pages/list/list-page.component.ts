import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import {
  AuthorizationQuery,
  IAuthorization,
  UserModel,
  UserService,
  WebSocketModel,
  WebSocketQuery,
  WebSocketService,
} from '@tenlastic/http';
import { Subject, Subscription } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { debounceTime } from 'rxjs/operators';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class UsersListPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) private paginator: MatPaginator;

  public dataSource = new MatTableDataSource<UserModel>();
  public displayedColumns = [
    'webSocket',
    'email',
    'steam',
    'username',
    'createdAt',
    'updatedAt',
    'actions',
  ];
  public filter: string;
  public hasWriteAuthorization: boolean;
  public message: string;
  public get user() {
    return this.identityService.user;
  }
  public webSockets: { [key: string]: WebSocketModel } = {};

  private filter$ = new Subject();
  private updateWebSockets$ = new Subscription();
  private date = new Date(0);
  private timeout: NodeJS.Timeout;

  constructor(
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private userService: UserService,
    private webSocketQuery: WebSocketQuery,
    private webSocketService: WebSocketService,
  ) {}

  public async ngAfterViewInit() {
    this.filter$.pipe(debounceTime(300)).subscribe(() => this.fetchUsers());

    this.updateWebSockets$ = this.webSocketQuery.selectAll().subscribe((webSockets) => {
      this.webSockets = {};

      for (const webSocket of webSockets) {
        if (webSocket.disconnectedAt) {
          continue;
        }

        this.webSockets[webSocket.userId] = webSocket;
      }
    });

    this.message = 'Loading...';

    const roles = [IAuthorization.Role.UsersWrite];
    const userId = this.identityService.user?._id;
    this.hasWriteAuthorization = this.authorizationQuery.hasRoles(null, roles, userId);

    await this.fetchUsers();

    this.message = null;

    this.userService.emitter.on('create', (u) => {
      if (!this.match(u)) {
        return;
      }

      if (this.dataSource.data[0]?.username.localeCompare(u.username) > 0) {
        return;
      }

      if (
        this.dataSource.data[this.dataSource.data.length]?.username.localeCompare(u.username) < 0
      ) {
        return;
      }

      this.fetchUsers(true);
    });

    this.userService.emitter.on('delete', (u) => {
      const index = this.dataSource.data.findIndex((d) => d._id === u._id);

      if (index < 0 || index > this.dataSource.data.length) {
        return;
      }

      this.fetchUsers(true);
    });

    this.userService.emitter.on('update', (u) => {
      const index = this.dataSource.data.findIndex((d) => d._id === u._id);

      if (index < 0 || index > this.dataSource.data.length) {
        return;
      }

      if (this.match(u)) {
        this.dataSource.data[index] = u;
        this.dataSource.data = [...this.dataSource.data];
      } else {
        this.fetchUsers(true);
      }
    });
  }

  public ngOnDestroy() {
    clearTimeout(this.timeout);
    this.updateWebSockets$.unsubscribe();
  }

  public async fetchUsers(throttle = false) {
    const date = new Date();
    const threshold = this.date.getTime() + 5 * 1000;

    if (date.getTime() < threshold && throttle) {
      this.timeout = setTimeout(() => this.fetchUsers(), threshold - date.getTime());
      return;
    }

    if (!this.paginator) {
      return;
    }

    this.date = date;

    let where: any = {};
    if (this.filter) {
      where.$or ||= [];
      where.$or.push({ email: { $regex: `^${this.filter}`, $options: 'i' } });
      where.$or.push({ steamPersonaName: { $regex: `^${this.filter}`, $options: 'i' } });
      where.$or.push({ username: { $regex: `^${this.filter}`, $options: 'i' } });
    }

    this.dataSource.data = await this.userService.find({
      limit: this.paginator.pageSize,
      skip: this.paginator.pageIndex * this.paginator.pageSize,
      sort: `-username -steamPersonaName`,
      where,
    });

    this.paginator.length = await this.userService.count({ where });

    if (this.paginator.length < this.paginator.pageIndex * this.paginator.pageSize) {
      this.paginator.firstPage();
    }

    await this.webSocketService.find(null, {
      where: { userId: { $in: this.dataSource.data.map((u) => u._id) } },
    });
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

  public setFilter(value: string) {
    this.filter = value;
    this.filter$.next();
  }

  private match(user: UserModel) {
    const regex = new RegExp(`^${this.filter}`, 'i');

    if (
      this.filter &&
      !user.email.match(regex) &&
      !user.steamPersonaName.match(regex) &&
      !user.username.match(regex)
    ) {
      return false;
    }

    return true;
  }
}
