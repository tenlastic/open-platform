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
  Collection,
  CollectionService,
  IAuthorization,
  Record,
  RecordQuery,
  RecordService,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { environment } from '../../../../../../../environments/environment';
import { PromptComponent } from '../../../../../../shared/components';
import { IdentityService, Socket, SocketService } from '../../../../../../core/services';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class RecordsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Record>;

  public collection: Collection;
  public dataSource = new MatTableDataSource<Record>();
  public displayedColumns;
  public hasWriteAuthorization: boolean;
  public propertyColumns: string[];

  private $records: Observable<Record[]>;
  private updateDataSource$ = new Subscription();
  private params: Params;
  private socket: Socket;
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
    private socketService: SocketService,
    private titleService: Title,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;
      this.titleService.setTitle(`${TITLE} | Records`);

      const roles = [IAuthorization.AuthorizationRole.CollectionsReadWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      this.collection = await this.collectionService.findOne(params.collectionId);

      this.propertyColumns = Object.entries(this.collection.jsonSchema.properties)
        .map(([key, value]) => (value.type === 'array' || value.type === 'object' ? null : key))
        .filter((p) => p)
        .slice(0, 4);
      this.displayedColumns = this.propertyColumns.concat(['createdAt', 'updatedAt', 'actions']);

      this.socket = await this.socketService.connect(environment.apiBaseUrl);
      this.subscription = this.socket.subscribe('records', Record, this.recordService, {
        collectionId: this.params.collectionId,
      });

      await this.fetchRecords(params);
    });
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
    this.socket.unsubscribe(this.subscription);
  }

  public showDeletePrompt($event: Event, record: Record) {
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
        await this.recordService.delete(this.params.collectionId, record._id);
        this.matSnackBar.open('Record deleted successfully.');
      }
    });
  }

  private async fetchRecords(params: Params) {
    this.$records = this.recordQuery.selectAll({
      filterBy: (gs) => gs.collectionId === params.collectionId,
    });

    await this.recordService.find(params.collectionId, { sort: 'name' });

    this.updateDataSource$ = this.$records.subscribe((records) => (this.dataSource.data = records));

    this.dataSource.filterPredicate = (data: Record, filter: string) => {
      const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      const json = JSON.stringify(data);

      return regex.test(json);
    };

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
