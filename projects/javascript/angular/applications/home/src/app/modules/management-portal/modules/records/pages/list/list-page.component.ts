import { Component, OnInit, ViewChild } from '@angular/core';
import {
  MatPaginator,
  MatSort,
  MatTable,
  MatTableDataSource,
  MatDialog,
  MatSnackBar,
} from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import {
  Collection,
  CollectionService,
  DatabaseService,
  Record,
  RecordService,
} from '@tenlastic/ng-http';

import {
  BreadcrumbsComponentBreadcrumb,
  PromptComponent,
} from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class RecordsListPageComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Record>;

  public breadcrumbs: BreadcrumbsComponentBreadcrumb[] = [];
  public collection: Collection;
  public dataSource = new MatTableDataSource<Record>();
  public displayedColumns: string[];
  public propertyColumns: string[];

  private collectionId: string;
  private databaseId: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private collectionService: CollectionService,
    private databaseService: DatabaseService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private recordService: RecordService,
    private titleService: Title,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      this.collectionId = params.get('collectionId');
      this.databaseId = params.get('databaseId');

      this.collection = await this.collectionService.findOne(this.databaseId, this.collectionId);

      this.propertyColumns = Object.entries(this.collection.jsonSchema.properties)
        .map(([key, value]) => (value.type === 'array' || value.type === 'object' ? null : key))
        .filter(p => p)
        .slice(0, 4);
      this.displayedColumns = this.propertyColumns.concat(['createdAt', 'updatedAt', 'actions']);

      this.titleService.setTitle(`${TITLE} | Records`);
      await this.fetchRecords();

      const database = await this.databaseService.findOne(this.databaseId);
      this.breadcrumbs = [
        { label: 'Databases', link: '../../../../' },
        { label: database.name, link: '../../../' },
        { label: 'Collections', link: '../../' },
        { label: this.collection.name, link: '../' },
        { label: 'Records' },
      ];
    });
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
        this.deleteRecord(record);

        this.matSnackBar.open('Record deleted successfully.');
      }
    });
  }

  private async fetchRecords() {
    const records = await this.recordService.find(this.databaseId, this.collectionId, {
      sort: '_id',
    });

    this.dataSource = new MatTableDataSource<Record>(records);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private deleteRecord(record: Record) {
    const index = this.dataSource.data.findIndex(u => u._id === record._id);
    this.dataSource.data.splice(index, 1);

    this.dataSource.data = [].concat(this.dataSource.data);
    this.table.renderRows();
  }
}
