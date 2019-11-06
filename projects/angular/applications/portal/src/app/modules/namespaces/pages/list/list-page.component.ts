import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, MatSort, MatTable, MatTableDataSource, MatDialog } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { NamespaceService } from '@app/core/http';
import { IdentityService, SelectedNamespaceService } from '@app/core/services';
import { PromptComponent } from '@app/shared/components';
import { TITLE } from '@app/shared/constants';
import { Namespace } from '@app/shared/models';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class NamespacesListPageComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<Namespace>;

  public dataSource: MatTableDataSource<Namespace>;
  public displayedColumns: string[] = ['name', 'createdAt', 'updatedAt', 'actions'];
  public search = '';

  private subject: Subject<string> = new Subject();

  constructor(
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private namespaceService: NamespaceService,
    private selectedNamespaceService: SelectedNamespaceService,
    private titleService: Title,
  ) {}

  ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Namespaces`);
    this.fetchNamespaces();

    this.subject.pipe(debounceTime(300)).subscribe(this.applyFilter.bind(this));
  }

  public clearSearch() {
    this.search = '';
    this.applyFilter('');
  }

  public onKeyUp(searchTextValue: string) {
    this.subject.next(searchTextValue);
  }

  public select(record: Namespace) {
    this.selectedNamespaceService.namespace = record;
  }

  public showDeletePrompt(record: Namespace) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [{ background: 'accent', label: 'No' }, { color: 'white', label: 'Yes' }],
        message: `Are you sure you want to delete this Namespace?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.namespaceService.delete(record._id);
        this.deleteNamespace(record);
      }
    });
  }

  private applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  private async fetchNamespaces() {
    const records = await this.namespaceService.find({ sort: 'email' });

    this.dataSource = new MatTableDataSource<Namespace>(records);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private deleteNamespace(record: Namespace) {
    const index = this.dataSource.data.findIndex(u => u._id === record._id);
    this.dataSource.data.splice(index, 1);

    this.dataSource.data = [].concat(this.dataSource.data);
    this.table.renderRows();
  }
}
