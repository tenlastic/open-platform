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
import { Observable, Subscription } from 'rxjs';

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
  public displayedColumns: string[] = ['name', 'status', 'createdAt', 'updatedAt', 'actions'];

  private updateDataSource$ = new Subscription();

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
    this.titleService.setTitle(`${TITLE} | Workflows`);
    await this.fetchWorkflows();
  }

  public ngOnDestroy() {
    this.updateDataSource$.unsubscribe();
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
