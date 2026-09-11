/** Production uses same-origin relative URLs; Vercel rewrites proxy to Render (see vercel.json). */
export const environment = {
  production: true,
  apiUrl: '/api',
  /** Empty = same-origin; media paths (/product_image, /uploads) are proxied via vercel.json. */
  serverUrl: '',
  googleMapsApiKey: ''
};
