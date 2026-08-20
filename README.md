# Ecommerce Project

This is a comprehensive E-commerce platform built with a modern technology stack, featuring a Spring Boot backend and an Angular frontend. The application supports robust user management, product handling, order processing, and analytics.

## Technology Stack

### Backend
- **Framework**: Spring Boot 3.5.0
- **Language**: Java 17
- **Build Tool**: Maven
- **Database**: PostgreSQL (via Supabase) / MySQL (Supported via configuration)
- **Security**: Spring Security, JWT (JSON Web Tokens)
- **Reporting**: JasperReports, Apache POI (Excel/PDF generation)
- **Communication**: WebSocket, REST API
- **Utilities**: Lombok, ModelMapper, Twilio (SMS), JavaMail

### Frontend
- **Framework**: Angular 19
- **Styling**: Tailwind CSS 3.4, Bootstrap 5.3
- **Build Tool**: Angular CLI
- **Maps**: Leaflet
- **Charts**: Chart.js
- **Utils**: SweetAlert2, ngx-toastr, date-fns

## Project Structure

The workspace is organized into two main directories:

- **`backend/Ecommerce`**: The Spring Boot server application.
  - Contains API endpoints, business logic, and database entities.
  - Follows a layered architecture: Controller -> Service -> Repository.
  
- **`frontend/Ecommerce`**: The Angular client application.
  - Contains the user interface, routing, and state management.
  - Configured with Tailwind CSS and Bootstrap.

## Features

- **User Management**: Role-based access control (RBAC), VIP Tiers, Points System.
- **Product Management**: Support for product variants, attributes, brands, and categories.
- **Order Processing**: Order tracking, returns, refunds, and delivery management.
- **Marketing**: Discount rules, events, and newsletter subscriptions.
- **Security**: IP blocking, login attempt tracking, OTP verification, and JWT authentication.
- **Reporting**: Automated generation of PDF and Excel reports for sales and inventory.
- **File Storage**: Integration with Supabase Storage for product images and uploads.

## Getting Started

### Prerequisites
- **Java**: JDK 17 or higher
- **Node.js**: v18 or higher (compatible with Angular 19)
- **Maven**: v3.8+
- **Database**: PostgreSQL or MySQL server

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend/Ecommerce
   ```
2. Configure the database in `src/main/resources/application.properties` (or check `frontend/Ecommerce/backend/src/main/resources/application.properties` for reference config).
3. Build the project:
   ```bash
   mvn clean install
   ```
4. Run the application:
   ```bash
   mvn spring-boot:run
   ```
   The backend server will start on `http://localhost:8080`.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend/Ecommerce
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   ng serve
   ```
4. Access the application at `http://localhost:4200`.

## Configuration

### Database
The application is configured to connect to a database. Ensure your `application.properties` includes the correct credentials:

```properties
spring.datasource.url=jdbc:postgresql://<HOST>:<PORT>/<DB_NAME>
spring.datasource.username=<USERNAME>
spring.datasource.password=<PASSWORD>
```

### Environment Variables (Frontend)
Update `src/environments/environment.ts` with your API URL and Supabase credentials if necessary.

## Documentation
- **Supabase Setup**: See `frontend/Ecommerce/SUPABASE_SETUP.md` for storage configuration.
- **Export Installation**: See `frontend/Ecommerce/EXPORT_INSTALLATION.md` for reporting tool setup.
