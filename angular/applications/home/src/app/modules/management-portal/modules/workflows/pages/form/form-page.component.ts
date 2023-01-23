import { ENTER } from '@angular/cdk/keycodes';
import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  IAuthorization,
  IWorkflow,
  NamespaceModel,
  NamespaceService,
  WorkflowModel,
  WorkflowQuery,
  WorkflowService,
} from '@tenlastic/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { FormService, IdentityService } from '../../../../../../core/services';

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
  public $data: Observable<WorkflowModel>;
  public get cpus() {
    return this.namespace.limits.cpu
      ? IWorkflow.Cpu.filter((r) => r.value <= this.namespace.limits.cpu)
      : IWorkflow.Cpu;
  }
  public data: WorkflowModel;
  public dataSource = new MatTreeNestedDataSource<StatusNode>();
  public errors: string[] = [];
  public form: FormGroup;
  public hasWriteAuthorization: boolean;
  public isSaving: boolean;
  public get memories() {
    return this.namespace.limits.memory
      ? IWorkflow.Memory.filter((r) => r.value <= this.namespace.limits.memory)
      : IWorkflow.Memory;
  }
  public get parallelisms() {
    return IWorkflow.Parallelisms;
  }
  public readonly separatorKeysCodes: number[] = [ENTER];
  public get storages() {
    return this.namespace.limits.storage
      ? IWorkflow.Storage.filter((r) => r.value <= this.namespace.limits.storage)
      : IWorkflow.Storage;
  }
  public treeControl = new NestedTreeControl<StatusNode>((node) => node.children);

  private namespace: NamespaceModel;
  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private namespaceService: NamespaceService,
    private router: Router,
    private workflowQuery: WorkflowQuery,
    private workflowService: WorkflowService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      const roles = [IAuthorization.Role.QueuesWrite];
      const userId = this.identityService.user?._id;
      this.hasWriteAuthorization =
        this.authorizationQuery.hasRoles(null, roles, userId) ||
        this.authorizationQuery.hasRoles(params.namespaceId, roles, userId);

      this.namespace = await this.namespaceService.findOne(params.namespaceId);

      if (params.workflowId !== 'new') {
        this.data = await this.workflowService.findOne(params.namespaceId, params.workflowId);
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

  public navigateToJson() {
    this.formService.navigateToJson(this.form);
  }

  public removeTemplate(index: number) {
    const formArray = this.form.get('templates') as FormArray;
    formArray.removeAt(index);
  }

  public async save() {
    this.errors = [];
    this.isSaving = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.isSaving = false;
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
    const templates = raw.templates.map((t) => {
      const sidecars = t.sidecars.map((s) => {
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

    const values: Partial<WorkflowModel> = {
      _id: this.data._id,
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
      this.data = await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e, { name: 'Name', namespaceId: 'Namespace' });
    }

    this.isSaving = false;
  }

  public showStatusNode(node: StatusNode) {
    return ['Pod', 'Workflow'].includes(node.type);
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
    group.valueChanges.subscribe((value) => {
      const name = value.name.replace(/[^A-Za-z0-9\-]/g, '');
      group.get('name').setValue(name, { emitEvent: false });
    });

    return group;
  }

  private getEnvFormArray(env: IWorkflow.Env[]) {
    if (!env) {
      return this.formBuilder.array([]);
    }

    const groups = env.map((e) =>
      this.formBuilder.group({
        name: [e.name, Validators.required],
        value: [e.value, Validators.required],
      }),
    );

    return this.formBuilder.array(groups);
  }

  private getSidecarsFormArray(sidecars: IWorkflow.Sidecar[]) {
    if (!sidecars) {
      return this.formBuilder.array([]);
    }

    const groups = sidecars.map((s) =>
      this.formBuilder.group({
        args: this.formBuilder.array(s.args || []),
        command: this.formBuilder.array(s.command || []),
        env: this.getEnvFormArray(s.env),
        image: [s.image, Validators.required],
        name: [s.name],
      }),
    );

    return this.formBuilder.array(groups);
  }

  private getTemplatesFormArray(templates: IWorkflow.Template[]) {
    if (!templates) {
      const group = this.getDefaultTemplateFormGroup();
      return this.formBuilder.array([group]);
    }

    const groups = this.data.spec.templates
      .filter((t) => t.script)
      .map((t) =>
        this.formBuilder.group({
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
        }),
      );

    return this.formBuilder.array(groups);
  }

  private setupForm() {
    this.data ??= new WorkflowModel();

    this.form = this.formBuilder.group({
      cpu: [this.data.cpu || this.cpus[0].value],
      memory: [this.data.memory || this.memories[0].value],
      name: [this.data.name, Validators.required],
      namespaceId: [this.params.namespaceId, Validators.required],
      parallelism: [(this.data.spec && this.data.spec.parallelism) || this.parallelisms[0].value],
      preemptible: [this.data.preemptible === false ? false : true],
      storage: [this.data.storage || this.storages[0].value],
      templates: this.getTemplatesFormArray(this.data.spec && this.data.spec.templates),
    });

    if (!this.hasWriteAuthorization) {
      this.form.disable({ emitEvent: false });
    }

    if (this.data._id) {
      this.form.disable({ emitEvent: false });

      this.$data = this.workflowQuery.selectAll({ filterBy: (w) => w._id === this.data._id }).pipe(
        map(([workflow]) => {
          this.dataSource.data = workflow.getNestedStatusNodes();
          return workflow;
        }),
      );
    }

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(values: Partial<WorkflowModel>) {
    const result = values._id
      ? await this.workflowService.update(this.params.namespaceId, values._id, values)
      : await this.workflowService.create(this.params.namespaceId, values);

    this.matSnackBar.open(`Workflow saved successfully.`);
    this.router.navigate(['../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
