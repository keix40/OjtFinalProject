import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirm-model',
  standalone: false,
  templateUrl: './confirm-model.component.html',
  styleUrl: './confirm-model.component.css'
})
export class ConfirmModelComponent {
  @Input() message = 'Are you sure?';
  constructor(public activeModal: NgbActiveModal) {}
}
