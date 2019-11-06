import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTable, MatTableDataSource, MatDialog } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { RecordService } from '@app/core/http';
import { IdentityService } from '@app/core/services';
import { PromptComponent } from '@app/shared/components';
import { TITLE } from '@app/shared/constants';
import { Record } from '@app/shared/models';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class RecordsListPageComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<Record>;

  public dataSource: MatTableDataSource<Record>;
  public displayedColumns: string[] = ['_id', 'createdAt', 'updatedAt', 'actions'];
  public search = '';

  private collectionId: string;
  private databaseId: string;
  private subject: Subject<string> = new Subject();

  constructor(
    public activatedRoute: ActivatedRoute,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private recordService: RecordService,
    private titleService: Title,
  ) {}

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      this.collectionId = params.get('collectionId');
      this.databaseId = params.get('databaseId');

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
        buttons: [{ background: 'accent', label: 'No' }, { color: 'white', label: 'Yes' }],
        message: `Are you sure you want to delete this Record?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.recordService.delete(this.databaseId, this.collectionId, record._id);
        this.deleteRecord(record);
      }
    });
  }

  private applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
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
