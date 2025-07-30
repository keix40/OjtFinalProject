import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CardService, SavedCard } from '../../services/card.service';
import { AuthService } from '../../auth/auth.service';
import Swal from 'sweetalert2';

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
    private fb: FormBuilder
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
    // Validate expiry date is in the future (same as update method)
    let expiry = this.addCardForm.value.expiryDate?.trim().replace(/\s/g, '');
    if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
      Swal.fire('Invalid Expiry', 'Expiry date must be in MM/YY format.', 'error');
      return;
    }
    const [mm, yy] = expiry.split('/').map(Number);
    if (mm < 1 || mm > 12) {
      Swal.fire('Invalid Expiry', 'Month must be between 01 and 12.', 'error');
      return;
    }
    const fullYear = 2000 + yy;
    const expiryDate = new Date(fullYear, mm, 0); // Last day of the expiry month
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expiryDate <= today) {
      Swal.fire('Invalid Expiry', 'Expiry date must be after today.', 'error');
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
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Card added successfully!'
        });
      },
      error: () => {
        Swal.fire('Error', 'Failed to add card.', 'error');
        this.isSubmitting = false;
      }
    });
  }

  removeCard(card: SavedCard) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to remove this card?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, remove it!'
    }).then((result) => {
      if (result.isConfirmed && card.id) {
        this.cardService.softDeleteCard(card.id).subscribe({
          next: () => {
            Swal.fire('Removed!', 'Your card has been removed.', 'success');
            this.loadSavedCards();
          },
          error: () => {
            Swal.fire('Error', 'Failed to remove card.', 'error');
          }
        });
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
      Swal.fire('Invalid Expiry', 'Expiry date must be in MM/YY format.', 'error');
      return;
    }
  
    const [mm, yy] = expiry.split('/').map(Number);
    if (mm < 1 || mm > 12) {
      Swal.fire('Invalid Expiry', 'Month must be between 01 and 12.', 'error');
      return;
    }
  
    const fullYear = 2000 + yy;
    const expiryDate = new Date(fullYear, mm, 0); // Last day of the expiry month
  
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    if (expiryDate <= today) {
      Swal.fire('Invalid Expiry', 'Expiry date must be after today.', 'error');
      return;
    }
  
    this.cardService.updateCard(this.editingCardId, this.editCardData).subscribe({
      next: () => {
        Swal.fire('Updated!', 'Card updated successfully.', 'success');
        this.editingCardId = null;
        this.editCardData = {};
        this.loadSavedCards();
      },
      error: () => {
        Swal.fire('Error', 'Failed to update card.', 'error');
      }
    });
  }
  
}
