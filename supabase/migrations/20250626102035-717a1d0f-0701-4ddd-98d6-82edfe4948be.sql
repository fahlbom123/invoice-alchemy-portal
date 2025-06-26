
-- Add IBAN and SWIFT columns to suppliers table
ALTER TABLE suppliers 
ADD COLUMN iban text,
ADD COLUMN swift text;
