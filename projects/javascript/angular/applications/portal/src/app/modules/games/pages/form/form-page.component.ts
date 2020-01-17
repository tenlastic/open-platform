import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';
import { Game, GameService } from '@tenlastic/ng-http';

import { SelectedNamespaceService } from '../../../../core/services';

@Component({
  templateUrl: 'form-page.component.html',
  styleUrls: ['./form-page.component.scss'],
})
export class GamesFormPageComponent implements OnInit {
  public data: Game;
  public error: string;
  public form: FormGroup;

  constructor(
    private activatedRoute: ActivatedRoute,
    private formBuilder: FormBuilder,
    private gameService: GameService,
    public identityService: IdentityService,
    private router: Router,
    public selectedNamespaceService: SelectedNamespaceService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      const slug = params.get('slug');

      if (slug !== 'new') {
        this.data = await this.gameService.findOne(slug);
      }

      this.setupForm();
    });
  }

  public async save() {
    if (this.form.invalid) {
      this.form.get('description').markAsTouched();
      this.form.get('slug').markAsTouched();
      this.form.get('subtitle').markAsTouched();
      this.form.get('title').markAsTouched();

      return;
    }

    const values: Partial<Game> = {
      description: this.form.get('description').value,
      namespaceId: this.selectedNamespaceService.namespaceId,
      slug: this.form.get('slug').value,
      subtitle: this.form.get('subtitle').value,
      title: this.form.get('title').value,
    };

    if (this.data._id) {
      this.update(values);
    } else {
      this.create(values);
    }
  }

  private async create(data: Partial<Game>) {
    try {
      await this.gameService.create(data);
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That slug is already taken.';
    }
  }

  private setupForm(): void {
    this.data = this.data || new Game();

    this.form = this.formBuilder.group({
      description: [this.data.description, Validators.required],
      slug: [this.data.slug, Validators.required],
      subtitle: [this.data.subtitle],
      title: [this.data.title, Validators.required],
    });

    this.form.valueChanges.subscribe(() => (this.error = null));
  }

  private async update(data: Partial<Game>) {
    data._id = this.data._id;

    try {
      await this.gameService.update(data);
      this.router.navigate(['../'], { relativeTo: this.activatedRoute });
    } catch (e) {
      this.error = 'That slug is already taken.';
    }
  }
}
