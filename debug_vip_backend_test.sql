-- Debug Query to Test VIP Backend Calculation
-- This simulates exactly what the backend Java code is doing

-- Test 1: Check current month VIP customers (end of current month)
SELECT 
    'Current Month VIP Count' as test,
    COUNT(*) as count
FROM users u
JOIN role r ON u.role_id = r.id
WHERE r.name = 'CUSTOMER'
    AND u.total_points >= 10000  -- Exclude Regular tier (same as !getTier().equalsIgnoreCase("Regular"))
    AND u.created_date <= LAST_DAY(CURRENT_DATE());

-- Test 2: Check previous month VIP customers (end of previous month)
SELECT 
    'Previous Month VIP Count' as test,
    COUNT(*) as count
FROM users u
JOIN role r ON u.role_id = r.id
WHERE r.name = 'CUSTOMER'
    AND u.total_points >= 10000  -- Exclude Regular tier
    AND u.created_date <= LAST_DAY(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH));

-- Test 3: Check all VIP customers by tier
SELECT 
    CASE 
        WHEN u.total_points >= 1000000 THEN 'Platinum'
        WHEN u.total_points >= 100000 THEN 'Gold'
        WHEN u.total_points >= 10000 THEN 'Silver'
        ELSE 'Regular'
    END as tier,
    COUNT(*) as count
FROM users u
JOIN role r ON u.role_id = r.id
WHERE r.name = 'CUSTOMER'
    AND u.total_points >= 10000  -- Only VIP tiers
GROUP BY 
    CASE 
        WHEN u.total_points >= 1000000 THEN 'Platinum'
        WHEN u.total_points >= 100000 THEN 'Gold'
        WHEN u.total_points >= 10000 THEN 'Silver'
        ELSE 'Regular'
    END
ORDER BY count DESC;

-- Test 4: Check user creation dates for VIP customers
SELECT 
    u.id,
    u.name,
    u.email,
    u.total_points,
    u.created_date,
    CASE 
        WHEN u.total_points >= 1000000 THEN 'Platinum'
        WHEN u.total_points >= 100000 THEN 'Gold'
        WHEN u.total_points >= 10000 THEN 'Silver'
        ELSE 'Regular'
    END as tier
FROM users u
JOIN role r ON u.role_id = r.id
WHERE r.name = 'CUSTOMER'
    AND u.total_points >= 10000  -- Only VIP tiers
ORDER BY u.created_date DESC; 