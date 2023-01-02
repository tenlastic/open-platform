import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

@Directive({ selector: '[appHighlight]' })
export class HighlightDirective implements OnChanges {
  @Input() public appHighlight = true;

  constructor(private elementRef: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.appHighlight.currentValue === changes.appHighlight.previousValue) {
      return;
    }

    if (changes.appHighlight.currentValue === false) {
      this.disable();
    }
  }

  private disable() {
    let element = this.elementRef.nativeElement as Element;
    element.classList.remove('highlight');

    while (element.parentNode) {
      element = element.parentNode as Element;

      if (element.hasAttribute && element.hasAttribute('appHighlight')) {
        element.classList.add('highlight');
      }
    }
  }

  private enable() {
    let element = this.elementRef.nativeElement as Element;
    element.classList.add('highlight');

    while (element.parentNode) {
      element = element.parentNode as Element;

      if (element.hasAttribute && element.hasAttribute('appHighlight')) {
        element.classList.remove('highlight');
      }
    }
  }

  @HostListener('mouseenter')
  private onMouseEnter() {
    if (this.appHighlight === false) {
      return;
    }

    this.enable();
  }

  @HostListener('mouseleave')
  private onMouseLeave() {
    if (this.appHighlight === false) {
      return;
    }

    this.disable();
  }
}
