
-- Update all suppliers with random payment days values (10, 15, or 20)
UPDATE public.suppliers 
SET payment_days = CASE 
    WHEN (random() * 3)::integer = 0 THEN 10
    WHEN (random() * 3)::integer = 1 THEN 15
    ELSE 20
END
WHERE payment_days IS NULL OR payment_days NOT IN (10, 15, 20);

-- Also update any existing suppliers that don't have these specific values
UPDATE public.suppliers 
SET payment_days = CASE 
    WHEN (random() * 3)::integer = 0 THEN 10
    WHEN (random() * 3)::integer = 1 THEN 15
    ELSE 20
END
WHERE payment_days IS NOT NULL AND payment_days NOT IN (10, 15, 20);
