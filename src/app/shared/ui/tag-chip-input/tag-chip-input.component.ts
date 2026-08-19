import { Component, forwardRef, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tag-chip-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagChipInputComponent),
      multi: true
    }
  ],
  templateUrl: './tag-chip-input.component.html',
  styleUrls: ['./tag-chip-input.component.css']
})
export class TagChipInputComponent implements ControlValueAccessor {
  @Input() maxTags = 5;
  @Input() minLength = 2;
  @Input() maxLength = 20;
  @Input() placeholder = 'Type a tag and press Enter...';

  tags = signal<string[]>([]);
  inputValue = '';
  errorMessage = '';
  disabled = false;

  readonly popularSuggestions = [
    'Cyberpunk',
    'Pixel Art',
    'Synthwave',
    'Roguelike',
    'Sci-Fi',
    'Action',
    'Retro',
    'Strategy',
    'Indie'
  ];

  private onChange: (tags: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string[] | null): void {
    if (Array.isArray(value)) {
      this.tags.set([...value]);
    } else {
      this.tags.set([]);
    }
  }

  registerOnChange(fn: (tags: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.disabled) return;

    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTagFromInput();
    } else if (event.key === 'Backspace' && !this.inputValue && this.tags().length > 0) {
      this.removeTag(this.tags().length - 1);
    }
  }

  addTagFromInput(): void {
    const raw = this.inputValue.trim().replace(/^#+/, '').replace(/,/g, '');
    if (!raw) return;

    this.addTag(raw);
    if (!this.errorMessage) {
      this.inputValue = '';
    }
  }

  addTag(rawTag: string): void {
    const tag = rawTag.trim();
    this.errorMessage = '';

    if (this.tags().length >= this.maxTags) {
      this.errorMessage = `Maximum ${this.maxTags} tags allowed.`;
      return;
    }

    if (tag.length < this.minLength) {
      this.errorMessage = `Tag must be at least ${this.minLength} characters.`;
      return;
    }

    if (tag.length > this.maxLength) {
      this.errorMessage = `Tag cannot exceed ${this.maxLength} characters.`;
      return;
    }

    const current = this.tags();
    if (current.some(t => t.toLowerCase() === tag.toLowerCase())) {
      this.errorMessage = `Tag "${tag}" already added.`;
      return;
    }

    const updated = [...current, tag];
    this.tags.set(updated);
    this.onChange(updated);
    this.onTouched();
    this.errorMessage = '';
  }

  removeTag(index: number): void {
    if (this.disabled) return;
    const updated = this.tags().filter((_, i) => i !== index);
    this.tags.set(updated);
    this.onChange(updated);
    this.onTouched();
    this.errorMessage = '';
  }

  isSuggestionAdded(suggestion: string): boolean {
    return this.tags().some(t => t.toLowerCase() === suggestion.toLowerCase());
  }

  toggleSuggestion(suggestion: string): void {
    if (this.disabled) return;
    if (this.isSuggestionAdded(suggestion)) {
      const idx = this.tags().findIndex(t => t.toLowerCase() === suggestion.toLowerCase());
      if (idx !== -1) {
        this.removeTag(idx);
      }
    } else {
      this.addTag(suggestion);
    }
  }
}
