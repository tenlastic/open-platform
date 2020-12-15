import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { PipelineTemplate, PipelineTemplateService } from '@tenlastic/ng-http';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class PipelineTemplatesFormPageComponent implements OnInit {
  public data: PipelineTemplate;
  public errors: string[] = [];
  public form: FormGroup;
  public types = [
    { label: 'News', value: 'News' },
    { label: 'Patch Notes', value: 'Patch Notes' },
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private pipelineTemplateService: PipelineTemplateService,
    private router: Router,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const _id = params.get('_id');
      if (_id !== 'new') {
        this.data = await this.pipelineTemplateService.findOne(_id);
      }

      this.setupForm();
    });
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values: Partial<PipelineTemplate> = {
      namespaceId: this.form.get('namespaceId').value,
    };

    try {
      await this.upsert(values);
    } catch (e) {
      this.handleHttpError(e, { namespaceId: 'Namespace' });
    }
  }

  private async handleHttpError(err: HttpErrorResponse, pathMap: any) {
    this.errors = err.error.errors.map(e => {
      if (e.name === 'UniquenessError') {
        const combination = e.paths.length > 1 ? 'combination ' : '';
        const paths = e.paths.map(p => pathMap[p]);
        return `${paths.join(' / ')} ${combination}is not unique: ${e.values.join(' / ')}.`;
      } else {
        return e.message;
      }
    });
  }

  private setupForm(): void {
    this.data = this.data || new PipelineTemplate();

    this.form = this.formBuilder.group({
      namespaceId: [this.selectedNamespaceService.namespaceId, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(data: Partial<PipelineTemplate>) {
    if (this.data._id) {
      data._id = this.data._id;
      await this.pipelineTemplateService.update(data);
    } else {
      await this.pipelineTemplateService.create(data);
    }

    this.matSnackBar.open('PipelineTemplate saved successfully.');
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }
}
