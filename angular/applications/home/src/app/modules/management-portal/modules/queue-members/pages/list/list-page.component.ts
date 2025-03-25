import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationQuery,
  IAuthorization,
  QueueMemberModel,
  QueueMemberService,
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
export class QueueMembersListPageComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild(MatPaginator) private paginator: MatPaginator;

  public dataSource = new MatTableDataSource<QueueMemberModel>();
  public displayedColumns = ['queue', 'user', 'createdAt', 'actions'];
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
    private queueMemberService: QueueMemberService,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
    private userQuery: UserQuery,
    private userService: UserService,
  ) {}

  public async ngOnInit() {
    this.filter$.pipe(debounceTime(300)).subscribe(() => this.fetchQueueMembers());

    this.activatedRoute.params.subscribe(async (params) => {
      this.message = 'Loading...';
      this.params = params;

      if (params.queueId) {
        this.displayedColumns = ['user', 'createdAt', 'actions'];
      } else {
        this.displayedColumns = ['queue', 'user', 'createdAt', 'actions'];
      }

      const roles = [IAuthorization.Role.QueuesWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      await this.fetchQueueMembers();

      this.message = null;
    });

    this.queueMemberService.emitter.on('create', (a) => {
      if (!this.match(a)) {
        return;
      }

      if (this.dataSource.data[0]?.createdAt >= a.createdAt) {
        return;
      }

      if (this.dataSource.data[this.dataSource.data.length]?.createdAt <= a.createdAt) {
        return;
      }

      this.fetchQueueMembers(true);
    });

    this.queueMemberService.emitter.on('delete', (a) => {
      const index = this.dataSource.data.findIndex((d) => d._id === a._id);

      if (index < 0 || index > this.dataSource.data.length) {
        return;
      }

      this.fetchQueueMembers(true);
    });

    this.queueMemberService.emitter.on('update', (a) => {
      const index = this.dataSource.data.findIndex((d) => d._id === a._id);

      if (index < 0 || index > this.dataSource.data.length) {
        return;
      }

      if (this.match(a)) {
        this.dataSource.data[index] = a;
        this.dataSource.data = [...this.dataSource.data];
      } else {
        this.fetchQueueMembers(true);
      }
    });
  }

  public ngAfterViewInit() {
    this.paginator.length = this.count;
  }

  public ngOnDestroy() {
    clearTimeout(this.timeout);
  }

  public async fetchQueueMembers(throttle = false) {
    const date = new Date();
    const threshold = this.date.getTime() + 5 * 1000;

    if (date.getTime() < threshold && throttle) {
      this.timeout = setTimeout(() => this.fetchQueueMembers(), threshold - date.getTime());
      return;
    }

    this.date = date;

    let where: any = {};
    if (this.filter) {
      where.userId = this.filter;
    }
    where.namespaceId = this.params.namespaceId;
    where.queueId = this.params.queueId;

    this.dataSource.data = await this.queueMemberService.find(this.params.namespaceId, {
      limit: this.pageSize,
      skip: this.pageIndex * this.pageSize,
      sort: `createdAt`,
      where,
    });

    this.count = await this.queueMemberService.count(this.params.namespaceId, {
      where,
    });

    if (this.paginator) {
      this.paginator.length = this.count;

      if (this.paginator.length < this.pageIndex * this.pageSize) {
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
      .map((d) => d.userId)
      .filter((ui) => !this.userQuery.hasEntity(ui));

    if (userIds.length > 0) {
      await this.userService.find({ where: { _id: { $in: userIds } } });
    }
  }

  public getQueue(_id: string) {
    return this.queueQuery.getEntity(_id);
  }

  public getUser(_id: string) {
    return this.userQuery.getEntity(_id);
  }

  public setFilter(value: string) {
    this.filter = value;
    this.filter$.next();
  }

  public showDeletePrompt($event: Event, record: QueueMemberModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Queue Member?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.queueMemberService.delete(record.namespaceId, record._id);
        this.matSnackBar.open('Queue Member deleted successfully.');
      }
    });
  }

  private match(authorization: QueueMemberModel) {
    if (this.filter && this.filter !== authorization.userId) {
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
