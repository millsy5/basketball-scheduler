-- Add new columns to existing bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT 2026;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Boys';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS school TEXT DEFAULT 'Ballincollig Basketball Club';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_year ON bookings(year);
CREATE INDEX IF NOT EXISTS idx_bookings_school ON bookings(school);
CREATE INDEX IF NOT EXISTS idx_bookings_gender ON bookings(gender);
