import { Pipe, PipeTransform } from '@angular/core';
import { mediaUrl } from './media-url.util';

@Pipe({ name: 'mediaUrl', standalone: true })
export class MediaUrlPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return mediaUrl(value);
  }
}
