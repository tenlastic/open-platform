import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { firstValueFrom, Subscription } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Directive({
  selector: '[appResponsive]',
  standalone: false,
})
export class ResponsiveDirective implements OnDestroy, OnInit {
  @Input('appResponsive') mode: 'desktop' | 'mobile' = 'desktop';

  private isMobile$ = this.breakpointObserver.observe([Breakpoints.Handset]).pipe(
    map((result) => result.matches),
    shareReplay(),
  );
  private currentView?: 'desktop' | 'mobile';
  private subscription: Subscription;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private tpl: TemplateRef<unknown>,
    private vcr: ViewContainerRef,
  ) {}

  public async ngOnInit() {
    const initialIsMobile = await firstValueFrom(this.isMobile$);
    this.setVisibility(initialIsMobile);

    this.subscription = this.isMobile$.subscribe((isMobile) => this.setVisibility(isMobile));
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private setVisibility(isMobile: boolean) {
    const isVisibleOnDesktop = !isMobile && this.mode === 'desktop';
    const isVisibleOnMobile = isMobile && this.mode === 'mobile';
    const isVisible = isVisibleOnDesktop || isVisibleOnMobile;

    if (isVisible && this.currentView !== this.mode) {
      this.vcr.clear();
      this.vcr.createEmbeddedView(this.tpl);
      this.currentView = this.mode;
    }

    if (!isVisible && this.currentView) {
      this.vcr.clear();
      this.currentView = undefined;
    }
  }
}
