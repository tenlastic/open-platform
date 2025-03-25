import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationModel,
  AuthorizationQuery,
  AuthorizationService,
  IAuthorization,
  UserQuery,
} from '@tenlastic/http';
import { Subject } from 'rxjs';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { debounceTime } from 'rxjs/operators';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class AuthorizationsListPageComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild(MatPaginator) private paginator: MatPaginator;

  public dataSource = new MatTableDataSource<AuthorizationModel>();
  public displayedColumns = ['name', 'user', 'roles', 'createdAt', 'actions'];
  public filter: string;
  public hasWriteAuthorization: boolean;
  public message: string;
  public get pageIndex() {
    return this.paginator?.pageIndex || 0;
  }
  public get pageSize() {
    return this.paginator?.pageSize || 10;
  }

  private filter$ = new Subject();
  private count = 0;
  private date = new Date(0);
  private params: Params;
  private timeout: NodeJS.Timeout;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private authorizationService: AuthorizationService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private userQuery: UserQuery,
  ) {}

  public ngOnInit() {
    this.filter$.pipe(debounceTime(300)).subscribe(() => this.fetchAuthorizations());

    this.activatedRoute.params.subscribe(async (params) => {
      this.message = 'Loading...';
      this.params = params;

      if (params.namespaceId) {
        this.displayedColumns = ['name', 'roles', 'user', 'createdAt', 'actions'];
      } else {
        this.displayedColumns = ['roles', 'user', 'createdAt', 'actions'];
      }

      const roles = [IAuthorization.Role.AuthorizationsWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization = this.authorizationQuery.hasRoles(null, roles, userId);

      await this.fetchAuthorizations();

      this.message = null;
    });

    this.authorizationService.emitter.on('create', (a) => {
      if (!this.match(a)) {
        return;
      }

      if (this.dataSource.data[0]?.createdAt >= a.createdAt) {
        return;
      }

      if (this.dataSource.data[this.dataSource.data.length]?.createdAt <= a.createdAt) {
        return;
      }

      this.fetchAuthorizations(true);
    });

    this.authorizationService.emitter.on('delete', (a) => {
      const index = this.dataSource.data.findIndex((d) => d._id === a._id);

      if (index < 0 || index > this.dataSource.data.length) {
        return;
      }

      this.fetchAuthorizations(true);
    });

    this.authorizationService.emitter.on('update', (a) => {
      const index = this.dataSource.data.findIndex((d) => d._id === a._id);

      if (index < 0 || index > this.dataSource.data.length) {
        return;
      }

      if (this.match(a)) {
        this.dataSource.data[index] = a;
        this.dataSource.data = [...this.dataSource.data];
      } else {
        this.fetchAuthorizations(true);
      }
    });
  }

  public ngAfterViewInit() {
    this.paginator.length = this.count;
  }

  public ngOnDestroy() {
    clearTimeout(this.timeout);
  }

  public async fetchAuthorizations(throttle = false) {
    const date = new Date();
    const threshold = this.date.getTime() + 5 * 1000;

    if (date.getTime() < threshold && throttle) {
      this.timeout = setTimeout(() => this.fetchAuthorizations(), threshold - date.getTime());
      return;
    }

    this.date = date;

    let where: any = {};
    if (this.filter) {
      where.userId = this.filter;
    }
    if (this.params.namespace) {
      where.namespaceId = this.params.namespaceId;
    } else {
      where.namespaceId = null;
    }

    this.dataSource.data = await this.authorizationService.find(this.params.namespaceId, {
      limit: this.pageSize,
      skip: this.pageIndex * this.pageSize,
      sort: `-createdAt`,
      where,
    });

    this.count = await this.authorizationService.count(this.params.namespaceId, {
      where,
    });

    if (this.paginator) {
      this.paginator.length = this.count;

      if (this.paginator.length < this.pageIndex * this.pageSize) {
        this.paginator.firstPage();
      }
    }
  }

  public getUser(_id: string) {
    return this.userQuery.getEntity(_id);
  }

  public setFilter(value: string) {
    this.filter = value;
    this.filter$.next();
  }

  public showDeletePrompt($event: Event, record: AuthorizationModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Authorization?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.authorizationService.delete(record.namespaceId, record._id);
        this.matSnackBar.open('Authorization deleted successfully.');
      }
    });
  }

  private match(authorization: AuthorizationModel) {
    if (this.filter && this.filter !== authorization.userId) {
      return false;
    }

    if (this.params.namespaceId !== authorization.namespaceId) {
      return false;
    }

    return true;
  }
}
