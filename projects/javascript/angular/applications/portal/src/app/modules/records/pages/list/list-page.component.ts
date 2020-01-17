import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTable, MatTableDataSource, MatDialog } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';
import {
  Collection,
  CollectionService,
  Database,
  DatabaseService,
  Record,
  RecordService,
} from '@tenlastic/ng-http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { PromptComponent } from '../../../../shared/components';
import { TITLE } from '../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class RecordsListPageComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Record>;

  public dataSource: MatTableDataSource<Record>;
  public displayedColumns: string[] = ['_id', 'actions'];
  public search = '';

  private collection: Collection;
  private database: Database;
  private subject: Subject<string> = new Subject();

  constructor(
    public activatedRoute: ActivatedRoute,
    public collectionService: CollectionService,
    public databaseService: DatabaseService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private recordService: RecordService,
    private titleService: Title,
  ) {}

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const databaseName = params.get('databaseName');
      this.database = await this.databaseService.findOne(databaseName);

      const collectionName = params.get('collectionName');
      this.collection = await this.collectionService.findOne(this.database.name, collectionName);

      this.titleService.setTitle(`${TITLE} | Records`);
      this.fetchRecords();

      this.subject.pipe(debounceTime(300)).subscribe(this.applyFilter.bind(this));
    });
  }

  public clearSearch() {
    this.search = '';
    this.applyFilter('');
  }

  public onKeyUp(searchTextValue: string) {
    this.subject.next(searchTextValue);
  }

  public showDeletePrompt(record: Record) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { background: 'accent', label: 'No' },
          { color: 'white', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Record?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.recordService.delete(this.database.name, this.collection.name, record._id);
        this.deleteRecord(record);
      }
    });
  }

  private applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  private async fetchRecords() {
    const records = await this.recordService.find(this.database.name, this.collection.name, {
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
