import { Component, OnInit } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common'; // Import common modules

interface OrderItem {
  id: number;
  title: string;
  sku: string;
  quantity: number;
  price: number;
  image: string;
}

interface ShippingAddress {
  street: string;
  apt: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface Order {
  id: number;
  orderNumber: string;
  orderDate: Date;
  status: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  tax: number;
  paymentMethod: string;
  shippingMethod: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
}

@Component({
  selector: 'app-user-orders',
  standalone: false,
  templateUrl: './user-orders.component.html',
  styleUrl: './user-orders.component.css',
  providers: [DatePipe, CurrencyPipe] // Provide pipes if used in this component's template
})
export class UserOrdersComponent implements OnInit {

  userOrders: Order[] = [];
  expandedOrderId: number | null = null;

  constructor() { }

  ngOnInit(): void {
    this.loadUserOrders(); // Load orders on init
  }

  // Orders Methods
  private loadUserOrders() {
    // TODO: Implement API call to load user orders
    // Placeholder data matching the Order interface
    this.userOrders = [
      {
        id: 1,
        orderNumber: '78A6431D409',
        orderDate: new Date('2025-02-15'),
        status: 'In progress',
        total: 2105.90,
        subtotal: 1929.93,
        shippingCost: 15.99,
        tax: 159.98,
        paymentMethod: 'Credit Card (**** 4589)',
        shippingMethod: 'Express Delivery (2-3 business days)',
        shippingAddress: {
          street: '123 Main Street',
          apt: 'Apt 4B',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'United States'
        },
        items: [
          { id: 101, title: 'Lorem ipsum dolor sit amet', sku: 'PRD-001', quantity: 1, price: 899.99, image: 'assets/images/test.jpg' },
          { id: 102, title: 'Consectetur adipiscing elit', sku: 'PRD-002', quantity: 2, price: 299.98, image: 'assets/images/test.jpg' },
          { id: 103, title: 'Sed do eiusmod tempor', sku: 'PRD-003', quantity: 1, price: 129.99, image: 'assets/images/test.jpg' }
        ]
      },
       {
        id: 2,
        orderNumber: '47H76G09F33',
        orderDate: new Date('2024-12-10'),
        status: 'Delivered',
        total: 360.75,
        subtotal: 320.00,
        shippingCost: 10.75,
        tax: 30.00,
        paymentMethod: 'PayPal',
        shippingMethod: 'Standard Shipping',
        shippingAddress: {
          street: '456 Oak Avenue',
          apt: '',
          city: 'Los Angeles',
          state: 'CA',
          zip: '90001',
          country: 'United States'
        },
        items: [
          { id: 201, title: 'Another Product', sku: 'PRD-004', quantity: 1, price: 320.00, image: 'assets/images/test.jpg' }
        ]
      }
    ];
  }

  toggleOrderDetails(orderId: number) {
    if (this.expandedOrderId === orderId) {
      this.expandedOrderId = null; // Collapse if already expanded
    } else {
      this.expandedOrderId = orderId; // Expand the clicked order
    }
  }

}
