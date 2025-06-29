
-- Update some existing suppliers with payment days values for testing
UPDATE public.suppliers 
SET payment_days = 30 
WHERE name = 'ABC Construction Ltd';

UPDATE public.suppliers 
SET payment_days = 45 
WHERE name = 'Best Equipment Co.';

-- You can add more suppliers or change these values as needed
-- This is just to demonstrate that the feature works
