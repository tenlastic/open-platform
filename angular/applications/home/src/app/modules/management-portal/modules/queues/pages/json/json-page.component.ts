import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { Queue, QueueService, IQueue, IGameServer } from '@tenlastic/ng-http';

import { FormService, TextareaService } from '../../../../../../core/services';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class QueuesJsonPageComponent implements OnInit {
  public data: Queue;
  public errors: string[] = [];
  public form: FormGroup;

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private queueService: QueueService,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      if (params.queueId !== 'new') {
        this.data = await this.queueService.findOne(params.queueId);
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
    const values = JSON.parse(json) as Queue;

    values.namespaceId = this.params.namespaceId;

    try {
      this.data = await this.formService.upsert(this.queueService, values);
    } catch (e) {
      this.formService.handleHttpError(e);
    }
  }

  private setupForm(): void {
    this.data ??= new Queue({
      buildId: '',
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
      metadata: {},
      name: '',
      preemptible: true,
      replicas: IQueue.Replicas[0].value,
      teams: 2,
      usersPerTeam: 1,
    });

    const keys = [
      'buildId',
      'cpu',
      'description',
      'gameServerTemplate',
      'memory',
      'metadata',
      'name',
      'preemptible',
      'replicas',
      'teams',
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
}
