import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params } from '@angular/router';
import { Game, GameService, IGame } from '@tenlastic/ng-http';

import { FormService, TextareaService } from '../../../../../../core/services';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class GamesJsonPageComponent implements OnInit {
  public data: Game;
  public errors: string[] = [];
  public form: FormGroup;

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private formService: FormService,
    private gameService: GameService,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      if (params.gameId !== 'new') {
        this.data = await this.gameService.findOne(params.gameId);
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
    const values = JSON.parse(json) as Game;

    values._id = this.data._id;
    values.namespaceId = this.params.namespaceId;

    try {
      this.data = await this.formService.upsert(this.gameService, values);
    } catch (e) {
      this.formService.handleHttpError(e);
    }
  }

  private setupForm(): void {
    this.data ??= new Game({
      access: IGame.Access.Private,
      background: '',
      description: '',
      icon: '',
      images: [],
      metadata: {},
      subtitle: '',
      title: '',
      videos: [],
    });

    const keys = [
      'access',
      'background',
      'description',
      'icon',
      'images',
      'metadata',
      'subtitle',
      'title',
      'videos',
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
