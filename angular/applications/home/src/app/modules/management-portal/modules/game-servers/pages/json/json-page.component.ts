import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { GameServer, GameServerService, IGameServer } from '@tenlastic/ng-http';

import { FormService, TextareaService } from '../../../../../../core/services';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class GameServersJsonPageComponent implements OnInit {
  public data: GameServer;
  public errors: string[] = [];
  public form: FormGroup;

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private gameServerService: GameServerService,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      if (params.gameServerId !== 'new') {
        this.data = await this.gameServerService.findOne(params.gameServerId);
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
    const values = JSON.parse(json) as GameServer;

    values._id = this.data._id;
    values.namespaceId = this.params.namespaceId;
    values.persistent = true;

    try {
      this.data = await this.formService.upsert(this.gameServerService, values, {
        name: 'Game Server',
      });
    } catch (e) {
      this.formService.handleHttpError(e);
    }
  }

  private setupForm(): void {
    this.data ??= new GameServer({
      authorizedUserIds: [],
      buildId: '',
      cpu: IGameServer.Cpu[0].value,
      description: '',
      memory: IGameServer.Memory[0].value,
      metadata: {},
      name: '',
      preemptible: true,
    });

    const keys = [
      'authorizedUserIds',
      'buildId',
      'cpu',
      'description',
      'memory',
      'metadata',
      'name',
      'preemptible',
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
