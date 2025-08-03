import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { OrderService } from '../services/order.service';
import { ModalService } from '../services/modal.service';
import { ReturnService } from '../services/return.service';
import { AuthService } from '../auth/auth.service';
import { PolicyService } from '../services/policy.service';
import { PriceFormatService } from '../services/price-format.service';

@Component({
  selector: 'app-order-tracking',
  standalone: false,
  templateUrl: './order-tracking.component.html',
  styleUrl: './order-tracking.component.css'
})
export class OrderTrackingComponent {
  order: any;
  isLoading = true;
  error: string | null = null;
  statusSteps = ['Order Placed', 'Processing', 'Shipped', 'Delivered'];
  showAllStatus: boolean = false;
  stopStatuses = ['CANCELLED', 'RETURNED'];
  orderStatusAtCancelRequest: string | null = null;

  // Return Policy Modal
  showPolicyModal: boolean = false;
  returnPolicyText: string = '';
  returnPolicyHtml: SafeHtml = '';
  isLoadingPolicy: boolean = false;
  selectedPolicy: any = null;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private modalService: ModalService,
    private returnService: ReturnService,
    private policyService: PolicyService,
    private sanitizer: DomSanitizer,
    private priceFormatService: PriceFormatService
  ) {}

  ngOnInit(): void {
    this.loadOrderTracking();
    this.getReturnPolicy();
  }

  getReturnPolicy() {
    this.isLoadingPolicy = true;
    this.policyService.getPolicyByTitle().subscribe({
      next: (policy) => {
        this.selectedPolicy = policy;
        this.returnPolicyText = policy.content;
        // Process content for smart text wrapping
        this.returnPolicyText = this.processContentForSmartWrapping(this.returnPolicyText);
        this.returnPolicyHtml = this.sanitizer.bypassSecurityTrustHtml(this.returnPolicyText);
        this.isLoadingPolicy = false;
      },
      error: (error) => {
        console.error('Failed to load return policy:', error);
        // Fallback to default policy text if loading fails
        this.returnPolicyText = `<p>Customers are eligible to request returns under the following conditions. All return requests must be reviewed and approved by the admin before any refund or replacement is processed.</p>

<h3>1. Wrong Item Delivered</h3>
<p>If the item received is different from what was ordered, a return request must be submitted within 7 days of delivery.</p>
<p>Upon verification, a full refund will be issued.</p>

<h3>2. Damaged on Arrival</h3>
<p>If the item is received in a damaged or defective condition, photo evidence must be provided.</p>
<p>After verification by the admin, customers will be offered either a refund or a replacement.</p>

<h3>3. Changed Mind</h3>
<p>Returns due to a change of mind are accepted only if the product is unused and sealed.</p>
<p>The customer is responsible for the return shipping costs.</p>
<p>A refund will be processed after the returned product is inspected and approved.</p>

<h3>4. Return Process</h3>
<ul>
<li>Submit return request through the order tracking page</li>
<li>Provide clear photos of the item condition</li>
<li>Package item securely for return shipping</li>
<li>Wait for admin approval before shipping</li>
<li>Return shipping costs are the responsibility of the customer for change of mind returns</li>
</ul>

<h3>5. Refund Timeline</h3>
<ul>
<li>Refunds will be processed within 5-7 business days after receiving the returned item</li>
<li>Refunds will be issued to the original payment method</li>
<li>Processing times may vary depending on your bank or payment provider</li>
</ul>

<h3>6. Contact Information</h3>
<p>For questions about returns, please contact our customer service team.</p>`;
        // Process fallback content for smart text wrapping
        this.returnPolicyText = this.processContentForSmartWrapping(this.returnPolicyText);
        this.returnPolicyHtml = this.sanitizer.bypassSecurityTrustHtml(this.returnPolicyText);
        this.selectedPolicy = {
          content: this.returnPolicyText
        };
        this.isLoadingPolicy = false;
      }
    });
  }

  /**
   * Process HTML content for smart text wrapping
   * This method ensures proper word wrapping by keeping words complete
   */
  private processContentForSmartWrapping(content: string): string {
    // Create a temporary div to process the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Apply CSS to prevent word breaking
    tempDiv.style.wordBreak = 'normal';
    tempDiv.style.wordWrap = 'normal';
    tempDiv.style.overflowWrap = 'normal';
    tempDiv.style.hyphens = 'none';
    
    // Process all text nodes to ensure no word breaking
    this.processTextNodesForNoBreaking(tempDiv);
    
    return tempDiv.innerHTML;
  }

  /**
   * Recursively process text nodes to prevent word breaking
   */
  private processTextNodesForNoBreaking(element: HTMLElement): void {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    textNodes.forEach(textNode => {
      const text = textNode.textContent || '';
      if (text.trim()) {
        // Ensure text is wrapped in spans to prevent word breaking
        const processedText = this.ensureNoWordBreaking(text);
        if (processedText !== text) {
          // Create a span element to wrap the text
          const span = document.createElement('span');
          span.textContent = processedText;
          span.style.wordBreak = 'normal';
          span.style.wordWrap = 'normal';
          span.style.overflowWrap = 'normal';
          span.style.hyphens = 'none';
          span.style.whiteSpace = 'normal';
          
          // Replace the text node with the span
          textNode.parentNode?.replaceChild(span, textNode);
        }
      }
    });
  }

  /**
   * Ensure no word breaking in text
   */
  private ensureNoWordBreaking(text: string): string {
    // Split text into words and ensure they stay together
    const words = text.split(/(\s+)/);
    
    return words.map(word => {
      // If it's a space, return as is
      if (/^\s+$/.test(word)) {
        return word;
      }
      
      // For actual words, ensure they stay complete
      // Add non-breaking space if needed for very short words
      if (word.length <= 3) {
        return word.replace(/\s/g, '\u00A0'); // Non-breaking space
      }
      
      return word;
    }).join('');
  }

  /**
   * Add soft hyphens to long words for better breaking
   */
  private addSoftHyphens(text: string): string {
    // Return text as-is to keep words complete
    return text;
  }

  /**
   * Simple syllable detection for soft hyphenation
   */
  private getSyllables(word: string): string[] {
    // Return word as single syllable to keep it complete
    return [word];
  }

  loadOrderTracking() {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    if (orderId) {
      this.orderService.getOrderById(+orderId).subscribe({
        next: (order) => {
          // Sort statusHistory ascending (oldest first)
          order.statusHistory = order.statusHistory?.sort(
            (a: any, b: any) => new Date(a.statusDate).getTime() - new Date(b.statusDate).getTime()
          );
          this.order = order;
          this.isLoading = false;
        },
        error: () => {
          this.error = 'Order not found.';
          this.isLoading = false;
        }
      });
    }
  }
  
  getCurrentStep(): number {
    const statusMap: any = {
      'PENDING': 0,
      'PROCESSING': 1,
      'SHIPPED': 2,
      'OUT_FOR_DELIVERY': 3,
      'DELIVERED': 4
    };

    if (!this.order?.statusHistory?.length) return 0;
    const latest = [...this.order.statusHistory]
      .sort((a, b) => new Date(b.statusDate).getTime() - new Date(a.statusDate).getTime())[0];
    return statusMap[latest.status?.toUpperCase()] ?? 0;
  }

  toggleShowAllStatus() {
    this.showAllStatus = !this.showAllStatus;
  }
  

  getDeliveredDate(): Date | null {
    const delivered = this.order?.statusHistory?.find(
      (s: any) => s.status.toUpperCase() === 'DELIVERED'
    );
    return delivered ? new Date(delivered.statusDate) : null;
  }

  getLastNonCancelledStatus(): string {
    if (!this.order?.statusHistory?.length) return 'UNKNOWN';
  
    const stopStatuses = ['CANCELLED', 'RETURNED'];
  
    const nonStopStatus = [...this.order.statusHistory]
      .filter(s => !stopStatuses.includes(s.status?.toUpperCase()))
      .sort((a, b) => new Date(b.statusDate).getTime() - new Date(a.statusDate).getTime());
  
    return nonStopStatus.length > 0
      ? String(nonStopStatus[0].status)
      : 'UNKNOWN';
  }  

  goToReturnRequest() {
    this.showPolicyModal = true;
  }

  refreshReturnPolicy() {
    this.getReturnPolicy();
  }

  onAgreePolicy() {
    this.showPolicyModal = false;
    const lastStatus = this.getLastNonCancelledStatus();
    this.orderStatusAtCancelRequest = lastStatus;
    const orderId = Number(this.route.snapshot.paramMap.get('orderId'));
    if (orderId) {
      this.modalService.openReturnRequestModal(orderId, lastStatus).then((result) => {
        if (result === 'success') {
          this.loadOrderTracking();
        }
      });
    }
  }

  onClosePolicyModal() {
    this.showPolicyModal = false;
  }

  cancelReturnRequest(returnRequestId: number) {
    if (!this.order || !this.order.orderId) {
      console.error('Order not loaded or missing ID.');
      return;
    }
  
    this.modalService.showConfirmation(
      'Cancel Return Request',
      'Are you sure you want to cancel this return request?'
    ).then((confirmed: boolean) => {
      if (confirmed) {
        this.returnService.cancelReturnRequest(returnRequestId).subscribe({
          next: () => {
            this.loadOrderTracking();
            this.orderService.updateOrderStatus(this.order.orderId, this.getLastNonCancelledStatus()).subscribe({
              next: () => {
                this.loadOrderTracking();
              },
              error: (err: any) => {
                console.error('Failed to update order status:', err);
              }
            });
  
            const request = this.order.returnRequests.find((r: any) => r.id === returnRequestId);
            if (request) {
              request.status = 'CANCELLED';
              request.cancelledAt = new Date().toISOString();
            }
          },
          error: (err: any) => {
            console.error('Failed to cancel return request:', err);
          }
        });
      }
    });
  }

  isReturned(): boolean {
    return this.order?.status === 'RETURNED' ||
           this.order?.statusHistory?.some((s: any) => s.status.toUpperCase() === 'RETURNED');
  }

  formatReason(reason: string): string {
    return reason ? reason.replace(/_/g, ' ') : '';
  }

  isStopStatus(status: string): boolean {
    return this.stopStatuses.includes(status?.toUpperCase());
  }

  isSameStatusDate(statusDate: string, requestedAt: string): boolean {
    if (!statusDate || !requestedAt) return false;
    const d1 = new Date(statusDate);
    const d2 = new Date(requestedAt);
    return Math.abs(d1.getTime() - d2.getTime()) < 10 * 60 * 1000; // 10 minutes
  }
  
  shouldShowCancelOrder(): boolean {
    if (!this.order) return false;
    
    // Don't show if order is already cancelled or returned
    if (this.isStopStatus(this.order.status)) return false;
    
    // Don't show if order is delivered
    if (this.order.status === 'DELIVERED') return false;
    
    // Don't show if there's already a return request
    if (this.order.returnRequests && this.order.returnRequests.length > 0) return false;
    
    return true;
  }

  // Price formatting methods
  formatPrice(price: number, currency: string = 'MMK'): string {
    return this.priceFormatService.formatPrice(price, currency);
  }

  formatPriceOnly(price: number): string {
    return this.priceFormatService.formatPriceOnly(price);
  }

  formatDiscountedPrice(originalPrice: number, discountValue: number, discountType: string, currency: string = 'MMK'): string {
    return this.priceFormatService.formatDiscountedPrice(originalPrice, discountValue, discountType, currency);
  }

  formatDiscountText(discountValue: number, discountType: string): string {
    return this.priceFormatService.formatDiscountText(discountValue, discountType);
  }
}
  