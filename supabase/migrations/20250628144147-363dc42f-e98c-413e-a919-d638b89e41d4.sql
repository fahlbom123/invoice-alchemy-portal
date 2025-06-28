
-- Add first_name and last_name columns to invoice_lines table
ALTER TABLE invoice_lines 
ADD COLUMN first_name text,
ADD COLUMN last_name text;
