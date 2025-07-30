# Export Functionality Installation Guide

This guide explains how to install the required dependencies for Excel and PDF export functionality in the Order Management page.

## Required Dependencies

The export functionality requires the following npm packages:

```bash
npm install xlsx jspdf jspdf-autotable file-saver @types/file-saver
```

## Package Descriptions

- **xlsx**: Library for reading and writing Excel files
- **jspdf**: Library for generating PDF documents
- **jspdf-autotable**: Plugin for jsPDF to create tables in PDF
- **file-saver**: Library for saving files on the client side
- **@types/file-saver**: TypeScript definitions for file-saver

## Features Added

### Excel Export
- Exports order data to Excel (.xlsx) format
- Includes comprehensive order information
- Auto-sized columns for better readability
- Filename includes current date

### PDF Export
- Exports order data to PDF format
- Landscape orientation for better table layout
- Professional styling with headers and alternating row colors
- Includes report title and generation date

### Export Options
1. **Export All**: Export all filtered orders
2. **Export Selected**: Export only selected orders (when checkboxes are used)
3. **Filtered Export**: Export orders based on current filters (status, date range)

## Usage

1. Navigate to the Order Management page
2. Use the filter options to narrow down orders if needed
3. Select specific orders using checkboxes (optional)
4. Click the export buttons:
   - **Export Excel**: Downloads Excel file
   - **Export PDF**: Downloads PDF file
   - **Export Selected**: Exports only selected orders

## File Naming Convention

- Excel files: `orders_YYYY-MM-DD.xlsx`
- PDF files: `orders_YYYY-MM-DD.pdf`

## Data Included in Export

### Excel Export Fields:
- Order Code
- Order Date
- Status
- Customer Name
- Email
- Phone
- Delivery Method
- Delivery Fee
- Subtotal
- Discount Amount
- Total
- Total Items
- Products Count
- Address
- Discount Code
- Discount Type

### PDF Export Fields:
- Order Code
- Date
- Status
- Customer
- Total
- Items
- Delivery Method

## Troubleshooting

If you encounter any issues:

1. Make sure all dependencies are installed correctly
2. Check browser console for any JavaScript errors
3. Ensure the backend API is running and accessible
4. Verify that the order data is loading correctly

## Browser Compatibility

The export functionality works in all modern browsers that support:
- ES6 modules
- File API
- Blob API 