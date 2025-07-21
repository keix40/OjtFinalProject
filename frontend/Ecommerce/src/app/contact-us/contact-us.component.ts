import { Component } from '@angular/core';
import { ContactService, ContactMessage } from '../services/contact.service';

@Component({
  selector: 'app-contact-us',
  standalone: false,
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css'
})
export class ContactUsComponent {
  contact: ContactMessage = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  loading = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';

  constructor(private contactService: ContactService) {}

  validateEmail(email: string): boolean {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  }

  isValid(): boolean {
    return (
      this.contact.name.trim() !== '' &&
      this.contact.email.trim() !== '' &&
      this.validateEmail(this.contact.email) &&
      this.contact.subject.trim() !== '' &&
      this.contact.message.trim() !== ''
    );
  }

  resetForm() {
    this.contact = {
      name: '',
      email: '',
      subject: '',
      message: ''
    };
    this.submitted = false;
  }

  onSubmit() {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.isValid()) return;

    this.loading = true;
    this.contactService.sendContactMessage(this.contact).subscribe({
      next: (response) => {
        this.successMessage = 'Your message has been sent successfully!';
        this.errorMessage = '';
        this.loading = false;
        this.resetForm();
      },
      error: (error) => {
        // If the request was successful but returned no content
        if (error.status === 200 || error.status === 201 || error.status === 204) {
          this.successMessage = 'Your message has been sent successfully!';
          this.errorMessage = '';
          this.loading = false;
          this.resetForm();
        } else {
          this.errorMessage = 'Failed to send your message. Please try again later.';
          this.successMessage = '';
          this.loading = false;
        }
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
