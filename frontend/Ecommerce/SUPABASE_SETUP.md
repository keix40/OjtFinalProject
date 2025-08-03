# Supabase Storage Setup Guide

## Overview
This guide will help you set up Supabase Storage for your e-commerce application to handle image uploads and storage.

## Prerequisites
- Supabase account and project
- Angular application with the necessary dependencies installed

## Step 1: Install Dependencies
```bash
npm install @supabase/supabase-js
```

## Step 2: Configure Environment Variables

### Update `src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  supabase: {
    url: 'YOUR_SUPABASE_PROJECT_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
  }
};
```

### Get Your Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon public key
4. Replace the placeholders in the environment file

## Step 3: Create Storage Buckets

### Using Supabase Dashboard
1. Go to Storage in your Supabase dashboard
2. Create the following buckets:
   - `product-images` (for product images)
   - `user-avatars` (for user profile images)
   - `brand-images` (for brand logos)

### Using SQL (Alternative)
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-avatars', 'user-avatars', true);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('brand-images', 'brand-images', true);
```

## Step 4: Set Up Storage Policies

### Public Read Access
```sql
-- Allow public read access to product images
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Allow public read access to user avatars
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'user-avatars');

-- Allow public read access to brand images
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'brand-images');
```

### Authenticated Upload Access
```sql
-- Allow authenticated users to upload product images
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to upload user avatars
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'user-avatars' AND auth.role() = 'authenticated');

-- Allow authenticated users to upload brand images
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'brand-images' AND auth.role() = 'authenticated');
```

### Update/Delete Access (Optional)
```sql
-- Allow users to update their own uploads
CREATE POLICY "Users can update own uploads" ON storage.objects
FOR UPDATE USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own uploads" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Step 5: Test the Integration

### Add Test Route
Add the test component to your routing module:

```typescript
// app-routing.module.ts
import { TestSupabaseComponent } from './test-supabase/test-supabase.component';

const routes: Routes = [
  // ... other routes
  { path: 'test-supabase', component: TestSupabaseComponent }
];
```

### Test Upload
1. Navigate to `/test-supabase` in your application
2. Try uploading an image
3. Check if the image appears correctly
4. Verify the connection test works

## Step 6: Usage in Your Application

### Upload Images
```typescript
// In your component
constructor(private imageService: ImageService) {}

async uploadImage(file: File) {
  try {
    const path = await this.imageService.uploadProductImage(file);
    console.log('Image uploaded:', path);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

### Display Images
```typescript
// Get image URL
const imageUrl = this.imageService.getProductImageUrl(product);

// Use in template
<img [src]="imageUrl" [alt]="product.name">
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure your Supabase project allows requests from your domain
   - Check the RLS (Row Level Security) policies

2. **Upload Failures**
   - Verify your anon key is correct
   - Check if the storage bucket exists
   - Ensure the file size is within limits

3. **Image Not Displaying**
   - Check if the bucket is public
   - Verify the image path is correct
   - Check browser console for errors

### Debug Steps
1. Check browser console for errors
2. Verify Supabase credentials in environment file
3. Test connection using the test component
4. Check Supabase dashboard for upload logs

## Security Considerations

1. **File Size Limits**: Set appropriate file size limits in your application
2. **File Type Validation**: Validate file types before upload
3. **Access Control**: Use RLS policies to control access
4. **Image Optimization**: Consider implementing image compression

## Performance Optimization

1. **Lazy Loading**: Use lazy loading for images
2. **CDN**: Supabase Storage automatically serves files via CDN
3. **Caching**: Implement appropriate caching strategies
4. **Image Resizing**: Consider implementing server-side image resizing

## Next Steps

1. Implement image optimization
2. Add image compression
3. Set up automated image processing
4. Implement image galleries
5. Add drag-and-drop upload functionality

## Support

If you encounter issues:
1. Check the Supabase documentation
2. Review the browser console for errors
3. Test with the provided test component
4. Verify your configuration matches this guide 