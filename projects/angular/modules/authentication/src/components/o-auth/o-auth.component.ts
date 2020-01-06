import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { IdentityService } from '../../services/identity/identity.service';

@Component({ template: '<p>Logging in...</p>' })
export class OAuthComponent implements OnInit {
  constructor(
    public activatedRoute: ActivatedRoute,
    public identityService: IdentityService,
    public router: Router,
  ) {}

  public ngOnInit() {
    const accessToken = this.activatedRoute.snapshot.queryParamMap.get('accessToken');
    const refreshToken = this.activatedRoute.snapshot.queryParamMap.get('refreshToken');

    this.identityService.accessToken = accessToken;
    this.identityService.refreshToken = refreshToken;

    this.router.navigateByUrl('/');
  }
}
