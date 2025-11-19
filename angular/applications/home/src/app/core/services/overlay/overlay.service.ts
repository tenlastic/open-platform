import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable, InjectionToken, Injector } from '@angular/core';
import { Subject, Subscription } from 'rxjs';

export const OVERLAY_DATA = new InjectionToken<unknown>('OVERLAY_DATA');
export const OVERLAY_REFERENCE = new InjectionToken<OverlayRef>('OVERLAY_REFERENCE');

export interface OverlayReference<TValue = unknown> {
  $close: Subject<TValue>;
  close: (value?: TValue) => void;
  reference: OverlayRef;
}

export interface OverlayServiceOptions<TData = unknown> {
  data?: TData;
}

@Injectable({ providedIn: 'root' })
export class OverlayService {
  constructor(private injector: Injector, private overlay: Overlay) {}

  public open<TData = unknown, TValue = void>(component: any, data?: TData) {
    const overlayRef = this.overlay.create({
      backdropClass: 'dialog-background',
      hasBackdrop: true,
      panelClass: 'dialog-content',
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
    });

    const subscription = overlayRef
      .backdropClick()
      .subscribe(() => this.close($close, overlayRef, subscription, null));

    const $close = new Subject<TValue>();
    const close = (value?: TValue) => this.close($close, overlayRef, subscription, value);

    const injector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: OVERLAY_DATA, useValue: data },
        { provide: OVERLAY_REFERENCE, useValue: { $close, close, reference: overlayRef } },
      ],
    });

    const portal = new ComponentPortal(component, null, injector);
    const componentRef = overlayRef.attach(portal);

    return { $close, close, component: componentRef.instance, reference: overlayRef };
  }

  private close(
    $close: Subject<unknown>,
    overlayRef: OverlayRef,
    subscription: Subscription,
    value?: unknown,
  ) {
    $close.next(value);
    $close.complete();
    overlayRef.dispose();
    subscription.unsubscribe();
  }
}
