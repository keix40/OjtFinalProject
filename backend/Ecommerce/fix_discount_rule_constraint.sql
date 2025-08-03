-- Check the current constraint on target_type column
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'discount_rule'::regclass 
AND contype = 'c';

-- Check what values are currently allowed in the target_type column
SELECT DISTINCT target_type FROM discount_rule;

-- Drop the existing check constraint
ALTER TABLE discount_rule DROP CONSTRAINT IF EXISTS discount_rule_target_type_check;

-- Add a new check constraint that includes VIP_TIER
ALTER TABLE discount_rule 
ADD CONSTRAINT discount_rule_target_type_check 
CHECK (target_type IN ('GLOBAL', 'PRODUCT', 'BRAND', 'CATEGORY', 'BRAND_CATEGORY', 'USER', 'USER_GLOBAL', 'USER_PRODUCT', 'USER_CATEGORY', 'USER_BRAND', 'USER_BRAND_CATEGORY', 'VIP_TIER'));

-- Verify the constraint was added correctly
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'discount_rule'::regclass 
AND contype = 'c';

-- Test inserting a VIP tier discount rule
INSERT INTO discount_rule (target_type, discount_id, vip_role) 
VALUES ('VIP_TIER', 4, 2);

-- Check if the insert worked
SELECT * FROM discount_rule WHERE target_type = 'VIP_TIER' AND vip_role = 2; 