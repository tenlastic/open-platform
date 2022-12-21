import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationQuery,
  CollectionModel,
  CollectionService,
  IAuthorization,
  RecordModel,
  RecordQuery,
  RecordService,
} from '@tenlastic/http';
import { Observable, Subscription } from 'rxjs';

import { PromptComponent } from '../../../../../../shared/components';
import { IdentityService } from '../../../../../../core/services';

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
  public displayedColumns: string[];
  public hasWriteAuthorization: boolean;
  public propertyColumns: string[];

  private $records: Observable<RecordModel[]>;
  private updateDataSource$ = new Subscription();
  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private collectionService: CollectionService,
    private identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private recordQuery: RecordQuery,
    private recordService: RecordService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      const roles = [IAuthorization.Role.CollectionsWrite];
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

      await this.fetchRecords(params);
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
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
