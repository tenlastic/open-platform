import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  MatPaginator,
  MatSort,
  MatTable,
  MatTableDataSource,
  MatDialog,
  MatSnackBar,
} from '@angular/material';
import { Title } from '@angular/platform-browser';
import { Workflow, WorkflowQuery, WorkflowService } from '@tenlastic/ng-http';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class WorkflowsListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<Workflow>;

  public $workflows: Observable<Workflow[]>;
  public dataSource = new MatTableDataSource<Workflow>();
  public displayedColumns: string[] = ['name', 'createdAt', 'updatedAt', 'actions'];
  public search = '';

  private updateDataSource$ = new Subscription();
  private subject: Subject<string> = new Subject();

  constructor(
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private workflowQuery: WorkflowQuery,
    private workflowService: WorkflowService,
    private selectedNamespaceService: SelectedNamespaceService,
    private titleService: Title,
  ) {}

  public async ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Workflow s`);
    this.subject.pipe(debounceTime(300)).subscribe(this.applyFilter.bind(this));

    await this.fetchWorkflows();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
  }

  public clearSearch() {
    this.search = '';
    this.applyFilter('');
  }

  public onKeyUp(searchTextValue: string) {
    this.subject.next(searchTextValue);
  }

  public showDeletePrompt(record: Workflow) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Workflow ?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.workflowService.delete(record._id);
        this.matSnackBar.open('Workflow  deleted successfully.');
      }
    });
  }

  private applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  private async fetchWorkflows() {
    this.$workflows = this.workflowQuery.selectAll({
      filterBy: gs => gs.namespaceId === this.selectedNamespaceService.namespaceId,
    });

    await this.workflowService.find({
      where: { namespaceId: this.selectedNamespaceService.namespaceId },
    });

    this.updateDataSource$ = this.$workflows.subscribe(
      workflows => (this.dataSource.data = workflows),
    );

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
