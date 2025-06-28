
-- First, let's insert more invoice lines into the database to match our booking numbers
INSERT INTO invoice_lines (
  id,
  description,
  quantity,
  unit_price,
  estimated_cost,
  estimated_vat,
  supplier_id,
  supplier_name,
  supplier_part_number,
  booking_number,
  confirmation_number,
  departure_date,
  payment_status,
  currency,
  first_name,
  last_name
) VALUES 
-- Booking BK006
('11111111-1111-1111-1111-111111111106', 'Hotel Accommodation Package', 1, 1500.00, 1500.00, 150.00, 
 (SELECT id FROM suppliers LIMIT 1), 'Office Depot', 'HOT-ACC-001', 'BK006', 'CNF006', '2023-11-25', 'unpaid', 'SEK', 'Lisa', 'Davis'),

-- Booking BK007  
('11111111-1111-1111-1111-111111111107', 'Flight Booking Premium', 1, 2200.00, 2200.00, 220.00,
 (SELECT id FROM suppliers LIMIT 1), 'Tech Solutions Inc.', 'FLT-PREM-001', 'BK007', 'CNF007', '2023-12-08', 'unpaid', 'SEK', 'Robert', 'Miller'),

-- Booking BK008
('11111111-1111-1111-1111-111111111108', 'Car Rental Service', 1, 800.00, 800.00, 80.00,
 (SELECT id FROM suppliers LIMIT 1), 'Global Manufacturing Ltd.', 'CAR-RENT-001', 'BK008', 'CNF008', '2024-01-15', 'unpaid', 'SEK', 'Emily', 'Wilson'),

-- Booking BK009
('11111111-1111-1111-1111-111111111109', 'Conference Registration', 1, 1200.00, 1200.00, 120.00,
 (SELECT id FROM suppliers LIMIT 1), 'Best Equipment Co.', 'CONF-REG-001', 'BK009', 'CNF009', '2024-02-22', 'unpaid', 'SEK', 'Christopher', 'Garcia'),

-- Booking BK010
('11111111-1111-1111-1111-111111111110', 'Travel Insurance Premium', 1, 300.00, 300.00, 30.00,
 (SELECT id FROM suppliers LIMIT 1), 'Office Depot', 'TRV-INS-001', 'BK010', 'CNF010', '2024-03-10', 'unpaid', 'SEK', 'Amanda', 'Martinez'),

-- Booking BK011
('11111111-1111-1111-1111-111111111111', 'Business Class Flight', 1, 3500.00, 3500.00, 350.00,
 (SELECT id FROM suppliers LIMIT 1), 'Tech Solutions Inc.', 'BIZ-FLT-001', 'BK011', 'CNF011', '2024-04-18', 'unpaid', 'SEK', 'James', 'Anderson'),

-- Booking BK012
('11111111-1111-1111-1111-111111111112', 'Luxury Hotel Suite', 1, 2800.00, 2800.00, 280.00,
 (SELECT id FROM suppliers LIMIT 1), 'Global Manufacturing Ltd.', 'LUX-HOT-001', 'BK012', 'CNF012', '2024-05-22', 'unpaid', 'SEK', 'Jessica', 'Taylor'),

-- Booking BK013
('11111111-1111-1111-1111-111111111113', 'Executive Car Service', 1, 1500.00, 1500.00, 150.00,
 (SELECT id FROM suppliers LIMIT 1), 'Best Equipment Co.', 'EXEC-CAR-001', 'BK013', 'CNF013', '2024-06-14', 'unpaid', 'SEK', 'William', 'Thomas'),

-- Booking BK014
('11111111-1111-1111-1111-111111111114', 'International Data Plan', 1, 200.00, 200.00, 20.00,
 (SELECT id FROM suppliers LIMIT 1), 'Office Depot', 'INT-DATA-001', 'BK014', 'CNF014', '2024-07-09', 'unpaid', 'SEK', 'Ashley', 'Jackson'),

-- Booking BK015
('11111111-1111-1111-1111-111111111115', 'Airport Lounge Access', 1, 150.00, 150.00, 15.00,
 (SELECT id FROM suppliers LIMIT 1), 'Tech Solutions Inc.', 'LOUNGE-001', 'BK015', 'CNF015', '2024-08-16', 'unpaid', 'SEK', 'Daniel', 'White'),

-- Booking BK016
('11111111-1111-1111-1111-111111111116', 'Event Catering Service', 1, 2500.00, 2500.00, 250.00,
 (SELECT id FROM suppliers LIMIT 1), 'Global Manufacturing Ltd.', 'EVENT-CAT-001', 'BK016', 'CNF016', '2024-09-23', 'unpaid', 'SEK', 'Stephanie', 'Harris'),

-- Booking BK017
('11111111-1111-1111-1111-111111111117', 'Professional Photography', 1, 1800.00, 1800.00, 180.00,
 (SELECT id FROM suppliers LIMIT 1), 'Best Equipment Co.', 'PHOTO-PRO-001', 'BK017', 'CNF017', '2024-10-11', 'unpaid', 'SEK', 'Matthew', 'Martin'),

-- Booking BK018
('11111111-1111-1111-1111-111111111118', 'Translation Services', 1, 600.00, 600.00, 60.00,
 (SELECT id FROM suppliers LIMIT 1), 'Office Depot', 'TRANS-SRV-001', 'BK018', 'CNF018', '2024-11-07', 'unpaid', 'SEK', 'Nicole', 'Thompson'),

-- Booking BK019
('11111111-1111-1111-1111-111111111119', 'VIP Transport Package', 1, 3200.00, 3200.00, 320.00,
 (SELECT id FROM suppliers LIMIT 1), 'Tech Solutions Inc.', 'VIP-TRANS-001', 'BK019', 'CNF019', '2024-12-19', 'unpaid', 'SEK', 'Kevin', 'Clark'),

-- Booking BK020
('11111111-1111-1111-1111-111111111120', 'Equipment Rental Package', 1, 900.00, 900.00, 90.00,
 (SELECT id FROM suppliers LIMIT 1), 'Global Manufacturing Ltd.', 'EQUIP-RENT-001', 'BK020', 'CNF020', '2025-01-25', 'unpaid', 'SEK', 'Rachel', 'Lewis'),

-- Add more lines for existing bookings to increase variety
-- Additional line for BK001
('11111111-1111-1111-1111-111111111121', 'Extra Baggage Service', 1, 200.00, 200.00, 20.00,
 (SELECT id FROM suppliers LIMIT 1), 'Tech Solutions Inc.', 'EXTRA-BAG-001', 'BK001', 'CNF001', '2023-07-15', 'unpaid', 'SEK', 'John', 'Doe'),

-- Additional line for BK002
('11111111-1111-1111-1111-111111111122', 'Meal Upgrade Service', 1, 150.00, 150.00, 15.00,
 (SELECT id FROM suppliers LIMIT 1), 'Office Depot', 'MEAL-UPG-001', 'BK002', 'CNF002', '2023-08-20', 'unpaid', 'SEK', 'Jane', 'Smith'),

-- Additional line for BK003
('11111111-1111-1111-1111-111111111123', 'Priority Check-in Service', 1, 100.00, 100.00, 10.00,
 (SELECT id FROM suppliers LIMIT 1), 'Global Manufacturing Ltd.', 'PRIORITY-001', 'BK003', 'CNF003', '2023-09-10', 'unpaid', 'SEK', 'Michael', 'Johnson'),

-- Additional line for BK004
('11111111-1111-1111-1111-111111111124', 'Spa Treatment Package', 1, 500.00, 500.00, 50.00,
 (SELECT id FROM suppliers LIMIT 1), 'Best Equipment Co.', 'SPA-TREAT-001', 'BK004', 'CNF004', '2023-06-05', 'unpaid', 'SEK', 'Sarah', 'Williams'),

-- Additional line for BK005
('11111111-1111-1111-1111-111111111125', 'Tour Guide Service', 1, 400.00, 400.00, 40.00,
 (SELECT id FROM suppliers LIMIT 1), 'Office Depot', 'TOUR-GUIDE-001', 'BK005', 'CNF005', '2023-10-12', 'unpaid', 'SEK', 'David', 'Brown');
