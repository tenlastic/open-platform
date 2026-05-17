import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { GameServerTemplateModel, GameServerTemplateService, IGameServer } from '@tenlastic/http';

import { FormService, TextareaService } from '../../../../../../core/services';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  standalone: false,
  styleUrls: ['./json-page.component.scss'],
  templateUrl: 'json-page.component.html',
})
export class GameServerTemplatesJsonPageComponent implements OnInit {
  public data: GameServerTemplateModel;
  public errors: string[] = [];
  public form: FormGroup;
  public isSaving: boolean;

  private namespaceId: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private gameServerTemplateService: GameServerTemplateService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;

      if (params.gameServerTemplateId !== 'new') {
        this.data = await this.gameServerTemplateService.findOne(
          params.namespaceId,
          params.gameServerTemplateId,
        );
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
    this.isSaving = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.isSaving = false;
      return;
    }

    const json = this.form.get('json').value;
    const values = JSON.parse(json) as GameServerTemplateModel;

    values._id = this.data._id;
    values.namespaceId = this.namespaceId;

    try {
      this.data = await this.upsert(values);
    } catch (e) {
      this.errors = this.formService.handleHttpError(e);
    }

    this.isSaving = false;
  }

  private setupForm() {
    this.data ??= new GameServerTemplateModel({
      buildId: '',
      cpu: IGameServer.Cpu[0].value,
      description: '',
      memory: IGameServer.Memory[0].value,
      metadata: {},
      name: '',
      ports: [],
      preemptible: true,
    });

    const keys = [
      'buildId',
      'cpu',
      'description',
      'memory',
      'metadata',
      'name',
      'ports',
      'preemptible',
      'probes',
      'secrets',
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

  private async upsert(values: Partial<GameServerTemplateModel>) {
    const result = values._id
      ? await this.gameServerTemplateService.update(this.namespaceId, values._id, values)
      : await this.gameServerTemplateService.create(this.namespaceId, values);

    this.matSnackBar.open(`Game Server Template saved successfully.`);
    this.router.navigate(['../../', result._id], { relativeTo: this.activatedRoute });

    return result;
  }
}
