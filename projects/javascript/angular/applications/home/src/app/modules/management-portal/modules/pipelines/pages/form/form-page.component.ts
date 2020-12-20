import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent, MatSnackBar } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { IPipeline, Pipeline, PipelineService } from '@tenlastic/ng-http';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class PipelinesFormPageComponent implements OnInit {
  public data: Pipeline;
  public errors: string[] = [];
  public form: FormGroup;
  public readonly separatorKeysCodes: number[] = [ENTER];

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

  public addTemplate() {
    const template = this.getDefaultTemplateFormGroup();
    const formArray = this.form.get('templates') as FormArray;

    formArray.push(template);
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const steps = raw.templates.map(t => ({ name: t.name, template: t.name }));
    const templates = raw.templates.map(t => {
      const sidecars = t.sidecars.map(s => {
        const sidecar: IPipeline.Sidecar = {
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

      const template: IPipeline.Template = {
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

    const values: Partial<Pipeline> = {
      isPreemptible: raw.isPreemptible,
      name: raw.name,
      namespaceId: raw.namespaceId,
      spec: {
        steps,
        templates,
      },
    };

    try {
      await this.upsert(values);
    } catch (e) {
      this.handleHttpError(e, { name: 'Name', namespaceId: 'Namespace' });
    }
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
        workingDir: ['/usr/src/workspace/'],
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

    const templates = [];
    if (this.data.spec && this.data.spec.templates) {
      this.data.spec.templates.forEach(t => {
        const env = [];
        if (t.script.env) {
          t.script.env.forEach(e => {
            const formGroup = this.formBuilder.group({
              name: [e.name, Validators.required],
              value: [e.value, Validators.required],
            });
            env.push(formGroup);
          });
        }

        const sidecars = [];
        if (t.sidecars) {
          t.sidecars.forEach(s => {
            const formGroup = this.formBuilder.group({
              args: this.formBuilder.array(s.args),
              command: this.formBuilder.array(s.command),
              env: this.formBuilder.array(s.env),
              image: [s.image, Validators.required],
              name: [s.name],
            });
            sidecars.push(formGroup);
          });
        }

        const template = this.formBuilder.group({
          name: [t.name, Validators.required],
          script: this.formBuilder.group({
            args: this.formBuilder.array(t.script.args || []),
            command: this.formBuilder.array(t.script.args || [], Validators.required),
            env: this.formBuilder.array(env),
            image: [t.script.image, Validators.required],
            source: [t.script.source, Validators.required],
            workingDir: [t.script.workingDir],
          }),
          sidecars: this.formBuilder.array(sidecars),
        });
        templates.push(template);
      });
    }

    this.form = this.formBuilder.group({
      isPreemptible: [this.data.isPreemptible || true],
      name: [this.data.name, Validators.required],
      namespaceId: [this.selectedNamespaceService.namespaceId, Validators.required],
      steps: this.formBuilder.array(steps),
      templates: this.formBuilder.array(templates),
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
