import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardService, SavedCard } from '../../services/card.service';
import { AuthService } from '../../auth/auth.service';
import { LuxDialogService } from '../../shared/dialog/lux-dialog.service';

@Component({
  selector: 'app-user-payment-methods',
  standalone: false,
  templateUrl: './user-payment-methods.component.html',
  styleUrl: './user-payment-methods.component.css'
})
export class UserPaymentMethodsComponent implements OnInit {
  savedCards: SavedCard[] = [];
  userId: number | null = null;
  editingCardId: number | null = null;
  editCardData: Partial<SavedCard> = {};
  showAddCardModal = false;
  addCardForm: FormGroup;
  isSubmitting = false;

  constructor(
    private cardService: CardService,
    private authService: AuthService,
    private fb: FormBuilder,
    private luxDialog: LuxDialogService
  ) {
    this.addCardForm = this.fb.group({
      cardBrand: ['', Validators.required],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      cardholderName: ['', Validators.required],
      expiryDate: ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    });
  }

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    if (this.userId) {
      this.loadSavedCards();
    }
  }

  loadSavedCards() {
    if (!this.userId) return;
    this.cardService.getCardsByUserId(this.userId).subscribe({
      next: (cards) => {
        this.savedCards = cards;
      },
      error: () => {
        this.savedCards = [];
      }
    });
  }

  addNewCard() {
    this.showAddCardModal = true;
    this.addCardForm.reset();
  }

  closeAddCardModal() {
    this.showAddCardModal = false;
  }

  submitAddCard() {
    if (!this.userId) return;
    if (this.addCardForm.invalid) {
      this.addCardForm.markAllAsTouched();
      return;
    }
    let expiry = this.addCardForm.value.expiryDate?.trim().replace(/\s/g, '');
    if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
      this.luxDialog.error('Invalid Expiry', 'Expiry date must be in MM/YY format.');
      return;
    }
    const [mm, yy] = expiry.split('/').map(Number);
    if (mm < 1 || mm > 12) {
      this.luxDialog.error('Invalid Expiry', 'Month must be between 01 and 12.');
      return;
    }
    const fullYear = 2000 + yy;
    const expiryDate = new Date(fullYear, mm, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expiryDate <= today) {
      this.luxDialog.error('Invalid Expiry', 'Expiry date must be after today.');
      return;
    }
    this.isSubmitting = true;
    const cardData = {
      ...this.addCardForm.value,
      userId: this.userId,
      isDefault: false
    };
    this.cardService.saveCard(cardData).subscribe({
      next: () => {
        this.showAddCardModal = false;
        this.isSubmitting = false;
        this.loadSavedCards();
        this.luxDialog.success('Success', 'Card added successfully!');
      },
      error: () => {
        this.luxDialog.error('Error', 'Failed to add card.');
        this.isSubmitting = false;
      }
    });
  }

  async removeCard(card: SavedCard) {
    const confirmed = await this.luxDialog.confirm({
      title: 'Are you sure?',
      text: 'Do you want to remove this card?',
      confirmText: 'Yes, remove it!',
      destructive: true
    });
    if (!confirmed || !card.id) return;

    this.cardService.softDeleteCard(card.id).subscribe({
      next: () => {
        this.luxDialog.success('Removed!', 'Your card has been removed.');
        this.loadSavedCards();
      },
      error: () => {
        this.luxDialog.error('Error', 'Failed to remove card.');
      }
    });
  }

  startEditCard(card: SavedCard) {
    this.editingCardId = card.id || null;
    this.editCardData = { ...card };
  }

  cancelEdit() {
    this.editingCardId = null;
    this.editCardData = {};
  }

  saveEditCard() {
    if (!this.editingCardId) return;

    let expiry = this.editCardData.expiryDate?.trim().replace(/\s/g, '');
    if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
      this.luxDialog.error('Invalid Expiry', 'Expiry date must be in MM/YY format.');
      return;
    }

    const [mm, yy] = expiry.split('/').map(Number);
    if (mm < 1 || mm > 12) {
      this.luxDialog.error('Invalid Expiry', 'Month must be between 01 and 12.');
      return;
    }

    const fullYear = 2000 + yy;
    const expiryDate = new Date(fullYear, mm, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expiryDate <= today) {
      this.luxDialog.error('Invalid Expiry', 'Expiry date must be after today.');
      return;
    }

    this.cardService.updateCard(this.editingCardId, this.editCardData).subscribe({
      next: () => {
        this.luxDialog.success('Updated!', 'Card updated successfully.');
        this.editingCardId = null;
        this.editCardData = {};
        this.loadSavedCards();
      },
      error: () => {
        this.luxDialog.error('Error', 'Failed to update card.');
      }
    });
  }
}
