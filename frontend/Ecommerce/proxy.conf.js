// Local dev proxy. Production uses the same paths via vercel.json rewrites.
// Browser navigations (Accept: text/html) stay in the Angular app; XHR/fetch go to Spring Boot.
const API_PREFIXES = [
  "/api",
  "/product",
  "/category",
  "/brand",
  "/attribute",
  "/events",
  "/event",
  "/deliveryservice",
  "/order",
  "/returns",
  "/wishlist",
  "/card",
  "/product_image",
  "/uploads",
  "/upload",
  "/review",
  "/return_images",
  "/brand_and_category_image",
];

module.exports = API_PREFIXES.map((context) => ({
  context: [context],
  target: "http://127.0.0.1:8080",
  secure: false,
  changeOrigin: true,
  logLevel: "warn",
  bypass(req) {
    const accept = req.headers.accept || "";
    if (accept.includes("text/html")) {
      return "/index.html";
    }
    return null;
  },
}));
