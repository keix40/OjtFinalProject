import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../services/cart.service';
import { OrderService } from '../services/order.service';
import { UserOrder } from '../user-order';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OrderConfirmComponent } from '../order-confirm/order-confirm.component';
import { CardService } from '../services/card.service';

interface Card {
  id: number;
  cardholderName: string;
  cardBrand: string;
  expiryDate: string;
  isDefault: boolean;
  cardNumber: string;
}

@Component({
  selector: 'app-payment',
  standalone: false,
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.css'
})
export class PaymentComponent implements OnInit, OnDestroy {
  customer: any;
  shipping: any;
  delivery: any;
  cartItems: CartItem[] = [];
  paymentMethod: string = 'card';

  userId: number | null = null;
  addressId: number | null = null;
  deliveryMethodId: number | null = null;
  discountId: number | null = null;
  discount: any = null;
  discountAmount: number = 0;
  deliveryFee: number = 0;

  isSubmitting: boolean = false;

  cardForm: FormGroup;
  private subscriptions: Subscription[] = [];

  savedCards: Card[] = [];
  selectedSavedCardId: string | null = null;
  useNewCard: boolean = false;

  constructor(
    private router: Router,
    private cartService: CartService,
    private orderService: OrderService,
    private cardService: CardService,
    private fb: FormBuilder,
    private modalService: NgbModal
  ) {
    this.cardForm = this.fb.group({
      cardNumber: ['', [
        Validators.required,
        Validators.pattern(/^(\d{4} ){2,3}\d{3,4}$/)
      ]],
      cardholderName: ['', Validators.required],
      expiryDate: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2]) \/ \d{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      cardBrand: ['', Validators.required]
    });
  }

  ngOnInit() {
    const nav = window.history.state;
    this.customer = nav.customer;
    this.shipping = nav.shipping;
    this.delivery = nav.delivery;

    this.userId = nav.userId;
    this.addressId = nav.addressId;
    this.deliveryMethodId = nav.deliveryMethodId;
    this.discountId = nav.discountId;
    this.discount = nav.discount;
    this.discountAmount = nav.discountAmount || 0;
    this.deliveryFee = nav.deliveryFee || 0;

    this.paymentMethod = 'card';

    if (this.userId != null) {
      this.loadSavedCards();
    } else {
      this.useNewCard = true;
    }

    this.subscriptions.push(
      this.cartService.getCartItems().subscribe(items => {
        setTimeout(() => {
          this.cartItems = items;
        });
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getSubtotal() {
    return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  getDeliveryCost() {
    return this.deliveryFee;
  }

  getTotal() {
    return this.getSubtotal() + this.getDeliveryCost() - this.discountAmount;
  }

  submitOrder() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    if (this.useNewCard) {
      if (this.cardForm.invalid) {
        this.cardForm.markAllAsTouched();
        this.isSubmitting = false;
        return;
      }
    } else {
      if (!this.selectedSavedCardId) {
        alert('Please select a saved card to proceed.');
        this.isSubmitting = false;
        return;
      }
    }

    if (!this.userId || !this.addressId || !this.deliveryMethodId) {
      alert('Missing required order information.');
      this.isSubmitting = false;
      return;
    }

    if (this.useNewCard) {
      const newCard = {
        userId: this.userId,
        cardholderName: this.cardForm.value.cardholderName,
        cardNumber: this.cardForm.value.cardNumber.replace(/\s/g, ''),
        expiryDate: this.cardForm.value.expiryDate,
        cardBrand: this.cardForm.value.cardBrand,
        isDefault: true
      };

      this.cardService.saveCard(newCard).subscribe({
        next: (response: any) => {
          const savedCardId = response?.id;
          if (savedCardId) {
            this.placeOrderWithCardId(savedCardId);
          } else {
            alert('Card saved but no ID returned.');
            this.isSubmitting = false;
          }
        },
        error: (err) => {
          console.error('Failed to save card:', err);
          this.isSubmitting = false;
          alert('Failed to save card.');
        }
      });
    } else {
      const selectedCard = this.getSelectedSavedCard();
      if (!selectedCard) {
        alert('Selected card not found.');
        this.isSubmitting = false;
        return;
      }
      this.placeOrderWithCardId(Number(selectedCard.id));
    }
  }

  placeOrderWithCardId(cardId?: number) {
    const userOrder: UserOrder = {
      userId: this.userId!,
      addressId: this.addressId!,
      discountId: this.discountId || null,
      deliveryId: this.deliveryMethodId!,
      totalAmount: this.getTotal(),
      cartItem: this.cartItems.map(item => ({
        productId: item.productId ?? item.id,
        quantity: item.quantity,
        price: item.price,
        variantId: item.variantId ?? null
      })),
      cardId
    };

    this.orderService.createOrder(userOrder).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        const responseData = typeof response === 'object' && response !== null ? response : {};
        const orderDetails = {
          ...responseData,
          customer: this.customer,
          shipping: this.shipping,
          delivery: this.delivery,
          cartItems: this.cartItems,
          paymentMethod: this.paymentMethod,
          orderNumber: responseData.orderCode,
          deliveryFee: this.deliveryFee,
          discountAmount: this.discountAmount,
          cardInfo: this.useNewCard
            ? {
                ...this.cardForm.value,
                cardNumber: this.maskCardNumber(this.cardForm.value.cardNumber)
              }
            : this.getSelectedSavedCard(),
          discount: this.discount
        };
        this.openConfirmationModal(orderDetails);
      },
      error: (error) => {
        console.error('Error placing order:', error);
        this.isSubmitting = false;
        alert('Failed to place order. Please try again.');
      }
    });
  }

  openConfirmationModal(orderDetails: any) {
    const modalRef = this.modalService.open(OrderConfirmComponent, { centered: true });
    modalRef.componentInstance.orderDetails = orderDetails;
  }

  onCardNumberInput(event: any) {
    this.formatCardNumber(event);
    const brand = this.detectCardBrand(event.target.value);
    if (brand !== 'UNKNOWN') {
      this.cardForm.get('cardBrand')?.setValue(brand, { emitEvent: false });
    }
  }

  formatCardNumber(event: any) {
    let value = event.target.value.replace(/\s/g, '');
    value = value.replace(/\D/g, '');
    value = value.replace(/(\d{4})/g, '$1 ').trim();
    event.target.value = value.substring(0, 19);
  }

  formatExpiryDate(event: any) {
    let value = event.target.value.replace(/\s\/\s/g, '').replace('/', '');
    value = value.replace(/\D/g, '');

    if (value.length > 2) {
      value = value.slice(0, 2) + ' / ' + value.slice(2, 4);
    }

    event.target.value = value.substring(0, 7);
  }

  formatCVV(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.substring(0, 4);
    event.target.value = value;
  }

  onPaymentMethodChange() {
    if (this.paymentMethod !== 'card') {
      this.cardForm.reset();
    }
  }

  loadSavedCards() {
    if (this.userId == null) return;
    this.cardService.getCardsByUserId(this.userId).subscribe(cards => {
      this.savedCards = cards.map(card => ({
        id: Number(card.id),
        cardholderName: card.cardholderName,
        cardBrand: card.cardBrand,
        cardNumber: card.cardNumber,
        expiryDate: card.expiryDate,
        isDefault: card.isDefault
      }));
      this.selectedSavedCardId = cards.length > 0 && cards[0]?.id != null
      ? cards[0].id.toString()
      : '';
          this.useNewCard = cards.length === 0;
    });
  }

  getSelectedSavedCard() {
    if (!this.selectedSavedCardId) return undefined;
    const selected = this.savedCards.find(card => card.id === +(this.selectedSavedCardId ?? 0));
    console.log("Selected saved card:", selected);
    return selected;
  }
  

  detectCardBrand(cardNumber: string): string {
    const noSpaces = cardNumber.replace(/\s/g, '');
    if (/^4/.test(noSpaces)) return 'VISA';
    if (/^5[1-5]/.test(noSpaces)) return 'MASTERCARD';
    if (/^3[47]/.test(noSpaces)) return 'AMEX';
    return 'UNKNOWN';
  }

  toggleUseNewCard(useNew: boolean) {
    this.useNewCard = useNew;
    if (!useNew && this.savedCards.length > 0) {
      this.selectedSavedCardId = this.savedCards[0].id.toString();
    }
  }

  maskCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s/g, '');
    const length = cleaned.length;
    if (length <= 4) return cleaned;
    const maskedSection = '*'.repeat(length - 4);
    const visibleSection = cleaned.slice(-4);
    const fullMasked = maskedSection + visibleSection;
    return fullMasked.match(/.{1,4}/g)?.join(' ') ?? fullMasked;
  }
}
