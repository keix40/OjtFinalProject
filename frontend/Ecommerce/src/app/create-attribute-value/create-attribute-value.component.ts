import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AttributeService } from '../services/attribute.service';
import { Attribute, AttributeValue, AttributeAndValueDTO } from '../attribute';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-attribute-value',
  standalone: true,
  templateUrl: './create-attribute-value.component.html',
  styleUrl: './create-attribute-value.component.css',
  imports: [CommonModule, FormsModule]
})
export class CreateAttributeValueComponent implements OnInit {
  @Input() attributeId!: number;
  @Input() createMode: boolean = false;
  @Output() attributeSaved = new EventEmitter<void>();

  attribute: Attribute | null = null;
  values: AttributeValue[] = [];
  editingValueId: number | null = null;
  editValue: string = '';
  editAttributeName: string = '';
  editingName: boolean = false;

  formAttributeName: string = '';
  formValues: { id?: number; value: string }[] = [];
  newValue: string = '';
  isColorAttribute: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private attributeService: AttributeService
  ) {}

  ngOnInit(): void {
    if (this.createMode) {
      this.formAttributeName = '';
      this.formValues = [];
    } else if (this.attributeId) {
      this.attributeService.getValueById(this.attributeId).subscribe((dtos: AttributeAndValueDTO[]) => {
        if (dtos && dtos.length > 0) {
          this.attribute = {
            id: dtos[0].attributeId!,
            name: dtos[0].attributeName || ''
          };
          this.formAttributeName = this.attribute.name;
          this.formValues = (dtos[0].values || []).map(v => ({ id: v.id, value: v.value }));
          this.checkIfColorAttribute(); // Check on init
        } else {
          this.attribute = null;
          this.formAttributeName = '';
          this.formValues = [];
        }
      });
    }
  }

  checkIfColorAttribute(): void {
    const name = this.formAttributeName.toLowerCase().trim();
    this.isColorAttribute = ['color', 'colors', 'colour', 'colours'].includes(name);
  }

  // Helper to convert color name to hex
  private colorNameToHex(color: string): string | null {
    if (typeof document === 'undefined') return null; // Guard for non-browser environments
    if (color.startsWith('#')) {
      // Basic hex validation
      return /^#[0-9A-F]{6}$/i.test(color) || /^#[0-9A-F]{3}$/i.test(color) ? color : null;
    }
    const d = document.createElement('div');
    d.style.color = color;
    document.body.appendChild(d);
    const computedColor = window.getComputedStyle(d).color;
    document.body.removeChild(d);
    
    if (!computedColor || computedColor === 'rgba(0, 0, 0, 0)') return null;

    const rgb = computedColor.match(/\d+/g)?.map(Number);
    if (!rgb || rgb.length < 3) return null;
    
    return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1).toUpperCase();
  }

  addValue() {
    let val = this.newValue.trim();
    if (this.isColorAttribute) {
      const hex = this.colorNameToHex(val);
      if (!hex) {
        Swal.fire({ icon: 'error', title: 'Invalid Color', text: `Could not recognize "${val}" as a color.`});
        return;
      }
      val = hex;
    }

    if (val && !this.formValues.some(v => v.value.toLowerCase() === val.toLowerCase())) {
      this.formValues.push({ value: val });
      this.newValue = '';
    }
  }

  removeValue(idx: number) {
    if (idx >= 0 && idx < this.formValues.length) {
      this.formValues.splice(idx, 1);
    }
  }

  startEditName() {
    this.editingName = true;
    this.editAttributeName = this.formAttributeName;
  }

  saveEditName() {
    if (this.editAttributeName.trim()) {
      this.formAttributeName = this.editAttributeName;
      this.editingName = false;
    }
  }

  cancelEditName() {
    this.editingName = false;
    this.editAttributeName = this.formAttributeName;
  }

  startEditValue(val: { id?: number; value: string }, idx: number) {
    this.editingValueId = idx;
    this.editValue = val.value;
  }

  saveEditValue(idx: number) {
    let val = this.editValue.trim();
    if (this.isColorAttribute) {
      const hex = this.colorNameToHex(val);
      if (!hex) {
        Swal.fire({ icon: 'error', title: 'Invalid Color', text: `Could not recognize "${val}" as a color.`});
        return;
      }
      val = hex;
    }

    if (val) {
      this.formValues[idx].value = val;
      this.editingValueId = null;
    }
  }

  cancelEditValue() {
    this.editingValueId = null;
  }

  saveAttribute() {
    const trimmedName = this.formAttributeName.trim();
    if (!trimmedName) {
      Swal.fire({ icon: 'error', title: 'Attribute name is required.' });
      return;
    }
    // Check for duplicate values (case-insensitive)
    const valueSet = new Set<string>();
    for (const v of this.formValues) {
      const val = v.value.trim().toLowerCase();
      if (valueSet.has(val)) {
        Swal.fire({ icon: 'error', title: 'Duplicate Value', text: `The value "${v.value}" is duplicated.` });
        return;
      }
      valueSet.add(val);
    }
    if (this.formValues.length === 0) {
      Swal.fire({ icon: 'error', title: 'At least one attribute value is required.' });
      return;
    }
    const dto: AttributeAndValueDTO = {
      attributeId: this.createMode ? undefined : this.attributeId,
      attributeName: trimmedName,
      values: this.formValues.map(v => v.id ? { id: v.id, value: v.value } : { value: v.value })
    };
    this.attributeService.create(dto).subscribe(() => {
      Swal.fire({ icon: 'success', title: this.createMode ? 'Attribute created successfully!' : 'Attribute updated successfully!', confirmButtonText: 'OK' }).then(() => {
        this.attributeSaved.emit();
        this.closeModal();
      });
    });
  }

  closeModal() {
    this.activeModal.close('closed');
  }
}
