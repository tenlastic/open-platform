import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';
import { ElectronService } from '@tenlastic/ng-electron';
import { Game, GameService } from '@tenlastic/ng-http';

@Component({ templateUrl: 'information-page.component.html' })
export class InformationPageComponent implements OnInit {
  public data: Game;
  public error: string;
  public loadingMessage: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    public electronService: ElectronService,
    public identityService: IdentityService,
    private gameService: GameService,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      this.loadingMessage = 'Loading Game...';

      const slug = params.get('slug');
      if (slug) {
        this.data = await this.gameService.findOne(slug);

        this.loadingMessage = null;
      }
    });
  }
}
