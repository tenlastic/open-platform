import { Component, OnInit } from '@angular/core';

import { ElectronService, IdentityService } from '../../../../core/services';
import { environment } from '../../../../../environments/environment';
import {
  AuthorizationService,
  Storefront,
  StorefrontQuery,
  StorefrontService,
} from '@tenlastic/ng-http';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  public $storefronts: Observable<Storefront[]>;
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
    private storefrontQuery: StorefrontQuery,
    private storefrontService: StorefrontService,
  ) {}

  public async ngOnInit() {
    this.$storefronts = this.storefrontQuery.selectAll();

    const [authorizations, storefronts] = await Promise.all([
      this.authorizationService.findUserAuthorizations(null, this.identityService.user?._id),
      this.storefrontService.find({}),
    ]);

    // If only one Storefront is available, automatically select it.
    if (storefronts.length === 1) {
      const storefront = storefronts[0];
      this.router.navigate([storefront.namespaceId], { relativeTo: this.activatedRoute });
    }
  }
}
