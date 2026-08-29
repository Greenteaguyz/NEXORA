import { Component, inject, OnInit, signal, computed, DestroyRef, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Game, CreateGameDto, UpdateGameDto } from '../../../core/models/game.model';
import { GAMES_DATA } from '../../../core/data/tokens';
import { AuthService } from '../../../core/auth/auth.service';
import { TagChipInputComponent } from '../../../shared/ui/tag-chip-input/tag-chip-input.component';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { GameFormComponentLike } from './unsaved-changes.guard';
import { compressImageFile, buildCompleteScreenshotArray, validateImagePayload } from '../../../core/utils/image-processor';
import { ToastService } from '../../../core/services/toast.service';
import { 
  evaluatePublishReadiness, 
  calculateEarningsSplit, 
  PublishReadinessReport, 
  ReadinessCheckItem 
} from '../../../core/utils/readiness-evaluator';

export interface ArtworkPreset {
  name: string;
  coverUrl: string;
  screenshots: string[];
  suggestedTags: string[];
}

@Component({
  selector: 'app-game-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule, 
    RouterLink, 
    TagChipInputComponent, 
    LoadingSpinnerComponent
  ],
  templateUrl: './game-form.component.html',
  styleUrls: ['./game-form.component.css']
})
export class GameFormComponent implements OnInit, GameFormComponentLike {
  private fb = inject(FormBuilder);
  private gamesData = inject(GAMES_DATA);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private toast = inject(ToastService);

  gameForm!: FormGroup;
  isEditMode = false;
  gameId: string | null = null;
  loading = true;
  submitting = false;
  errorMessage = '';

  /** Set right before the success navigation so the unsaved-changes guard never prompts. */
  justSaved = false;

  readonly defaultCoverFallback = 'assets/games/game-1-cover.svg';
  readonly pricePresets = [0, 4.99, 9.99, 14.99, 19.99, 29.99];

  // Drag & drop active slot tracking
  activeDragSlot = signal<string | null>(null);

  // Per-slot upload state & errors
  slotUploading = signal<{ [key: string]: boolean }>({});
  slotError = signal<{ [key: string]: string }>({});
  showUrlInput = signal<{ [key: string]: boolean }>({
    cover: false,
    ss1: false,
    ss2: false,
    ss3: false,
    ss4: false
  });

  // Fine-Grained Reactive Form State Signal
  formValues = signal({
    title: '',
    description: '',
    price: 9.99,
    coverImageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    screenshot1: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
    screenshot2: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
    screenshot3: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80',
    screenshot4: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
    samplePackageUrl: 'assets/sample-packages/game-package.zip',
    tags: ['Cyberpunk', 'Indie']
  });

  // Computed Live Derivations (AC-1021 - AC-1025)
  previewTitle = computed(() => this.formValues().title?.trim() || 'Your Game Title');
  previewPrice = computed(() => Number(this.formValues().price) || 0);
  previewCover = computed(() => this.formValues().coverImageUrl?.trim() || this.defaultCoverFallback);
  previewTags = computed(() => this.formValues().tags || []);

  titleCharCount = computed(() => (this.formValues().title || '').length);
  descCharCount = computed(() => (this.formValues().description || '').length);

  earningsSplit = computed(() => calculateEarningsSplit(this.previewPrice()));
  creatorEarnings = computed(() => this.earningsSplit().creatorEarnings);
  platformFee = computed(() => this.earningsSplit().platformFee);
  isFreeGame = computed(() => this.earningsSplit().isFree);

  // Live Publishing Readiness Checklist
  readinessReport = computed(() => evaluatePublishReadiness(this.formValues()));
  readinessPercent = computed(() => this.readinessReport().percent);
  readinessItems = computed(() => this.readinessReport().items);
  isPublishReady = computed(() => this.readinessReport().isReady);

  setPriceTier(price: number): void {
    this.gameForm.get('price')?.setValue(price);
    this.gameForm.get('price')?.markAsDirty();
    this.formValues.set({ ...this.gameForm.getRawValue() });
  }

  readonly artworkPresets: ArtworkPreset[] = [
    {
      name: 'Cyberpunk Neon Metropolis',
      coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80'
      ],
      suggestedTags: ['Cyberpunk', 'Action', 'Sci-Fi']
    },
    {
      name: 'Synthwave Highway Drift',
      coverUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=1200&auto=format&fit=crop&q=80'
      ],
      suggestedTags: ['Synthwave', 'Racing', 'Retro']
    },
    {
      name: 'Pixel Dungeon Rogue',
      coverUrl: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=800&auto=format&fit=crop&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=1200&auto=format&fit=crop&q=80'
      ],
      suggestedTags: ['Pixel Art', 'Roguelike', 'Indie']
    },
    {
      name: 'Orbital Void Strategy',
      coverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80'
      ],
      suggestedTags: ['Strategy', 'Sci-Fi', 'Space']
    }
  ];

  ngOnInit(): void {
    this.justSaved = false;
    this.initForm();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.gameId = id;
        this.loadExistingGame(id);
      } else {
        this.isEditMode = false;
        this.loading = false;
      }
    });
  }

  private initForm(): void {
    this.gameForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
      price: [9.99, [Validators.required, Validators.min(0)]],
      coverImageUrl: ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80', [Validators.required]],
      screenshot1: ['https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80', [Validators.required]],
      screenshot2: ['https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80'],
      screenshot3: ['https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80'],
      screenshot4: ['https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80'],
      samplePackageUrl: ['assets/sample-packages/game-package.zip'],
      tags: [['Cyberpunk', 'Indie'], [Validators.required]]
    });

    // Seed initial signal state
    this.formValues.set({ ...this.gameForm.getRawValue() });

    // Sync form mutations reactively to signal store
    this.gameForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formValues.set({ ...this.gameForm.getRawValue() });
      });
  }

  private loadExistingGame(id: string): void {
    this.loading = true;
    this.gamesData.getGameById(id).subscribe({
      next: (game) => {
        if (!game) {
          this.errorMessage = 'Game not found.';
          this.loading = false;
          return;
        }

        const screens = game.screenshotUrls || [];
        this.gameForm.patchValue({
          title: game.title,
          description: game.description,
          price: game.price,
          coverImageUrl: game.coverImageUrl,
          screenshot1: screens[0] || game.coverImageUrl,
          screenshot2: screens[1] || game.coverImageUrl,
          screenshot3: screens[2] || game.coverImageUrl,
          screenshot4: screens[3] || game.coverImageUrl,
          samplePackageUrl: game.samplePackageUrl || 'assets/sample-packages/game-package.zip',
          tags: game.tags
        });
        this.formValues.set({ ...this.gameForm.getRawValue() });
        this.gameForm.markAsPristine(); // Seeded edit data must not count as "dirty"
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load game data.';
        this.loading = false;
      }
    });
  }

  applyPreset(preset: ArtworkPreset): void {
    this.gameForm.patchValue({
      coverImageUrl: preset.coverUrl,
      screenshot1: preset.screenshots[0] || preset.coverUrl,
      screenshot2: preset.screenshots[1] || preset.coverUrl,
      screenshot3: preset.screenshots[2] || preset.coverUrl,
      screenshot4: preset.screenshots[3] || preset.coverUrl,
      tags: [...preset.suggestedTags]
    });
    this.formValues.set({ ...this.gameForm.getRawValue() });
    this.gameForm.markAsDirty();
  }

  toggleUrlInput(slot: string): void {
    this.showUrlInput.update(map => ({
      ...map,
      [slot]: !map[slot]
    }));
  }

  async handleFileUpload(event: Event, slot: 'cover' | 'ss1' | 'ss2' | 'ss3' | 'ss4'): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    const fieldMap: Record<string, string> = {
      cover: 'coverImageUrl',
      ss1: 'screenshot1',
      ss2: 'screenshot2',
      ss3: 'screenshot3',
      ss4: 'screenshot4'
    };
    const controlName = fieldMap[slot];

    this.slotError.update(m => ({ ...m, [slot]: '' }));
    this.slotUploading.update(m => ({ ...m, [slot]: true }));

    try {
      const dataUrl = await compressImageFile(file);
      this.gameForm.get(controlName)?.setValue(dataUrl);
      this.gameForm.get(controlName)?.markAsDirty();
      this.formValues.set({ ...this.gameForm.getRawValue() });
    } catch (err: any) {
      this.slotError.update(m => ({ ...m, [slot]: err?.message || 'Failed to process image file.' }));
    } finally {
      this.slotUploading.update(m => ({ ...m, [slot]: false }));
      input.value = '';
    }
  }

  // Flicker-free drag entry counter
  private dragCounts: Record<string, number> = {};

  @HostListener('window:dragover', ['$event'])
  onWindowDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  @HostListener('window:drop', ['$event'])
  onWindowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  onDragEnter(event: DragEvent, slot: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounts[slot] = (this.dragCounts[slot] || 0) + 1;
    if (this.dragCounts[slot] === 1) {
      this.activeDragSlot.set(slot);
    }
  }

  onDragOver(event: DragEvent, slot: string): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    if (this.activeDragSlot() !== slot) {
      this.activeDragSlot.set(slot);
    }
  }

  onDragLeave(event: DragEvent, slot: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounts[slot] = Math.max(0, (this.dragCounts[slot] || 0) - 1);
    if (this.dragCounts[slot] === 0 && this.activeDragSlot() === slot) {
      this.activeDragSlot.set(null);
    }
  }

  async onDrop(event: DragEvent, slot: 'cover' | 'ss1' | 'ss2' | 'ss3' | 'ss4'): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.dragCounts[slot] = 0;
    this.activeDragSlot.set(null);

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const validation = validateImagePayload(file);
    if (!validation.valid) {
      this.toast.show({
        type: 'error',
        title: 'Invalid File',
        message: validation.error || 'Please drop a valid image file (PNG, JPEG, WebP, GIF).'
      });
      return;
    }

    const fieldMap: Record<string, string> = {
      cover: 'coverImageUrl',
      ss1: 'screenshot1',
      ss2: 'screenshot2',
      ss3: 'screenshot3',
      ss4: 'screenshot4'
    };
    const controlName = fieldMap[slot];

    this.slotError.update(m => ({ ...m, [slot]: '' }));
    this.slotUploading.update(m => ({ ...m, [slot]: true }));

    try {
      const dataUrl = await compressImageFile(file);
      this.gameForm.get(controlName)?.setValue(dataUrl);
      this.gameForm.get(controlName)?.markAsDirty();
      this.formValues.set({ ...this.gameForm.getRawValue() });
      this.toast.show({
        type: 'success',
        title: 'Image Loaded',
        message: `${file.name} successfully compressed and assigned.`
      });
    } catch (err: any) {
      this.slotError.update(m => ({ ...m, [slot]: err?.message || 'Failed to process dropped image.' }));
    } finally {
      this.slotUploading.update(m => ({ ...m, [slot]: false }));
    }
  }

  clearSlot(slot: 'cover' | 'ss1' | 'ss2' | 'ss3' | 'ss4'): void {
    const fieldMap: Record<string, string> = {
      cover: 'coverImageUrl',
      ss1: 'screenshot1',
      ss2: 'screenshot2',
      ss3: 'screenshot3',
      ss4: 'screenshot4'
    };
    const controlName = fieldMap[slot];
    this.gameForm.get(controlName)?.setValue('');
    this.gameForm.get(controlName)?.markAsDirty();
    this.formValues.set({ ...this.gameForm.getRawValue() });
  }

  hasUnsavedChanges(): boolean {
    return (this.gameForm?.dirty ?? false) && !this.justSaved;
  }

  /**
   * Automatically persists in-progress changes as a private draft upon navigating away.
   * Prevents work loss without jarring blocking dialogs.
   */
  autoSaveDraftOnLeave(): boolean {
    if (!this.hasUnsavedChanges()) {
      return true;
    }

    const user = this.auth.currentUser();
    if (!user) {
      return true;
    }

    const formVal = this.gameForm.getRawValue();
    const hasTitle = Boolean(formVal.title && formVal.title.trim().length > 0);
    const hasAnyContent = hasTitle || Boolean(formVal.description?.trim()) || Boolean(formVal.coverImageUrl);

    if (!hasAnyContent) {
      return true; // Pristine or empty form - no draft created
    }

    const fallbackDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const title = hasTitle ? formVal.title.trim() : `Untitled Draft (${fallbackDate})`;

    const rawScreenshots = [
      formVal.screenshot1,
      formVal.screenshot2,
      formVal.screenshot3,
      formVal.screenshot4
    ];
    const safeScreenshots = buildCompleteScreenshotArray(rawScreenshots, formVal.coverImageUrl || this.defaultCoverFallback);

    const dto: CreateGameDto = {
      title,
      description: formVal.description?.trim() || 'Work in progress draft.',
      price: Number(formVal.price) || 0,
      coverImageUrl: formVal.coverImageUrl?.trim() || this.defaultCoverFallback,
      samplePackageUrl: formVal.samplePackageUrl?.trim() || 'assets/sample-packages/game-package.zip',
      tags: Array.isArray(formVal.tags) && formVal.tags.length > 0 ? formVal.tags : ['Indie'],
      screenshotUrls: safeScreenshots,
      status: 'draft'
    };

    if (this.isEditMode && this.gameId) {
      this.gamesData.updateGame(this.gameId, dto).subscribe({
        next: () => {
          this.justSaved = true;
          this.toast.show({
            type: 'info',
            title: 'Draft Saved',
            message: 'Your progress was automatically saved.'
          });
        }
      });
    } else {
      this.gamesData.createGame(dto, user.id).subscribe({
        next: () => {
          this.justSaved = true;
          this.toast.show({
            type: 'info',
            title: 'Draft Saved',
            message: 'Your progress was automatically saved to Drafts.'
          });
        }
      });
    }

    this.justSaved = true;
    return true;
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      this.autoSaveDraftOnLeave();
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== this.defaultCoverFallback) {
      img.src = this.defaultCoverFallback;
    }
  }

  onSubmit(): void {
    if (this.gameForm.invalid) {
      this.gameForm.markAllAsTouched();
      return;
    }

    const user = this.auth.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const formVal = this.gameForm.value;
    const rawScreenshots = [
      formVal.screenshot1,
      formVal.screenshot2,
      formVal.screenshot3,
      formVal.screenshot4
    ];
    const safeScreenshots = buildCompleteScreenshotArray(rawScreenshots, formVal.coverImageUrl);

    const dto: CreateGameDto = {
      title: formVal.title.trim(),
      description: formVal.description.trim(),
      price: Number(formVal.price),
      coverImageUrl: formVal.coverImageUrl.trim(),
      samplePackageUrl: formVal.samplePackageUrl?.trim() || 'assets/sample-packages/game-package.zip',
      tags: Array.isArray(formVal.tags) && formVal.tags.length > 0 ? formVal.tags : ['Indie'],
      screenshotUrls: safeScreenshots,
      status: 'published'
    };

    if (this.isEditMode && this.gameId) {
      this.gamesData.updateGame(this.gameId, dto).subscribe({
        next: () => {
          this.submitting = false;
          this.justSaved = true; // Skip unsaved-changes prompt on programmatic navigation
          this.router.navigate(['/studio'], {
            queryParams: { updated: 'true', title: dto.title, gameId: this.gameId }
          });
        },
        error: (err) => {
          this.errorMessage = err?.message || 'Failed to update game listing.';
          this.submitting = false;
        }
      });
    } else {
      this.gamesData.createGame(dto, user.id).subscribe({
        next: (createdGame) => {
          this.submitting = false;
          this.justSaved = true; // Skip unsaved-changes prompt on programmatic navigation
          this.router.navigate(['/studio'], {
            queryParams: { published: 'true', title: dto.title, gameId: createdGame.id }
          });
        },
        error: (err) => {
          this.errorMessage = err?.message || 'Failed to publish game.';
          this.submitting = false;
        }
      });
    }
  }

  onSaveDraft(): void {
    const rawTitle = this.gameForm.get('title')?.value;
    if (!rawTitle || typeof rawTitle !== 'string' || rawTitle.trim().length < 2) {
      this.errorMessage = 'Please enter at least a title (2+ characters) to save as a draft.';
      this.gameForm.get('title')?.markAsTouched();
      return;
    }

    const user = this.auth.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const formVal = this.gameForm.value;
    const rawScreenshots = [
      formVal.screenshot1,
      formVal.screenshot2,
      formVal.screenshot3,
      formVal.screenshot4
    ];
    const safeScreenshots = buildCompleteScreenshotArray(rawScreenshots, formVal.coverImageUrl || this.defaultCoverFallback);

    const dto: CreateGameDto = {
      title: formVal.title.trim(),
      description: formVal.description?.trim() || 'Work in progress draft.',
      price: Number(formVal.price) || 0,
      coverImageUrl: formVal.coverImageUrl?.trim() || this.defaultCoverFallback,
      samplePackageUrl: formVal.samplePackageUrl?.trim() || 'assets/sample-packages/game-package.zip',
      tags: Array.isArray(formVal.tags) && formVal.tags.length > 0 ? formVal.tags : ['Indie'],
      screenshotUrls: safeScreenshots,
      status: 'draft'
    };

    if (this.isEditMode && this.gameId) {
      this.gamesData.updateGame(this.gameId, dto).subscribe({
        next: () => {
          this.submitting = false;
          this.justSaved = true;
          this.router.navigate(['/studio'], {
            queryParams: { draftSaved: 'true', title: dto.title, gameId: this.gameId }
          });
        },
        error: (err) => {
          this.errorMessage = err?.message || 'Failed to save draft.';
          this.submitting = false;
        }
      });
    } else {
      this.gamesData.createGame(dto, user.id).subscribe({
        next: (createdGame) => {
          this.submitting = false;
          this.justSaved = true;
          this.router.navigate(['/studio'], {
            queryParams: { draftSaved: 'true', title: dto.title, gameId: createdGame.id }
          });
        },
        error: (err) => {
          this.errorMessage = err?.message || 'Failed to save draft.';
          this.submitting = false;
        }
      });
    }
  }
}
