import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageSwitcherComponent } from './language-switcher.component';
import { TranslationService } from '../../../core/services/translation.service';

describe('LanguageSwitcherComponent', () => {
  let component: LanguageSwitcherComponent;
  let fixture: ComponentFixture<LanguageSwitcherComponent>;
  let translationService: TranslationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSwitcherComponent],
      providers: [TranslationService]
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSwitcherComponent);
    component = fixture.componentInstance;
    translationService = TestBed.inject(TranslationService);
    fixture.detectChanges();
  });

  it('should toggle isOpen when toggle() is called', () => {
    expect(component.isOpen()).toBeFalse();
    component.toggle();
    expect(component.isOpen()).toBeTrue();
  });

  it('should call setLanguage on the service when setLanguage is called', () => {
    spyOn(translationService, 'setLanguage');
    component.setLanguage('kh');
    expect(translationService.setLanguage).toHaveBeenCalledWith('kh');
    expect(component.isOpen()).toBeFalse();
  });
});
