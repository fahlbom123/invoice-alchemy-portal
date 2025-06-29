
-- Add payment_days column to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN payment_days integer;

-- Add a comment to describe the column
COMMENT ON COLUMN public.suppliers.payment_days IS 'Number of days for payment terms';
