import { Component, OnInit } from '@angular/core';

interface SavedCard {
  id: number;
  last4: string;
  expiry: string;
}

@Component({
  selector: 'app-user-payment-methods',
  standalone: false,
  templateUrl: './user-payment-methods.component.html',
  styleUrl: './user-payment-methods.component.css'
})
export class UserPaymentMethodsComponent implements OnInit {

  savedCards: SavedCard[] = [];

  constructor() { }

  ngOnInit(): void {
    this.loadSavedCards();
  }

  // Payment Methods
  private loadSavedCards() {
    // TODO: Implement API call to load saved cards
    this.savedCards = [
      {
        id: 1,
        last4: '4242',
        expiry: '12/25'
      }
    ];
  }

  addNewCard() {
    // TODO: Implement add new card functionality
    console.log('Adding new card');
  }

  removeCard(card: SavedCard) {
    // TODO: Implement remove card functionality
    this.savedCards = this.savedCards.filter(c => c.id !== card.id);
  }

}
