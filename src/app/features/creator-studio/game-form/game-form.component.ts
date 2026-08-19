import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Game, CreateGameDto, UpdateGameDto } from '../../../core/models/game.model';
import { GAMES_DATA } from '../../../core/data/tokens';
import { AuthService } from '../../../core/auth/auth.service';
import { TagChipInputComponent } from '../../../shared/ui/tag-chip-input/tag-chip-input.component';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';

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
export class GameFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private gamesData = inject(GAMES_DATA);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  gameForm!: FormGroup;
  isEditMode = false;
  gameId: string | null = null;
  loading = true;
  submitting = false;
  errorMessage = '';

  readonly artworkPresets: ArtworkPreset[] = [
    {
      name: 'Cyberpunk Neon Metropolis',
      coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80'
      ],
      suggestedTags: ['Cyberpunk', 'Action', 'Sci-Fi']
    },
    {
      name: 'Synthwave Highway Drift',
      coverUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80'
      ],
      suggestedTags: ['Synthwave', 'Racing', 'Retro']
    },
    {
      name: 'Pixel Dungeon Rogue',
      coverUrl: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=800&auto=format&fit=crop&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80'
      ],
      suggestedTags: ['Pixel Art', 'Roguelike', 'Indie']
    },
    {
      name: 'Orbital Void Strategy',
      coverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80'
      ],
      suggestedTags: ['Strategy', 'Sci-Fi', 'Space']
    }
  ];

  ngOnInit(): void {
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
      samplePackageUrl: ['assets/sample-packages/game-package.zip'],
      tags: [['Cyberpunk', 'Indie'], [Validators.required]]
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

        this.gameForm.patchValue({
          title: game.title,
          description: game.description,
          price: game.price,
          coverImageUrl: game.coverImageUrl,
          samplePackageUrl: game.samplePackageUrl || 'assets/sample-packages/game-package.zip',
          tags: game.tags
        });
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
      tags: [...preset.suggestedTags]
    });
  }

  get previewTitle(): string {
    return this.gameForm.get('title')?.value || 'Your Game Title';
  }

  get previewPrice(): number {
    return this.gameForm.get('price')?.value ?? 0;
  }

  get previewCover(): string {
    return this.gameForm.get('coverImageUrl')?.value || 'assets/games/game-1-cover.svg';
  }

  get previewTags(): string[] {
    return this.gameForm.get('tags')?.value || [];
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
    const dto: CreateGameDto = {
      title: formVal.title.trim(),
      description: formVal.description.trim(),
      price: Number(formVal.price),
      coverImageUrl: formVal.coverImageUrl.trim(),
      samplePackageUrl: formVal.samplePackageUrl?.trim() || 'assets/sample-packages/game-package.zip',
      tags: Array.isArray(formVal.tags) && formVal.tags.length > 0 ? formVal.tags : ['Indie'],
      screenshotUrls: [
        formVal.coverImageUrl,
        'assets/games/game-1-shot1.svg',
        'assets/games/game-1-shot2.svg'
      ]
    };

    if (this.isEditMode && this.gameId) {
      this.gamesData.updateGame(this.gameId, dto).subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate(['/studio']);
        },
        error: (err) => {
          this.errorMessage = err?.message || 'Failed to update game listing.';
          this.submitting = false;
        }
      });
    } else {
      this.gamesData.createGame(dto, user.id).subscribe({
        next: () => {
          this.submitting = false;
          this.router.navigate(['/studio']);
        },
        error: (err) => {
          this.errorMessage = err?.message || 'Failed to publish game.';
          this.submitting = false;
        }
      });
    }
  }
}
