import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationQuery,
  IAuthorization,
  TeamModel,
  TeamService,
  QueueQuery,
  QueueService,
  UserQuery,
  UserService,
} from '@tenlastic/http';
import { Subject } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { debounceTime } from 'rxjs/operators';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class TeamsListPageComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild(MatPaginator) private paginator: MatPaginator;

  public dataSource = new MatTableDataSource<TeamModel>();
  public displayedColumns = ['queue', 'rating', 'users', 'createdAt', 'actions'];
  public filter: string;
  public hasWriteAuthorization: boolean;
  public message: string;
  public get pageIndex() {
    return this.paginator?.pageIndex || 0;
  }
  public get pageSize() {
    return this.paginator?.pageSize || 10;
  }
  public get queueId() {
    return this.params?.queueId;
  }

  private filter$ = new Subject();
  private count = 0;
  private date = new Date(0);
  private params: Params;
  private timeout: NodeJS.Timeout;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
    private teamService: TeamService,
    private userQuery: UserQuery,
    private userService: UserService,
  ) {}

  public async ngOnInit() {
    this.filter$.pipe(debounceTime(300)).subscribe(() => this.fetchTeams());

    this.activatedRoute.params.subscribe(async (params) => {
      this.message = 'Loading...';
      this.params = params;

      if (params.queueId) {
        this.displayedColumns = ['rating', 'users', 'createdAt', 'updatedAt', 'actions'];
      } else {
        this.displayedColumns = ['queue', 'rating', 'users', 'createdAt', 'updatedAt', 'actions'];
      }

      const roles = [IAuthorization.Role.TeamsWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      await this.fetchTeams();

      this.message = null;
    });

    this.teamService.emitter.on('create', (a) => {
      if (!this.match(a)) {
        return;
      }

      if (this.dataSource.data[0]?.createdAt >= a.createdAt) {
        return;
      }

      if (this.dataSource.data[this.dataSource.data.length]?.createdAt <= a.createdAt) {
        return;
      }

      this.fetchTeams(true);
    });

    this.teamService.emitter.on('delete', (a) => {
      const index = this.dataSource.data.findIndex((d) => d._id === a._id);

      if (index < 0 || index > this.dataSource.data.length) {
        return;
      }

      this.fetchTeams(true);
    });

    this.teamService.emitter.on('update', (a) => {
      const index = this.dataSource.data.findIndex((d) => d._id === a._id);

      if (index < 0 || index > this.dataSource.data.length) {
        return;
      }

      if (this.match(a)) {
        this.dataSource.data[index] = a;
        this.dataSource.data = [...this.dataSource.data];
      } else {
        this.fetchTeams(true);
      }
    });
  }

  public ngAfterViewInit() {
    this.paginator.length = this.count;
  }

  public ngOnDestroy() {
    clearTimeout(this.timeout);
  }

  public async fetchTeams(throttle = false) {
    const date = new Date();
    const threshold = this.date.getTime() + 5 * 1000;

    if (date.getTime() < threshold && throttle) {
      this.timeout = setTimeout(() => this.fetchTeams(), threshold - date.getTime());
      return;
    }

    this.date = date;

    let where: any = {};
    if (this.filter) {
      where.userId = this.filter;
    }
    where.namespaceId = this.params.namespaceId;
    where.queueId = this.params.queueId;

    this.dataSource.data = await this.teamService.find(this.params.namespaceId, {
      limit: this.pageSize,
      skip: this.pageIndex * this.pageSize,
      sort: `-rating`,
      where,
    });

    this.count = await this.teamService.count(this.params.namespaceId, { where });

    if (this.paginator) {
      this.paginator.length = this.count;

      if (this.paginator.length < this.paginator.pageIndex * this.paginator.pageSize) {
        this.paginator.firstPage();
      }
    }

    const queueIds = this.dataSource.data
      .map((d) => d.queueId)
      .filter((qi) => !this.queueQuery.hasEntity(qi));

    if (queueIds.length > 0) {
      await this.queueService.find(this.params.namespaceId, { where: { _id: { $in: queueIds } } });
    }

    const userIds = this.dataSource.data
      .map((d) => d.userIds)
      .flat()
      .filter((ui) => !this.userQuery.hasEntity(ui));

    if (userIds.length > 0) {
      await this.userService.find({ where: { _id: { $in: userIds } } });
    }
  }

  public getQueue(_id: string) {
    return this.queueQuery.getEntity(_id);
  }

  public getUsers(userIds: string[]) {
    return userIds
      .map((ui) => this.userQuery.getEntity(ui))
      .map((u) => u.displayName)
      .join(', ');
  }

  public setFilter(value: string) {
    this.filter = value;
    this.filter$.next();
  }

  public showDeletePrompt($event: Event, record: TeamModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Team?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.teamService.delete(record.namespaceId, record._id);
        this.matSnackBar.open('Team deleted successfully.');
      }
    });
  }

  private match(authorization: TeamModel) {
    if (this.filter && !authorization.userIds.includes(this.filter)) {
      return false;
    }

    if (this.params.namespaceId !== authorization.namespaceId) {
      return false;
    }

    if (this.params.queueId !== authorization.queueId) {
      return false;
    }

    return true;
  }
}
