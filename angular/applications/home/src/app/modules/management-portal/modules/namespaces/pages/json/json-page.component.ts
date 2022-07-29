import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Namespace, NamespaceService } from '@tenlastic/ng-http';

import { FormService, TextareaService } from '../../../../../../core/services';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class NamespacesJsonPageComponent implements OnInit {
  public data: Namespace;
  public errors: string[] = [];
  public form: FormGroup;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private namespaceService: NamespaceService,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      const _id = params.namespaceId;

      if (_id !== 'new') {
        this.data = await this.namespaceService.findOne(_id);
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
    const values = JSON.parse(json) as Namespace;

    values._id = this.data._id;

    try {
      this.data = await this.formService.upsert(this.namespaceService, values, { path: '../../' });
    } catch (e) {
      this.errors = this.formService.handleHttpError(e);
    }
  }

  private setupForm(): void {
    this.data ??= new Namespace({
      limits: {
        builds: {
          count: 0,
          size: 0,
        },
        gameServers: {
          cpu: 0,
          memory: 0,
          preemptible: false,
        },
        queues: {
          cpu: 0,
          memory: 0,
          preemptible: false,
          replicas: 0,
        },
        storefronts: {
          count: 0,
          images: 0,
          public: 0,
          size: 0,
          videos: 0,
        },
        workflows: {
          count: 0,
          cpu: 0,
          memory: 0,
          parallelism: 0,
          preemptible: false,
          storage: 0,
        },
      },
      name: '',
    });

    const keys = ['limits', 'name'];
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
