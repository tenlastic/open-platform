import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationQuery,
  CollectionModel,
  CollectionService,
  IAuthorization,
  RecordModel,
  RecordService,
  UserQuery,
  UserService,
} from '@tenlastic/http';
import { Subject } from 'rxjs';

import { PromptComponent } from '../../../../../../shared/components';
import { ClipboardService, IdentityService } from '../../../../../../core/services';
import { debounceTime } from 'rxjs/operators';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class RecordsListPageComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild(MatPaginator) private paginator: MatPaginator;

  public collection: CollectionModel;
  public dataSource = new MatTableDataSource<RecordModel>();
  public displayedColumns: string[];
  public filter: string;
  public hasWriteAuthorization: boolean;
  public message: string;
  public get pageIndex() {
    return this.paginator?.pageIndex || 0;
  }
  public get pageSize() {
    return this.paginator?.pageSize || 10;
  }
  public propertyColumns: string[];

  private filter$ = new Subject();
  private count = 0;
  private date = new Date(0);
  private params: Params;
  private timeout: NodeJS.Timeout;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private clipboardService: ClipboardService,
    private collectionService: CollectionService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private recordService: RecordService,
    private userQuery: UserQuery,
    private userService: UserService,
  ) {}

  public async ngOnInit() {
    this.filter$.pipe(debounceTime(300)).subscribe(() => this.fetchRecords());

    this.activatedRoute.params.subscribe(async (params) => {
      this.message = 'Loading...';
      this.params = params;

      const roles = [IAuthorization.Role.CollectionsWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      const [collection] = await Promise.all([
        this.collectionService.findOne(params.namespaceId, params.collectionId),
        this.fetchRecords(),
      ]);

      this.collection = collection;
      this.propertyColumns = Object.entries(this.collection.jsonSchema.properties)
        .map(([key, value]) => (value.type === 'array' || value.type === 'object' ? null : key))
        .filter((p) => p)
        .slice(0, 4);
      this.displayedColumns = this.propertyColumns.concat([
        'createdAt',
        'updatedAt',
        'userId',
        'actions',
      ]);

      this.message = null;
    });

    this.recordService.emitter.on('create', (r) => {
      if (!this.match(r)) {
        return;
      }

      if (this.dataSource.data[0]?.createdAt >= r.createdAt) {
        return;
      }

      if (this.dataSource.data[this.dataSource.data.length]?.createdAt <= r.createdAt) {
        return;
      }

      this.fetchRecords(true);
    });

    this.recordService.emitter.on('delete', (r) => {
      const index = this.dataSource.data.findIndex((d) => d._id === r._id);

      if (index < 0 || index > this.dataSource.data.length) {
        return;
      }

      this.fetchRecords(true);
    });

    this.recordService.emitter.on('update', (r) => {
      const index = this.dataSource.data.findIndex((d) => d._id === r._id);

      if (index < 0 || index > this.dataSource.data.length) {
        return;
      }

      if (this.match(r)) {
        this.dataSource.data[index] = r;
        this.dataSource.data = [...this.dataSource.data];
      } else {
        this.fetchRecords(true);
      }
    });
  }

  public ngAfterViewInit() {
    this.paginator.length = this.count;
  }

  public ngOnDestroy() {
    clearTimeout(this.timeout);
  }

  public copyToClipboard(value: string) {
    this.clipboardService.copy(value);
    this.matSnackBar.open('User ID copied to clipboard.');
  }

  public async fetchRecords(throttle = false) {
    const date = new Date();
    const threshold = this.date.getTime() + 5 * 1000;

    if (date.getTime() < threshold && throttle) {
      this.timeout = setTimeout(() => this.fetchRecords(), threshold - date.getTime());
      return;
    }

    this.date = date;

    let where: any = {};
    if (this.filter) {
      where.userId = this.filter;
    }

    this.dataSource.data = await this.recordService.find(
      this.params.namespaceId,
      this.params.collectionId,
      {
        limit: this.pageSize,
        skip: this.pageIndex * this.pageSize,
        sort: `_id`,
        where,
      },
    );

    this.count = await this.recordService.count(this.params.namespaceId, this.params.collectionId, {
      where,
    });

    if (this.paginator) {
      this.paginator.length = this.count;

      if (this.paginator.length < this.pageIndex * this.pageSize) {
        this.paginator.firstPage();
      }
    }

    const userIds = this.dataSource.data
      .map((r) => r.userId)
      .filter((ui) => !this.userQuery.hasEntity(ui));

    if (userIds.length > 0) {
      await this.userService.find({ where: { _id: { $in: userIds } } });
    }
  }

  public getUser(_id: string) {
    return this.userQuery.getEntity(_id);
  }

  public setFilter(value: string) {
    this.filter = value;
    this.filter$.next();
  }

  public showDeletePrompt($event: Event, record: RecordModel) {
    $event.stopPropagation();

    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Record?`,
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result === 'Yes') {
        await this.recordService.delete(
          this.params.namespaceId,
          this.params.collectionId,
          record._id,
        );
        this.matSnackBar.open('Record deleted successfully.');
      }
    });
  }

  private match(record: RecordModel) {
    if (record.collectionId !== this.params.collectionId) {
      return false;
    }

    if (record.namespaceId !== this.params.namespaceId) {
      return false;
    }

    return true;
  }
}
