import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import {
  Collection,
  CollectionService,
  DatabaseService,
  Record,
  RecordQuery,
  RecordService,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';

import { environment } from '../../../../../../../environments/environment';
import {
  BreadcrumbsComponentBreadcrumb,
  PromptComponent,
} from '../../../../../../shared/components';
import { Socket, SocketService } from '../../../../../../core/services';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class RecordsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Record>;

  public $records: Observable<Record[]>;
  public breadcrumbs: BreadcrumbsComponentBreadcrumb[] = [];
  public collection: Collection;
  public dataSource = new MatTableDataSource<Record>();
  public displayedColumns: string[];
  public propertyColumns: string[];

  private updateDataSource$ = new Subscription();
  private get collectionId() {
    return this.activatedRoute.snapshot.paramMap.get('collectionId');
  }
  private get databaseId() {
    return this.activatedRoute.snapshot.paramMap.get('databaseId');
  }
  private socket: Socket;

  constructor(
    private activatedRoute: ActivatedRoute,
    private collectionService: CollectionService,
    private databaseService: DatabaseService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private recordQuery: RecordQuery,
    private recordService: RecordService,
    private socketService: SocketService,
    private titleService: Title,
  ) {}

  public async ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Records`);

    this.collection = await this.collectionService.findOne(this.databaseId, this.collectionId);
    const database = await this.databaseService.findOne(this.databaseId);
    this.breadcrumbs = [
      { label: 'Databases', link: '../../../../' },
      { label: database.name, link: '../../../' },
      { label: 'Collections', link: '../../' },
      { label: this.collection.name, link: '../' },
      { label: 'Records' },
    ];

    this.propertyColumns = Object.entries(this.collection.jsonSchema.properties)
      .map(([key, value]) => (value.type === 'array' || value.type === 'object' ? null : key))
      .filter(p => p)
      .slice(0, 4);
    this.displayedColumns = this.propertyColumns.concat(['createdAt', 'updatedAt', 'actions']);

    const url = `${environment.databaseApiBaseUrl}/${this.databaseId}/web-sockets`;
    this.socket = await this.socketService.connect(url);
    this.socket.addEventListener('open', () => {
      this.socket.subscribe('collections', Collection, this.collectionService);
      this.socket.subscribe('records', Record, this.recordService, {
        collectionId: this.collectionId,
      });
    });

    await this.fetchRecords();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
    this.socket.close();
  }

  public showDeletePrompt(record: Record) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Record?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.recordService.delete(this.databaseId, this.collectionId, record._id);
        this.matSnackBar.open('Record deleted successfully.');
      }
    });
  }

  private async fetchRecords() {
    this.$records = this.recordQuery.selectAll({
      filterBy: gs => gs.collectionId === this.collectionId && gs.databaseId === this.databaseId,
    });

    await this.recordService.find(this.databaseId, this.collectionId, {
      sort: 'name',
    });

    this.updateDataSource$ = this.$records.subscribe(records => (this.dataSource.data = records));

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
