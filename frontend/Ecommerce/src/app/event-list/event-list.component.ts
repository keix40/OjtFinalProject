import { Component, OnInit } from '@angular/core';
import { EventService } from '../services/event.service';
import { EventDTO } from '../event-dto';
import { Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LuxDialogService } from '../shared/dialog/lux-dialog.service';
import { LuxUiModule } from '../shared/ui/lux-ui.module';
declare var lucide: any;

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, LuxUiModule],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.css'
})
export class EventListComponent implements OnInit {
  events: EventDTO[] = [];
  filteredEvents: EventDTO[] = [];
  searchTerm: string = '';

  // Pagination properties (0-based for lux-paginator)
  currentPage: number = 0;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;
  Math = Math;

  // Hero section sorting properties
  sortedEvents: EventDTO[] = [];
  isSorting = false;
  originalOrder: EventDTO[] = [];

  constructor(
    private eventService: EventService,
    private router: Router,
    private dialog: LuxDialogService
  ) {}

  ngOnInit() {
   this.loadEvent();
  }

  ngAfterViewInit() {
    lucide.createIcons();
  }

  loadEvent(){
    this.eventService.getAllEvents().subscribe(events => {
      this.events = events;
      this.filteredEvents = events;
      // Initialize sortedEvents with hero preview events
      this.sortedEvents = [...this.heroPreviewEvents];
      this.originalOrder = [...this.sortedEvents];
      this.totalItems = events.length;
      this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage) || 0;
      this.currentPage = 0;
      setTimeout(() => lucide.createIcons(), 0);
    });
  }

  // Hero section sorting methods
  startSorting() {
    this.isSorting = true;
    this.sortedEvents = [...this.heroPreviewEvents];
    this.originalOrder = [...this.sortedEvents];
  }

  cancelSorting() {
    this.isSorting = false;
    this.sortedEvents = [...this.originalOrder];
  }

  dropEvent(event: CdkDragDrop<EventDTO[]>) {
    if (this.isSorting) {
      moveItemInArray(this.sortedEvents, event.previousIndex, event.currentIndex);
    }
  }

  saveSorting() {
    // Prepare payload: [{id, slideNo}] - filter out events with undefined IDs
    const payload = this.sortedEvents
      .filter(e => e.id !== undefined)
      .map((e, idx) => ({ id: e.id!, slideNo: idx + 1 }));
    
    this.eventService.updateEventOrder(payload).subscribe({
      next: () => {
        this.isSorting = false;
        this.loadEvent();
        this.dialog.success('Order updated', 'Hero section order has been saved successfully.');
      },
      error: () => {
        this.dialog.error('Update failed', 'Failed to save the new order. Please try again.');
      }
    });
  }

  editEventFromList(event: EventDTO) {
    this.router.navigate(['/admin/event', event.id]);
  }

  getEventImageUrl(event: EventDTO): string {
    if (!event.eventImage) return '/assets/images/no-image.png';
    if (event.eventImage.startsWith('http') || event.eventImage.startsWith('data:')) {
      return event.eventImage;
    }
    return 'http://localhost:8080' + event.eventImage;
  }

  onSearch() {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredEvents = this.events.filter(e =>
      (e.name && e.name.toLowerCase().includes(term)) ||
      (e.description && e.description.toLowerCase().includes(term))
    );
    this.totalItems = this.filteredEvents.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage) || 0;
    this.currentPage = 0;
    setTimeout(() => lucide.createIcons(), 0);
  }

  editEvent(event: EventDTO) {
    this.router.navigate(['/admin/event', event.id]);
  }

  addEvent() {
    this.router.navigate(['/admin/event']);
  }

  async deleteEvent(event: EventDTO) {
    const ok = await this.dialog.confirm({
      title: 'Delete event',
      text: `Delete "${event.name}"?`,
      destructive: true,
      confirmText: 'Delete',
    });
    if (!ok) return;
    this.eventService.deleteEvent(event.id!).subscribe({
      next: () => {
        this.dialog.success('Deleted', 'Event has been deleted successfully.');
        this.loadEvent();
      },
      error: () => {
        this.dialog.error('Error', 'Failed to delete event. Please try again.');
      },
    });
  }

  get paginatedEvents(): EventDTO[] {
    const startIndex = this.currentPage * this.itemsPerPage;
    return this.filteredEvents.slice(startIndex, startIndex + this.itemsPerPage);
  }

  onPageChange(page: number): void {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
  }

  trackByEvent = (_: number, row: unknown) => (row as EventDTO).id;

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (this.currentPage >= this.totalPages - 2) {
        for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = this.currentPage - 2; i <= this.currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  }

  // Hero section preview logic
  get heroPreviewEvents(): EventDTO[] {
    // Show only active events; if none, show default events
    const active = this.events.filter(e => e.status === 1 && e.isDefault !== 1);
    if (active.length > 0) {
      return [...active].sort((a, b) => (a.slideNo ?? 0) - (b.slideNo ?? 0));
    }
    // If no active, show default events
    const defaults = this.events.filter(e => e.status === 1 && e.isDefault === 1);
    return [...defaults].sort((a, b) => (a.slideNo ?? 0) - (b.slideNo ?? 0));
  }
}
