import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { GameServer, GameServerService, IGameServer } from '@tenlastic/ng-http';

import {
  IdentityService,
  SelectedNamespaceService,
  TextareaService,
} from '../../../../../../core/services';
import {
  BreadcrumbsComponentBreadcrumb,
  PromptComponent,
} from '../../../../../../shared/components';
import { jsonValidator } from '../../../../../../shared/validators';

@Component({
  templateUrl: 'json-page.component.html',
  styleUrls: ['./json-page.component.scss'],
})
export class GameServersJsonPageComponent implements OnInit {
  public breadcrumbs: BreadcrumbsComponentBreadcrumb[] = [];
  public data: GameServer;
  public errors: string[] = [];
  public form: FormGroup;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private gameServerService: GameServerService,
    public identityService: IdentityService,
    private matDialog: MatDialog,
    private matSnackBar: MatSnackBar,
    private router: Router,
    private selectedNamespaceService: SelectedNamespaceService,
    private textareaService: TextareaService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async (params) => {
      const _id = params.get('_id');

      this.breadcrumbs = [
        { label: 'Game Servers', link: '../../' },
        { label: _id === 'new' ? 'Create Game Server' : 'Edit Game Server', link: '../' },
        { label: _id === 'new' ? 'Create Game Server as JSON' : 'Edit Game Server as JSON' },
      ];

      if (_id !== 'new') {
        this.data = await this.gameServerService.findOne(_id);
      }

      this.setupForm();
    });
  }

  public navigateToForm() {
    if (this.form.dirty) {
      const dialogRef = this.matDialog.open(PromptComponent, {
        data: {
          buttons: [
            { color: 'primary', label: 'No' },
            { color: 'accent', label: 'Yes' },
          ],
          message: 'Changes will not be saved. Is this OK?',
        },
      });

      dialogRef.afterClosed().subscribe(async (result) => {
        if (result === 'Yes') {
          this.router.navigate([`../`], { relativeTo: this.activatedRoute });
        }
      });
    } else {
      this.router.navigate([`../`], { relativeTo: this.activatedRoute });
    }
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

    values.namespaceId = this.selectedNamespaceService.namespaceId;
    values.persistent = true;

    try {
      await this.upsert(values);
    } catch (e) {
      this.handleHttpError(e);
    }
  }

  private async handleHttpError(err: HttpErrorResponse) {
    this.errors = err.error.errors.map((e) => {
      if (e.name === 'CastError' || e.name === 'ValidatorError') {
        return `(${e.path}) ${e.message}`;
      } else if (e.name === 'UniqueError') {
        const combination = e.paths.length > 1 ? 'combination ' : '';
        return `${e.paths.join(' / ')} ${combination}is not unique: ${e.values.join(' / ')}.`;
      } else {
        return e.message;
      }
    });
  }

  private setupForm(): void {
    this.data ??= new GameServer({
      authorizedUserIds: [],
      buildId: '',
      cpu: IGameServer.Cpu[0].value,
      description: '',
      gameId: '',
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
      'gameId',
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

  private async upsert(data: Partial<GameServer>) {
    let result: GameServer;

    if (this.data._id) {
      data._id = this.data._id;
      result = await this.gameServerService.update(data);
    } else {
      result = await this.gameServerService.create(data);
    }

    this.matSnackBar.open('GameServer saved successfully.');
    this.router.navigate([`../../${result._id}`], { relativeTo: this.activatedRoute });
  }
}