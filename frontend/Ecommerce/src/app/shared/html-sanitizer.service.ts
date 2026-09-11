import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

@Injectable({ providedIn: 'root' })
export class HtmlSanitizerService {

  constructor(private domSanitizer: DomSanitizer) {}

  sanitize(dirty: string | null | undefined): SafeHtml {
    const clean = DOMPurify.sanitize(dirty ?? '', {
      USE_PROFILES: { html: true },
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|data:image\/):|\/|#)/i
    });
    return this.domSanitizer.bypassSecurityTrustHtml(clean);
  }

  /** Escape plain text for safe display when HTML is not required. */
  escapeText(value: string | null | undefined): string {
    if (value == null) return '';
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
