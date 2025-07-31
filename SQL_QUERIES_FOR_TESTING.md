# SQL Queries for Testing Dashboard Analytics

## Quick Debug Tests (Run These First)

### 1. Check if you have any data at all
```sql
-- Check total orders
SELECT COUNT(*) as total_orders FROM user_order;

-- Check if any orders have products
SELECT COUNT(*) as orders_with_products 
FROM user_order uo
JOIN user_order_has_product uohp ON uo.id = uohp.user_order_id;

-- Check if any products have brands
SELECT COUNT(*) as products_with_brands 
FROM products p
JOIN brand b ON p.brand_id = b.id;
```

### 2. Check status values
```sql
-- See all available status names
SELECT id, name FROM status;

-- Check if any orders have 'DELIVERED' status
SELECT COUNT(*) as delivered_orders 
FROM user_order uo
JOIN order_status osh ON uo.id = osh.order_id
JOIN status s ON osh.status_id = s.id
WHERE s.name = 'DELIVERED';
```

### 3. Simple test without status filter
```sql
-- Test brand sales without status filter
SELECT 
    b.name as name,
    COUNT(uohp.id) as value
FROM user_order uo
JOIN user_order_has_product uohp ON uo.id = uohp.user_order_id
JOIN products p ON uohp.product_id = p.id
JOIN brand b ON p.brand_id = b.id
GROUP BY b.id, b.name
ORDER BY value DESC;
```

## Table Names Reference
- `user_order` - Main orders table
- `user_order_has_product` - Order products junction table
- `products` - Products table (note: not "product")
- `brand` - Brands table
- `product_has_category` - Product-category junction table
- `category` - Categories table
- `order_status` - Order status history table
- `status` - Status definitions table
- `delivery_service` - Delivery services table

## 1. Brand Sales Data Query

```sql
SELECT 
    b.name as name,
    COUNT(uohp.id) as value
FROM user_order uo
JOIN user_order_has_product uohp ON uo.id = uohp.user_order_id
JOIN products p ON uohp.product_id = p.id
JOIN brand b ON p.brand_id = b.id
JOIN order_status osh ON uo.id = osh.order_id
JOIN status s ON osh.status_id = s.id
WHERE uo.order_date BETWEEN '2024-01-01 00:00:00' AND '2024-12-31 23:59:59'
    AND s.name = 'DELIVERED'
GROUP BY b.id, b.name
ORDER BY value DESC;
```

## 2. Category Sales Data Query

```sql
SELECT 
    c.name as name,
    COUNT(uohp.id) as value
FROM user_order uo
JOIN user_order_has_product uohp ON uo.id = uohp.user_order_id
JOIN products p ON uohp.product_id = p.id
JOIN product_has_category phc ON p.id = phc.product_id
JOIN category c ON phc.category_id = c.id
JOIN order_status osh ON uo.id = osh.order_id
JOIN status s ON osh.status_id = s.id
WHERE uo.order_date BETWEEN '2024-01-01 00:00:00' AND '2024-12-31 23:59:59'
    AND s.name = 'DELIVERED'
GROUP BY c.id, c.name
ORDER BY value DESC;
```

## 3. Product Sales Data Query

```sql
SELECT 
    p.product_name as name,
    COUNT(uohp.id) as value
FROM user_order uo
JOIN user_order_has_product uohp ON uo.id = uohp.user_order_id
JOIN products p ON uohp.product_id = p.id
JOIN order_status osh ON uo.id = osh.order_id
JOIN status s ON osh.status_id = s.id
WHERE uo.order_date BETWEEN '2024-01-01 00:00:00' AND '2024-12-31 23:59:59'
    AND s.name = 'DELIVERED'
GROUP BY p.id, p.product_name
ORDER BY value DESC
LIMIT 10;
```

## 4. Delivery Service Data Query

```sql
SELECT 
    ds.name as name,
    COUNT(uo.id) as value
FROM user_order uo
JOIN delivery_service ds ON uo.delivery_service_id = ds.id
JOIN order_status osh ON uo.id = osh.order_id
JOIN status s ON osh.status_id = s.id
WHERE uo.order_date BETWEEN '2024-01-01 00:00:00' AND '2024-12-31 23:59:59'
    AND s.name = 'DELIVERED'
GROUP BY ds.id, ds.name
ORDER BY value DESC;
```

## Test Queries with Different Date Ranges

### Today's Data
```sql
-- Replace the date range in any query above with:
WHERE uo.order_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
```

### This Week's Data
```sql
-- Replace the date range in any query above with:
WHERE uo.order_date BETWEEN DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) 
    AND DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
```

### This Month's Data
```sql
-- Replace the date range in any query above with:
WHERE uo.order_date BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') 
    AND DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH)
```

## Debugging Queries

### Check if orders exist
```sql
SELECT COUNT(*) as total_orders FROM user_order;
```

### Check if delivered orders exist
```sql
SELECT COUNT(*) as delivered_orders 
FROM user_order uo
JOIN order_status osh ON uo.id = osh.order_id
JOIN status s ON osh.status_id = s.id
WHERE s.name = 'DELIVERED';
```

### Check status values
```sql
SELECT id, name FROM status;
```

### Check order status relationships
```sql
SELECT 
    uo.id as order_id,
    uo.order_date,
    s.name as status_name,
    osh.status_date
FROM user_order uo
JOIN order_status osh ON uo.id = osh.order_id
JOIN status s ON osh.status_id = s.id
ORDER BY uo.order_date DESC
LIMIT 10;
```

### Check product relationships
```sql
SELECT 
    p.id as product_id,
    p.product_name,
    b.name as brand_name,
    COUNT(uohp.id) as order_count
FROM products p
LEFT JOIN brand b ON p.brand_id = b.id
LEFT JOIN user_order_has_product uohp ON p.id = uohp.product_id
GROUP BY p.id, p.product_name, b.name
ORDER BY order_count DESC
LIMIT 10;
```

## Notes

1. **Table Names**: The main products table is named `products` (plural), not `product`
2. **Status Filtering**: We filter by `s.name = 'DELIVERED'` to only count completed orders
3. **Date Format**: Use `YYYY-MM-DD HH:MM:SS` format for date comparisons
4. **Junction Tables**: 
   - `user_order_has_product` links orders to products
   - `product_has_category` links products to categories
   - `order_status` links orders to their status history
5. **Column Names**: 
   - `user_order_id` in junction tables (not `order_id`)
   - `product_id` in junction tables
   - `category_id` in product_has_category table
   - `status_id` in order_status table

## Common Issues to Check

1. **No Data**: Check if there are any orders with 'DELIVERED' status
2. **Wrong Status Name**: Verify the exact status name in the status table
3. **Date Range**: Ensure the date range includes actual order data
4. **Relationships**: Verify that products are linked to brands and categories
5. **Delivery Service**: Check if orders have delivery_service_id populated 