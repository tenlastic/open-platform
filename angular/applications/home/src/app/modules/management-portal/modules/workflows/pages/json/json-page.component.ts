import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { IWorkflow, WorkflowModel, WorkflowService } from '@tenlastic/http';

import { FormService, TextareaService } from '../../../../../../core/services';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class WorkflowsJsonPageComponent implements OnInit {
  public data: WorkflowModel;
  public errors: string[] = [];
  public form: FormGroup;

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private textareaService: TextareaService,
    private workflowService: WorkflowService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      if (params.workflowId !== 'new') {
        this.data = await this.workflowService.findOne(params.namespaceId, params.workflowId);
      }

      this.setupForm();
    });
  }

  public navigateToForm() {
    this.formService.navigateToForm(this.form);
  }

  public onKeyDown(event: any) {
    this.textareaService.onKeyDown(event);
  }

  public onKeyUp(event: any) {
    this.textareaService.onKeyUp(event);
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const json = this.form.get('json').value;
    const values = JSON.parse(json) as WorkflowModel;

    values._id = this.data._id;
    values.namespaceId = this.params.namespaceId;

    try {
      this.data = await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e);
    }
  }

  private setupForm(): void {
    this.data ??= new WorkflowModel({
      cpu: IWorkflow.Cpu[0].value,
      memory: IWorkflow.Memory[0].value,
      name: '',
      preemptible: true,
      spec: { entrypoint: 'entrypoint', templates: [{ name: 'entrypoint' }] },
      storage: IWorkflow.Storage[0].value,
    });

    const keys = ['cpu', 'memory', 'name', 'preemptible', 'spec', 'storage'];
    const data = Object.keys(this.data)
      .filter((key) => keys.includes(key))
      .sort()
      .reduce((a, b) => Object.assign(a, { [b]: this.data[b] }), {});

    this.form = this.formBuilder.group({
      json: [JSON.stringify(data, null, 4), [Validators.required, jsonValidator]],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(values: Partial<WorkflowModel>) {
    const result = values._id
      ? await this.workflowService.update(this.params.namespaceId, values._id, values)
      : await this.workflowService.create(this.params.namespaceId, values);

    this.matSnackBar.open(`Workflow saved successfully.`);
    this.router.navigate(['../../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
