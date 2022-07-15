import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { IWorkflow, Workflow, WorkflowService } from '@tenlastic/ng-http';

import { FormService, TextareaService } from '../../../../../../core/services';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class WorkflowsJsonPageComponent implements OnInit {
  public data: Workflow;
  public errors: string[] = [];
  public form: FormGroup;

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private textareaService: TextareaService,
    private workflowService: WorkflowService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      if (params.workflowId !== 'new') {
        this.data = await this.workflowService.findOne(params.workflowId);
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
    const values = JSON.parse(json) as Workflow;

    values._id = this.data._id;
    values.namespaceId = this.params.namespaceId;

    try {
      this.data = await this.formService.upsert(this.workflowService, values);
    } catch (e) {
      this.formService.handleHttpError(e);
    }
  }

  private setupForm(): void {
    this.data ??= new Workflow({
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
}
