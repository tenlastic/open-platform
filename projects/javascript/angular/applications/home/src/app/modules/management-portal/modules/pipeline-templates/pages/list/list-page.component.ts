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
import {
  PipelineTemplate,
  PipelineTemplateQuery,
  PipelineTemplateService,
} from '@tenlastic/ng-http';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';
import { PromptComponent } from '../../../../../../shared/components';
import { TITLE } from '../../../../../../shared/constants';

@Component({
  templateUrl: 'list-page.component.html',
  styleUrls: ['./list-page.component.scss'],
})
export class PipelineTemplatesListPageComponent implements OnDestroy, OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<PipelineTemplate>;

  public $pipelineTemplates: Observable<PipelineTemplate[]>;
  public dataSource = new MatTableDataSource<PipelineTemplate>();
  public displayedColumns: string[] = ['createdAt', 'updatedAt', 'actions'];
  public search = '';

  private updateDataSource$ = new Subscription();
  private subject: Subject<string> = new Subject();

  constructor(
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private pipelineTemplateQuery: PipelineTemplateQuery,
    private pipelineTemplateService: PipelineTemplateService,
    private selectedNamespaceService: SelectedNamespaceService,
    private titleService: Title,
  ) {}

  public async ngOnInit() {
    this.titleService.setTitle(`${TITLE} | Pipeline Templates`);
    this.subject.pipe(debounceTime(300)).subscribe(this.applyFilter.bind(this));

    await this.fetchPipelineTemplates();
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

  public showDeletePrompt(record: PipelineTemplate) {
    const dialogRef = this.matDialog.open(PromptComponent, {
      data: {
        buttons: [
          { color: 'primary', label: 'No' },
          { color: 'accent', label: 'Yes' },
        ],
        message: `Are you sure you want to delete this Pipeline Template?`,
      },
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'Yes') {
        await this.pipelineTemplateService.delete(record._id);
        this.matSnackBar.open('Pipeline Template deleted successfully.');
      }
    });
  }

  private applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  private async fetchPipelineTemplates() {
    this.$pipelineTemplates = this.pipelineTemplateQuery.selectAll({
      filterBy: gs => gs.namespaceId === this.selectedNamespaceService.namespaceId,
    });

    await this.pipelineTemplateService.find({
      where: { namespaceId: this.selectedNamespaceService.namespaceId },
    });

    this.updateDataSource$ = this.$pipelineTemplates.subscribe(
      pipelineTemplates => (this.dataSource.data = pipelineTemplates),
    );

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
