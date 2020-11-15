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
import { Collection, CollectionService, Record, RecordService } from '@tenlastic/ng-http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { IdentityService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { SNACKBAR_DURATION, TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class RecordsListPageComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Record>;

  public collection: Collection;
  public dataSource: MatTableDataSource<Record>;
  public displayedColumns: string[];
  public propertyColumns: string[];
  public search = '';

  private subject: Subject<string> = new Subject();

  constructor(
    public activatedRoute: ActivatedRoute,
    public collectionService: CollectionService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private recordService: RecordService,
    private titleService: Title,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const collectionId = params.get('collectionId');
      this.collection = await this.collectionService.findOne(collectionId);

      this.propertyColumns = Object.entries(this.collection.jsonSchema.properties)
        .map(([key, value]) => (value.type === 'array' || value.type === 'object' ? null : key))
        .filter(p => p)
        .slice(0, 4);
      this.displayedColumns = this.propertyColumns.concat(['createdAt', 'updatedAt', 'actions']);

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
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Record?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.recordService.delete(this.collection._id, record._id);
        this.deleteRecord(record);

        this.matSnackBar.open('Record deleted successfully.', null, {
          duration: SNACKBAR_DURATION,
        });
      }
    });
  }

  private applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  private async fetchRecords() {
    const records = await this.recordService.find(this.collection._id, {
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
