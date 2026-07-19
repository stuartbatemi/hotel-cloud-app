-- Hotel Cloud Solution — PostgreSQL schema
-- Run this once against your Aiven PostgreSQL database (the "public" schema is fine).

DO $$ BEGIN
  CREATE TYPE room_status AS ENUM ('available','occupied','cleaning','maintenance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE staff_role AS ENUM ('front_desk','housekeeping','finance','management');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM ('confirmed','checked_in','checked_out','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE booking_source AS ENUM ('walk_in','phone','website','travel_agent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  room_number VARCHAR(10) NOT NULL UNIQUE,
  room_type VARCHAR(50) NOT NULL,
  rate_per_night NUMERIC(10,2) NOT NULL,
  status room_status NOT NULL DEFAULT 'available'
);

CREATE TABLE IF NOT EXISTS guests (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(128) UNIQUE, -- links to Firebase Authentication account, if the guest has one
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  phone VARCHAR(30),
  nationality VARCHAR(80),
  id_document_url VARCHAR(255), -- points to a file in Firebase Cloud Storage
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role staff_role NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  guest_id INT NOT NULL REFERENCES guests(id),
  room_id INT NOT NULL REFERENCES rooms(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status reservation_status NOT NULL DEFAULT 'confirmed',
  booking_source booking_source NOT NULL DEFAULT 'website',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  reservation_id INT NOT NULL REFERENCES reservations(id),
  amount NUMERIC(10,2) NOT NULL,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  invoice_pdf_url VARCHAR(255), -- points to a file in Firebase Cloud Storage
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- A few sample rooms to test against once the connection is live.
INSERT INTO rooms (room_number, room_type, rate_per_night, status) VALUES
  ('101', 'Standard', 45000.00, 'available'),
  ('102', 'Standard', 45000.00, 'available'),
  ('201', 'Deluxe', 75000.00, 'available'),
  ('301', 'Suite', 120000.00, 'available')
ON CONFLICT (room_number) DO NOTHING;
