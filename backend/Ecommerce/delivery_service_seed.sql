-- Optional manual seed when delivery_service is empty (also runs automatically on app startup via DataInitializer).
-- Safe to run multiple times only if the table is empty.

INSERT INTO address (address, city, state, postal_code, country, latitude, longitude, type)
SELECT 'No. 1, Pyay Road', 'Yangon', 'Yangon Region', '11181', 'Myanmar', 16.866069, 96.195132, 'SHIPPING'
WHERE NOT EXISTS (SELECT 1 FROM delivery_service LIMIT 1);

INSERT INTO delivery_service (name, fee_per_km, phone_number, status, address_id)
SELECT 'Royal Express', 100.00, '09248102838', 1, a.id
FROM address a
WHERE a.address = 'No. 1, Pyay Road'
  AND NOT EXISTS (SELECT 1 FROM delivery_service LIMIT 1);
