import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { Pipeline, PipelineService } from '@tenlastic/ng-http';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class PipelinesFormPageComponent implements OnInit {
  public data: Pipeline;
  public errors: string[] = [];
  public form: FormGroup;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private pipelineService: PipelineService,
    private router: Router,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const _id = params.get('_id');
      if (_id !== 'new') {
        this.data = await this.pipelineService.findOne(_id);
      }

      this.setupForm();
    });
  }

  public addStep() {
    const property = this.getDefaultStepFormGroup();
    const formArray = this.form.get('steps') as FormArray;

    formArray.push(property);
  }

  public removeStep(index: number) {
    const formArray = this.form.get('steps') as FormArray;
    formArray.removeAt(index);
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const values: Partial<Pipeline> = {
      name: raw.name,
      namespaceId: raw.namespaceId,
      spec: {
        steps: raw.steps,
        templates: [
          {
            name: 'Build',
            script: {
              image: 'alpine:latest',
              source: undefined,
            },
          },
        ],
      },
    };

    try {
      await this.upsert(values);
    } catch (e) {
      this.handleHttpError(e, { name: 'Name', namespaceId: 'Namespace' });
    }
  }

  private getDefaultStepFormGroup() {
    return this.formBuilder.group({
      name: ['', Validators.required],
      template: ['', Validators.required],
    });
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
    this.data = this.data || new Pipeline();

    const steps = [];
    if (this.data.spec && this.data.spec.steps) {
      this.data.spec.steps.forEach(s => {
        const step = this.formBuilder.group({
          name: [s.name, Validators.required],
          template: [s.template, Validators.required],
        });
        steps.push(step);
      });
    }

    this.form = this.formBuilder.group({
      name: [this.data.name, Validators.required],
      namespaceId: [this.selectedNamespaceService.namespaceId, Validators.required],
      steps: this.formBuilder.array(steps),
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(data: Partial<Pipeline>) {
    if (this.data._id) {
      data._id = this.data._id;
      await this.pipelineService.update(data);
    } else {
      await this.pipelineService.create(data);
    }

    this.matSnackBar.open('Pipeline saved successfully.');
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }
}
