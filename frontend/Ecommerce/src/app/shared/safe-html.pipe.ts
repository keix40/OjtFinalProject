import { Pipe, PipeTransform } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { HtmlSanitizerService } from './html-sanitizer.service';

@Pipe({ name: 'safeHtml', standalone: true })
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: HtmlSanitizerService) {}

  transform(value: string | null | undefined): SafeHtml {
    return this.sanitizer.sanitize(value);
  }
}
