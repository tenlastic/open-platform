import { fakeAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { ElectronService, ElectronServiceMock } from '@tenlastic/ng-electron';

import { AppModule } from '../../../app.module';
import { LayoutComponent } from './layout.component';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: ElectronService,
          useClass: ElectronServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should compile', () => {
    expect(component).toBeTruthy();
  });
});
