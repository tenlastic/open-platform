import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationQuery,
  CollectionModel,
  CollectionService,
  IAuthorization,
  RecordModel,
  RecordQuery,
  RecordService,
  RecordStore,
  StreamService,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { environment } from '../../../../../../../environments/environment';
import { PromptComponent } from '../../../../../../shared/components';
import { IdentityService } from '../../../../../../core/services';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class RecordsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<RecordModel>;

  public collection: CollectionModel;
  public dataSource = new MatTableDataSource<RecordModel>();
  public displayedColumns;
  public hasWriteAuthorization: boolean;
  public propertyColumns: string[];

  private $records: Observable<RecordModel[]>;
  private updateDataSource$ = new Subscription();
  private params: Params;
  private subscription: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private collectionService: CollectionService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private recordQuery: RecordQuery,
    private recordService: RecordService,
    private recordStore: RecordStore,
    private streamService: StreamService,
    private titleService: Title,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;
      this.titleService.setTitle(`${TITLE} | Records`);

      const roles = [IAuthorization.Role.CollectionsReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      this.collection = await this.collectionService.findOne(
        params.namespaceId,
        params.collectionId,
      );

      this.propertyColumns = Object.entries(this.collection.jsonSchema.properties)
        .map(([key, value]) => (value.type === 'array' || value.type === 'object' ? null : key))
        .filter((p) => p)
        .slice(0, 4);
      this.displayedColumns = this.propertyColumns.concat(['createdAt', 'updatedAt', 'actions']);

      this.subscription = await this.streamService.subscribe(
        'records',
        RecordModel,
        this.recordService,
        this.recordStore,
        environment.wssUrl,
        { collectionId: this.params.collectionId },
      );

      await this.fetchRecords(params);
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
    this.streamService.unsubscribe(this.subscription, environment.wssUrl);
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

  private async fetchRecords(params: Params) {
    this.$records = this.recordQuery.selectAll({
      filterBy: (gs) => gs.collectionId === params.collectionId,
    });

    await this.recordService.find(params.namespaceId, params.collectionId, { sort: 'name' });

    this.updateDataSource$ = this.$records.subscribe((records) => (this.dataSource.data = records));

    this.dataSource.filterPredicate = (data: RecordModel, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      const json = JSON.stringify(data);

      return regex.test(json);
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
