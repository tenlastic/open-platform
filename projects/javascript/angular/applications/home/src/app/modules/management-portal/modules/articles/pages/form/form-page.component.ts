import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Article, ArticleService, Game, GameQuery, GameService } from '@tenlastic/ng-http';
import { Observable } from 'rxjs';

import { IdentityService, SelectedNamespaceService } from '../../../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class ArticlesFormPageComponent implements OnInit {
  public $games: Observable<Game[]>;
  public data: Article;
  public errors: string[] = [];
  public form: FormGroup;
  public types = [
    { label: 'News', value: 'News' },
    { label: 'Patch Notes', value: 'Patch Notes' },
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private articleService: ArticleService,
    private formBuilder: FormBuilder,
    private gameQuery: GameQuery,
    private gameService: GameService,
    public identityService: IdentityService,
    private matSnackBar: MatSnackBar,
    private router: Router,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const _id = params.get('_id');
      if (_id !== 'new') {
        this.data = await this.articleService.findOne(_id);
      }

      this.$games = this.gameQuery.selectAll({
        filterBy: g => g.namespaceId === this.selectedNamespaceService.namespaceId,
      });
      this.gameService.find({ where: { namespaceId: this.selectedNamespaceService.namespaceId } });

      this.setupForm();
    });
  }

  public async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const values: Partial<Article> = {
      body: this.form.get('body').value,
      caption: this.form.get('caption').value,
      gameId: this.form.get('gameId').value,
      namespaceId: this.form.get('namespaceId').value,
      title: this.form.get('title').value,
      type: this.form.get('type').value,
    };

    try {
      await this.upsert(values);
    } catch (e) {
      this.handleHttpError(e, { name: 'Name' });
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

  private setupForm(): void {
    this.data = this.data || new Article();

    this.form = this.formBuilder.group({
      body: [this.data.body, Validators.required],
      caption: [this.data.caption],
      gameId: [this.data.gameId, Validators.required],
      namespaceId: [this.selectedNamespaceService.namespaceId, Validators.required],
      title: [this.data.title, Validators.required],
      type: [this.data.type || this.types[0].value, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.errors = []));
  }

  private async upsert(data: Partial<Article>) {
    if (this.data._id) {
      data._id = this.data._id;
      await this.articleService.update(data);
    } else {
      await this.articleService.create(data);
    }

    this.matSnackBar.open('Article saved successfully.');
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }
}
