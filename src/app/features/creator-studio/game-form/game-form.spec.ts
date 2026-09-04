import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { GameFormComponent } from './game-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { GAMES_DATA } from '../../../core/data/tokens';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { MockGamesDataService } from '../../../core/data/games/games.mock';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

describe('GameFormComponent (Bento Media Hub & Overhaul)', () => {
  let component: GameFormComponent;
  let fixture: ComponentFixture<GameFormComponent>;
  let mockAuthService: any;
  let mockToastService: any;
  let mockGamesData: any;

  beforeEach(async () => {
    mockAuthService = {
      currentUser: () => ({ id: 'usr_1', name: 'Alice', isCreator: true })
    };
    mockToastService = {
      show: jasmine.createSpy('show')
    };
    mockGamesData = new MockGamesDataService();

    await TestBed.configureTestingModule({
      imports: [GameFormComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
        { provide: GAMES_DATA, useValue: mockGamesData }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GameFormComponent);
    component = fixture.componentInstance;
    component.loading = false;
    fixture.detectChanges();
  });

  describe('AC-001 Bento Grid Geometry', () => {
    it('should render a unified Bento Media Hub container for all 5 slots', () => {
      const bentoHub = fixture.debugElement.query(By.css('.bento-media-hub'));
      expect(bentoHub).toBeTruthy('Bento Media Hub container is missing');
      
      const heroSlot = bentoHub.query(By.css('.hero-card'));
      const subSlots = bentoHub.queryAll(By.css('.screenshot-slot'));
      
      expect(heroSlot).toBeTruthy('Hero slot should be inside Bento hub');
      expect(subSlots.length).toBe(4, 'Should contain exactly 4 sub slots inside Bento hub');
    });
  });

  describe('AC-002 Price Tier Automation & Split', () => {
    it('should calculate 90/10 revenue split accurately on price change', () => {
      component.setPriceTier(9.99);
      fixture.detectChanges();
      
      const payoutAmount = fixture.debugElement.query(By.css('.payout-amount')).nativeElement.textContent;
      expect(payoutAmount).toContain('8.99', '90% of 9.99 should be 8.99');
    });
  });

  describe('AC-003 Reactive Readiness Checklist', () => {
    it('should update readiness strictly via computed signals without mutating state', () => {
      expect(component.readinessPercent()).toBeGreaterThanOrEqual(0);
      
      component.gameForm.patchValue({
        title: 'New Game',
        description: 'A great new game that is very fun',
        price: 9.99,
        coverImageUrl: 'some-url'
      });
      fixture.detectChanges();
      
      const percentLabel = fixture.debugElement.query(By.css('.readiness-badge')).nativeElement.textContent;
      expect(percentLabel).toContain(component.readinessPercent().toString());
    });
  });

  describe('AC-004 Sticky Footer Reachability', () => {
    it('should have a sticky footer and ensure scroll container padding prevents obscuring', () => {
      const formNode = fixture.debugElement.query(By.css('.game-editor-form')).nativeElement;
      const footerNode = fixture.debugElement.query(By.css('.form-actions-footer.sticky')).nativeElement;
      
      expect(footerNode).toBeTruthy('Sticky footer missing');
      
      const paddingBottom = window.getComputedStyle(formNode).paddingBottom;
      expect(parseInt(paddingBottom, 10)).toBeGreaterThanOrEqual(90, 'Form padding-bottom must be >= 90px to avoid footer overlap');
    });
  });
});
