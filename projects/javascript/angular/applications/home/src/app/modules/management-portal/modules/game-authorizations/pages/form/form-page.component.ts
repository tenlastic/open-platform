import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Game,
  GameAuthorization,
  GameAuthorizationService,
  GameQuery,
  GameService,
  IGameAuthorization,
} from '@tenlastic/ng-http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class GameAuthorizationsFormPageComponent implements OnInit {
  public $games: Observable<Game[]>;
  public data: GameAuthorization;
  public errors: string[] = [];
  public form: FormGroup;
  public statuses = [
    { label: 'Granted', value: IGameAuthorization.GameAuthorizationStatus.Granted },
    { label: 'Revoked', value: IGameAuthorization.GameAuthorizationStatus.Revoked },
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private gameAuthorizationService: GameAuthorizationService,
    private gameQuery: GameQuery,
    private gameService: GameService,
    public identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public async ngOnInit() {
    this.$games = this.gameQuery
      .selectAll({ filterBy: g => g.namespaceId === this.selectedNamespaceService.namespaceId })
      .pipe(map(games => games.map(g => new Game(g))));
    this.gameService.find({ where: { namespaceId: this.selectedNamespaceService.namespaceId } });

    this.setupForm();
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values: Partial<GameAuthorization> = {
      gameId: this.form.get('gameId').value,
      namespaceId: this.form.get('namespaceId').value,
      status: this.form.get('status').value,
      userId: this.form.get('user').value._id,
    };

    try {
      await this.create(values);
    } catch (e) {
      this.handleHttpError(e, { namespaceId: 'Namespace', userId: 'User' });
    }
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

  private async create(data: Partial<GameAuthorization>) {
    await this.gameAuthorizationService.create(data);

    this.matSnackBar.open('Game Authorization saved successfully.');
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }

  private setupForm(): void {
    this.data = this.data || new GameAuthorization();

    this.form = this.formBuilder.group({
      gameId: [this.data.gameId, Validators.required],
      namespaceId: [this.selectedNamespaceService.namespaceId, Validators.required],
      status: [
        this.data.status || IGameAuthorization.GameAuthorizationStatus.Granted,
        Validators.required,
      ],
      user: [null, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }
}
