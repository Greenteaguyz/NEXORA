import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { AlertComponent, AlertTitleDirective, AlertDescriptionDirective, AlertVariant } from './alert.component';

@Component({
  standalone: true,
  imports: [AlertComponent, AlertTitleDirective, AlertDescriptionDirective],
  template: `
    <app-alert [variant]="variant" [dismissible]="dismissible" (dismissed)="onDismissed()">
      <div alert-title>Alert Title</div>
      <div alert-description>Alert description message</div>
    </app-alert>
  `
})
class TestHostComponent {
  variant: AlertVariant = 'default';
  dismissible = false;
  dismissedCalled = false;

  onDismissed(): void {
    this.dismissedCalled = true;
  }
}

describe('AlertComponent — shadcn/ui Spec Suite', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('1. should project alert title and description content', () => {
    const titleEl = fixture.nativeElement.querySelector('.alert-title');
    const descEl = fixture.nativeElement.querySelector('.alert-description');
    expect(titleEl).toBeTruthy();
    expect(titleEl.textContent.trim()).toBe('Alert Title');
    expect(descEl).toBeTruthy();
    expect(descEl.textContent.trim()).toBe('Alert description message');
  });

  it('2. should set role="status" and aria-live="polite" for default/info/success variants', () => {
    const alertEl = fixture.nativeElement.querySelector('.steam-alert');
    expect(alertEl.getAttribute('role')).toBe('status');
    expect(alertEl.getAttribute('aria-live')).toBe('polite');

    host.variant = 'success';
    fixture.detectChanges();
    expect(alertEl.getAttribute('role')).toBe('status');
    expect(alertEl.getAttribute('aria-live')).toBe('polite');
  });

  it('3. should set role="alert" and aria-live="assertive" for destructive variant', () => {
    host.variant = 'destructive';
    fixture.detectChanges();

    const alertEl = fixture.nativeElement.querySelector('.steam-alert');
    expect(alertEl.getAttribute('role')).toBe('alert');
    expect(alertEl.getAttribute('aria-live')).toBe('assertive');
    expect(alertEl.classList).toContain('alert-destructive');
  });

  it('4. should render dismiss button and emit dismissed output when dismissible is true', () => {
    expect(fixture.nativeElement.querySelector('.alert-close-btn')).toBeFalsy();

    host.dismissible = true;
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.alert-close-btn');
    expect(closeBtn).toBeTruthy();

    closeBtn.click();
    expect(host.dismissedCalled).toBe(true);
  });
});
