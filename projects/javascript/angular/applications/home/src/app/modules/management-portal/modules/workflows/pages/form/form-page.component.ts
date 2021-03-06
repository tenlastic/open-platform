import { ENTER } from '@angular/cdk/keycodes';
import { NestedTreeControl } from '@angular/cdk/tree';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { ActivatedRoute, Router } from '@angular/router';
import { IWorkflow, Workflow, WorkflowQuery, WorkflowService } from '@tenlastic/ng-http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';

interface StatusNode {
  children?: StatusNode[];
  displayName?: string;
  finishedAt?: Date;
  message?: string;
  name?: string;
  phase?: string;
  startedAt?: Date;
  type?: string;
}

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class WorkflowsFormPageComponent implements OnInit {
  public $data: Observable<Workflow>;
  public get cpus() {
    const limits = this.selectedNamespaceService.namespace.limits.workflows;
    const limit = limits.cpu ? limits.cpu : Infinity;
    return limits.cpu ? IWorkflow.Cpu.filter(r => r.value <= limit) : IWorkflow.Cpu;
  }
  public data: Workflow;
  public dataSource = new MatTreeNestedDataSource<StatusNode>();
  public errors: string[] = [];
  public form: FormGroup;
  public get memories() {
    const limits = this.selectedNamespaceService.namespace.limits.workflows;
    const limit = limits.memory ? limits.memory : Infinity;
    return limits.memory ? IWorkflow.Memory.filter(r => r.value <= limit) : IWorkflow.Memory;
  }
  public get parallelisms() {
    const limits = this.selectedNamespaceService.namespace.limits.workflows;
    const limit = limits.parallelism ? limits.parallelism : Infinity;
    return limits.parallelism
      ? IWorkflow.Parallelisms.filter(r => r.value <= limit)
      : IWorkflow.Parallelisms;
  }
  public readonly separatorKeysCodes: number[] = [ENTER];
  public get storages() {
    const limits = this.selectedNamespaceService.namespace.limits.workflows;
    const limit = limits.storage ? limits.storage : Infinity;
    return limits.storage ? IWorkflow.Storage.filter(r => r.value <= limit) : IWorkflow.Storage;
  }
  public treeControl = new NestedTreeControl<StatusNode>(node => node.children);

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    public identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private workflowQuery: WorkflowQuery,
    private workflowService: WorkflowService,
    private router: Router,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const _id = params.get('_id');
      if (_id !== 'new') {
        this.data = await this.workflowService.findOne(_id);
      }

      this.setupForm();
    });
  }

  public addTemplate() {
    const template = this.getDefaultTemplateFormGroup();
    const formArray = this.form.get('templates') as FormArray;

    formArray.push(template);
  }

  public hasChild(_: number, node: StatusNode) {
    return !!node.children && node.children.length > 0;
  }

  public moveTemplate(index: number, change: number) {
    const roles = this.form.get('templates') as FormArray;

    if (index + change < 0 || index + change >= roles.length) {
      return;
    }

    const role = roles.at(index);

    roles.removeAt(index);
    roles.insert(index + change, role);
  }

  public removeTemplate(index: number) {
    const formArray = this.form.get('templates') as FormArray;
    formArray.removeAt(index);
  }

  public async save() {
    this.errors = [];

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const tasks = raw.templates.map((t, i) => {
      const task: any = { name: t.name, template: t.name };

      if (i > 0) {
        const previousTemplate = raw.templates[i - 1];
        task.dependencies = [previousTemplate.name];
      }

      return task;
    });
    const templates = raw.templates.map(t => {
      const sidecars = t.sidecars.map(s => {
        const sidecar: IWorkflow.Sidecar = {
          env: s.env,
          image: s.image,
          name: s.image.split(':')[0],
        };

        if (s.args.length > 0) {
          sidecar.args = s.args;
        }

        if (s.command.length > 0) {
          sidecar.command = s.command;
        }

        return sidecar;
      });

      const template: IWorkflow.Template = {
        name: t.name,
        script: {
          env: t.script.env,
          image: t.script.image,
          source: t.script.source,
          workingDir: t.script.workingDir,
        },
        sidecars,
      };

      if (t.script.args.length > 0) {
        template.script.args = t.script.args;
      }

      if (t.script.command.length > 0) {
        template.script.command = t.script.command;
      }

      return template;
    });

    const values: Partial<Workflow> = {
      cpu: raw.cpu,
      memory: raw.memory,
      name: raw.name,
      namespaceId: raw.namespaceId,
      preemptible: raw.preemptible,
      spec: {
        entrypoint: 'entrypoint',
        parallelism: raw.parallelism,
        templates: [
          {
            dag: { tasks },
            name: 'entrypoint',
          },
          ...templates,
        ],
      },
      storage: raw.storage,
    };

    try {
      await this.create(values);
    } catch (e) {
      this.handleHttpError(e, { name: 'Name', namespaceId: 'Namespace' });
    }
  }

  private async create(data: Partial<Workflow>) {
    const result = await this.workflowService.create(data);

    this.matSnackBar.open('Workflow saved successfully.');
    this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });
  }

  private getDefaultTemplateFormGroup() {
    const group = this.formBuilder.group({
      name: ['', Validators.required],
      script: this.formBuilder.group({
        args: this.formBuilder.array([]),
        command: this.formBuilder.array([], Validators.required),
        env: this.formBuilder.array([]),
        image: ['', Validators.required],
        source: ['', Validators.required],
      }),
      sidecars: this.formBuilder.array([]),
    });

    // Only allow alphanumeric characters and dashes.
    group.valueChanges.subscribe(value => {
      const name = value.name.replace(/[^A-Za-z0-9\-]/g, '');
      group.get('name').setValue(name, { emitEvent: false });
    });

    return group;
  }

  private getEnvFormArray(env: IWorkflow.Env[]) {
    const formArray = this.formBuilder.array([]);
    if (!env) {
      return formArray;
    }

    for (const e of env) {
      const formGroup = this.formBuilder.group({
        name: [e.name, Validators.required],
        value: [e.value, Validators.required],
      });
      formArray.push(formGroup);
    }

    return formArray;
  }

  private getSidecarsFormArray(sidecars: IWorkflow.Sidecar[]) {
    const formArray = this.formBuilder.array([]);
    if (!sidecars) {
      return formArray;
    }

    for (const sidecar of sidecars) {
      const formGroup = this.formBuilder.group({
        args: this.formBuilder.array(sidecar.args || []),
        command: this.formBuilder.array(sidecar.command || []),
        env: this.getEnvFormArray(sidecar.env),
        image: [sidecar.image, Validators.required],
        name: [sidecar.name],
      });
      formArray.push(formGroup);
    }

    return formArray;
  }

  private getTemplatesFormArray(templates: IWorkflow.Template[]) {
    const formArray = this.formBuilder.array([]);
    if (!templates) {
      formArray.push(this.getDefaultTemplateFormGroup());
      return formArray;
    }

    this.data.spec.templates
      .filter(t => t.script)
      .forEach(t => {
        const template = this.formBuilder.group({
          name: [t.name, Validators.required],
          script: this.formBuilder.group({
            args: this.formBuilder.array(t.script.args || []),
            command: this.formBuilder.array(t.script.command || [], Validators.required),
            env: this.getEnvFormArray(t.script.env),
            image: [t.script.image, Validators.required],
            source: [t.script.source, Validators.required],
            workingDir: [t.script.workingDir],
          }),
          sidecars: this.getSidecarsFormArray(t.sidecars),
        });
        formArray.push(template);
      });

    return formArray;
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
    this.data = this.data || new Workflow();

    this.form = this.formBuilder.group({
      cpu: [this.data.cpu || this.cpus[0].value],
      memory: [this.data.memory || this.memories[0].value],
      name: [this.data.name, Validators.required],
      namespaceId: [this.selectedNamespaceService.namespaceId, Validators.required],
      parallelism: [(this.data.spec && this.data.spec.parallelism) || this.parallelisms[0].value],
      preemptible: [this.data.preemptible === false ? false : true],
      storage: [this.data.storage || this.storages[0].value],
      templates: this.getTemplatesFormArray(this.data.spec && this.data.spec.templates),
    });

    if (this.data._id) {
      this.form.disable({ emitEvent: false });

      this.$data = this.workflowQuery.selectAll({ filterBy: w => w._id === this.data._id }).pipe(
        map(workflows => {
          const workflow = new Workflow(workflows[0]);
          workflow.status = workflow.status || { nodes: [], phase: 'Pending' };
          this.dataSource.data = workflow.getNestedStatusNodes();
          return workflow;
        }),
      );
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }
}
