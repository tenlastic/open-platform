import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Chance } from 'chance';

import { PatchService, UnityService } from '../../../core/services';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { PatchStatusComponent } from './patch-status.component';

const chance = new Chance();

describe('PatchStatusComponent UI', () => {
  let fixture: ComponentFixture<PatchStatusComponent>;
  let patchService: PatchService;
  let unityService: UnityService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, SharedModule],
    });

    fixture = TestBed.createComponent(PatchStatusComponent);

    patchService = TestBed.get(PatchService);
    unityService = TestBed.get(UnityService);

    unityService.isLauncher = true;
  }));

  it('shows the status message', () => {
    const statusMessage = chance.hash();
    patchService.statusMessage = statusMessage;

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(statusMessage);
  });

  it('shows the file message', () => {
    const fileMessage = chance.hash();
    patchService.fileMessage = fileMessage;

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(fileMessage);
  });

  it('shows the file count', () => {
    const fileCount = chance.integer({ max: 25, min: 0 });
    patchService.fileCount = fileCount;

    const totalFileCount = chance.integer({ max: 50, min: 25 });
    patchService.totalFileCount = totalFileCount;

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(`${fileCount} / ${totalFileCount}`);
  });
});
