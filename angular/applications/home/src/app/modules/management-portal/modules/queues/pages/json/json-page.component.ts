import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { QueueModel, QueueService, IQueue, IGameServer } from '@tenlastic/http';

import { FormService, TextareaService } from '../../../../../../core/services';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class QueuesJsonPageComponent implements OnInit {
  public data: QueueModel;
  public errors: string[] = [];
  public form: FormGroup;

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private matSnackBar: MatSnackBar,
    private queueService: QueueService,
    private router: Router,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      if (params.queueId !== 'new') {
        this.data = await this.queueService.findOne(params.namespaceId, params.queueId);
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
    this.errors = [];

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const json = this.form.get('json').value;
    const values = JSON.parse(json) as QueueModel;

    values._id = this.data._id;
    values.namespaceId = this.params.namespaceId;

    try {
      this.data = await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e);
    }
  }

  private setupForm() {
    this.data ??= new QueueModel({
      cpu: IQueue.Cpu[0].value,
      description: '',
      gameServerTemplate: {
        buildId: '',
        cpu: IGameServer.Cpu[0].value,
        memory: IGameServer.Memory[0].value,
        metadata: {},
        preemptible: true,
      },
      memory: IQueue.Memory[0].value,
      name: '',
      preemptible: true,
      replicas: IQueue.Replicas[0].value,
      usersPerTeam: [1, 1],
    });

    const keys = [
      'buildId',
      'cpu',
      'description',
      'gameServerTemplate',
      'memory',
      'name',
      'preemptible',
      'replicas',
      'usersPerTeam',
    ];
    const data = Object.keys(this.data)
      .filter((key) => keys.includes(key))
      .sort()
      .reduce((a, b) => Object.assign(a, { [b]: this.data[b] }), {});

    this.form = this.formBuilder.group({
      json: [JSON.stringify(data, null, 4), [Validators.required, jsonValidator]],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(values: Partial<QueueModel>) {
    const result = values._id
      ? await this.queueService.update(this.params.namespaceId, values._id, values)
      : await this.queueService.create(this.params.namespaceId, values);

    this.matSnackBar.open(`Queue saved successfully.`);
    this.router.navigate(['../../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
