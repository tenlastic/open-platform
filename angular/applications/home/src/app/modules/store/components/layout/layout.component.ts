import { Component, OnInit } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthorizationService,
  StorefrontModel,
  StorefrontService,
  StorefrontState,
} from '@tenlastic/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ElectronService, IdentityService } from '../../../../core/services';

@Component({
  standalone: false,
  styleUrls: ['./layout.component.scss'],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit {
  public $storefronts: Observable<StorefrontModel[]>;
  public get isElectron() {
    return this.electronService.isElectron;
  }
  public launcherUrl = environment.launcherUrl;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationService: AuthorizationService,
    private electronService: ElectronService,
    private identityService: IdentityService,
    private router: Router,
    private storefrontState: StorefrontState,
    private storefrontService: StorefrontService,
  ) {}

  public async ngOnInit() {
    this.$storefronts = this.storefrontState.selectMany();

    const [, storefronts] = await Promise.all([
      this.authorizationService.findUserAuthorizations(null, this.identityService.user?._id),
      this.storefrontService.find(null, {}),
    ]);

    // If only one StorefrontModel is available, automatically select it.
    if (storefronts.length === 1 && this.router.url.endsWith('/store')) {
      const storefront = storefronts[0];
      await this.router.navigate([storefront.namespaceId], { relativeTo: this.activatedRoute });
    }
  }
}
