import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '@tenlastic/ng-http';

@Component({ template: '<p>Logging in...</p>' })
export class OAuthComponent implements OnInit {
  constructor(
    private activatedRoute: ActivatedRoute,
    private loginService: LoginService,
    private router: Router,
  ) {}

  public ngOnInit() {
    const accessToken = this.activatedRoute.snapshot.queryParamMap.get('accessToken');
    const refreshToken = this.activatedRoute.snapshot.queryParamMap.get('refreshToken');

    if (accessToken && refreshToken) {
      this.loginService.onLogin.emit({ accessToken, refreshToken });
    } else {
      this.loginService.onLogout.emit();
    }

    this.router.navigateByUrl('/');
  }
}
