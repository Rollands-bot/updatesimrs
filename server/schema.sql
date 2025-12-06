-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DATA MASTER
-- Users (Admin, Staff, Doctors, Nurses, etc.)
CREATE TABLE IF NOT EXISTS public.users (
    id BIGINT PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::bigint,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'staff_pendaftaran', 'dokter', 'perawat', 'apoteker', 'analis_lab', 'radiografer', 'kasir', 'manajemen')),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Polyclinics / Units
CREATE TABLE IF NOT EXISTS public.polyclinics (
    id BIGINT PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::bigint,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'rawat_jalan', 'igd', 'penunjang'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Doctors (Linked to Users)
CREATE TABLE IF NOT EXISTS public.doctors (
    id BIGINT PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::bigint,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    sip TEXT,
    str TEXT,
    specialization TEXT,
    polyclinic_id BIGINT REFERENCES public.polyclinics(id),
    schedule TEXT, -- JSON or text description
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Patients
CREATE TABLE IF NOT EXISTS public.patients (
    id BIGINT PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::bigint,
    name TEXT NOT NULL,
    nik TEXT UNIQUE,
    phone TEXT,
    address TEXT,
    dob DATE,
    gender TEXT CHECK (gender IN ('L', 'P')),
    insurance_type TEXT DEFAULT 'UMUM', -- 'BPJS', 'UMUM', 'ASURANSI_LAIN'
    insurance_number TEXT,
    allergies TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Medicines / Alkes
CREATE TABLE IF NOT EXISTS public.medicines (
    id BIGINT PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::bigint,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    category TEXT, -- 'obat_keras', 'obat_bebas', 'alkes'
    form TEXT, -- 'tablet', 'sirup', 'injeksi'
    stock INTEGER DEFAULT 0,
    price NUMERIC(12, 2) DEFAULT 0,
    unit TEXT, -- 'strip', 'botol', 'pcs'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Rooms & Beds (Inpatient)
CREATE TABLE IF NOT EXISTS public.rooms (
    id BIGINT PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::bigint,
    name TEXT NOT NULL,
    class TEXT, -- 'VVIP', 'VIP', 'I', 'II', 'III'
    price_per_day NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beds (
    id BIGINT PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::bigint,
    room_id BIGINT REFERENCES public.rooms(id),
    bed_number TEXT NOT NULL,
    status TEXT DEFAULT 'available', -- 'available', 'occupied', 'maintenance'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Medical Procedures / Actions
CREATE TABLE IF NOT EXISTS public.procedures (
    id BIGINT PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::bigint,
    name TEXT NOT NULL,
    code TEXT, -- ICD-9 CM or internal code
    category TEXT, -- 'konsultasi', 'tindakan_medis', 'lab', 'radiologi'
    price NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. OPERASIONAL PASIEN
-- Visits (Registration)
CREATE TABLE IF NOT EXISTS public.visits (
    id BIGINT PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::bigint,
    patient_id BIGINT REFERENCES public.patients(id) NOT NULL,
    doctor_id BIGINT REFERENCES public.doctors(id),
    polyclinic_id BIGINT REFERENCES public.polyclinics(id),
    queue_number INTEGER,
    status TEXT DEFAULT 'registered', -- 'registered', 'in_consultation', 'pharmacy', 'lab', 'radiology', 'billing', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Medical Records (SOAP)
CREATE TABLE IF NOT EXISTS public.medical_records (
    id BIGINT PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::bigint,
    visit_id BIGINT REFERENCES public.visits(id) ON DELETE CASCADE NOT NULL,
    subjective TEXT, -- Keluhan
    objective TEXT, -- Pemeriksaan Fisik
    assessment TEXT, -- Diagnosa
    plan TEXT, -- Terapi / Rencana
    icd10_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Prescriptions (Resep)
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id BIGINT PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::bigint,
    visit_id BIGINT REFERENCES public.visits(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'completed'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prescription_items (
    id BIGINT PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::bigint,
    prescription_id BIGINT REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    medicine_id BIGINT REFERENCES public.medicines(id),
    quantity INTEGER NOT NULL,
    dosage TEXT, -- '3x1 sesudah makan'
    notes TEXT
);

-- Lab & Radiology Requests
CREATE TABLE IF NOT EXISTS public.service_requests (
    id BIGINT PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::bigint,
    visit_id BIGINT REFERENCES public.visits(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'lab', 'radiology'
    procedure_id BIGINT REFERENCES public.procedures(id),
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    results TEXT, -- Or link to file
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inpatient Admissions
CREATE TABLE IF NOT EXISTS public.inpatient_admissions (
    id BIGINT PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::bigint,
    patient_id BIGINT REFERENCES public.patients(id) NOT NULL,
    bed_id BIGINT REFERENCES public.beds(id) NOT NULL,
    admission_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    discharge_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'admitted', -- 'admitted', 'discharged'
    diagnosis_entry TEXT,
    diagnosis_exit TEXT
);

-- 3. BILLING / KEUANGAN
CREATE TABLE IF NOT EXISTS public.transactions (
    id BIGINT PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::bigint,
    visit_id BIGINT REFERENCES public.visits(id) ON DELETE CASCADE, -- Nullable for direct sales?
    patient_id BIGINT REFERENCES public.patients(id),
    total_amount NUMERIC(12, 2) DEFAULT 0,
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
    payment_method TEXT, -- 'cash', 'transfer', 'bpjs', 'insurance'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transaction_items (
    id BIGINT PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::bigint,
    transaction_id BIGINT REFERENCES public.transactions(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, -- 'procedure', 'medicine', 'room', 'registration'
    item_id BIGINT, -- ID of the referenced item
    item_name TEXT, -- Snapshot of name
    quantity INTEGER DEFAULT 1,
    price NUMERIC(12, 2) NOT NULL, -- Snapshot of price
    subtotal NUMERIC(12, 2) NOT NULL
);

-- Default Users Seed
INSERT INTO public.users (id, username, password, role, name) VALUES
(1, 'superadmin', 'admin123', 'super_admin', 'Super Admin'),
(2, 'dokter1', '123', 'dokter', 'Dr. Budi Santoso'),
(3, 'staff1', '123', 'staff_pendaftaran', 'Siti Aminah'),
(4, 'kasir1', '123', 'kasir', 'Rina Finance'),
(5, 'apotek1', '123', 'apoteker', 'Andi Pharma')
ON CONFLICT (username) DO NOTHING;

-- =================================================================
-- MIGRATION / UPDATE SCRIPT (Run this to fix existing tables)
-- =================================================================

-- 1. Fix Patients Table (Add missing columns if table already exists)
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS nik TEXT UNIQUE;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('L', 'P'));
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS insurance_type TEXT DEFAULT 'UMUM';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS insurance_number TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS allergies TEXT;

-- 2. Fix Medicines Table
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS form TEXT;
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS unit TEXT;

-- 3. Fix Visits Table (Add queue number and doctor_id if missing)
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS queue_number INTEGER;
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS doctor_id BIGINT REFERENCES public.doctors(id);
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS polyclinic_id BIGINT REFERENCES public.polyclinics(id);

-- 4. Fix Transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 5. Fix Medical Records (Add missing SOAP columns)
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS subjective TEXT;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS objective TEXT;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS assessment TEXT;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS plan TEXT;
ALTER TABLE public.medical_records ADD COLUMN IF NOT EXISTS icd10_code TEXT;

-- 6. Set Timezone to Asia/Jakarta
ALTER DATABASE postgres SET timezone TO 'Asia/Jakarta';

-- 7. Add Medical Record Number (No. RM) Column
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS no_rm TEXT UNIQUE;

-- 8. Seed RM for existing patients (if null)
-- Format: YYYYMM-XXXX (based on ID)
UPDATE public.patients 
SET no_rm = to_char(created_at, 'YYMMDD-XXXX') || '-' || lpad(id::text, 4, '0')
WHERE no_rm IS NULL;

-- Update DEFAULT values to respect the new timezone (now() instead of UTC forced)
-- Only run these if the tables exist
DO $$ 
BEGIN
    -- Patients
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'patients') THEN
        ALTER TABLE public.patients ALTER COLUMN created_at SET DEFAULT now();
    END IF;

    -- Users
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE public.users ALTER COLUMN created_at SET DEFAULT now();
    END IF;

    -- Polyclinics
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'polyclinics') THEN
        ALTER TABLE public.polyclinics ALTER COLUMN created_at SET DEFAULT now();
    END IF;

    -- Doctors
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'doctors') THEN
        ALTER TABLE public.doctors ALTER COLUMN created_at SET DEFAULT now();
    END IF;

    -- Medicines
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'medicines') THEN
        ALTER TABLE public.medicines ALTER COLUMN created_at SET DEFAULT now();
    END IF;

    -- Rooms
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rooms') THEN
        ALTER TABLE public.rooms ALTER COLUMN created_at SET DEFAULT now();
    END IF;

    -- Beds
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'beds') THEN
        ALTER TABLE public.beds ALTER COLUMN created_at SET DEFAULT now();
    END IF;

    -- Procedures
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'procedures') THEN
        ALTER TABLE public.procedures ALTER COLUMN created_at SET DEFAULT now();
    END IF;

    -- Visits
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'visits') THEN
        ALTER TABLE public.visits ALTER COLUMN created_at SET DEFAULT now();
    END IF;

    -- Medical Records
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'medical_records') THEN
        ALTER TABLE public.medical_records ALTER COLUMN created_at SET DEFAULT now();
    END IF;

    -- Prescriptions
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'prescriptions') THEN
        ALTER TABLE public.prescriptions ALTER COLUMN created_at SET DEFAULT now();
    END IF;

    -- Service Requests
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'service_requests') THEN
        ALTER TABLE public.service_requests ALTER COLUMN created_at SET DEFAULT now();
    END IF;

    -- Inpatient Admissions
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inpatient_admissions') THEN
        -- Handle admission_date which acts as the timestamp for this table
        ALTER TABLE public.inpatient_admissions ALTER COLUMN admission_date SET DEFAULT now();
        
        -- Optional: Update created_at only if it exists
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'inpatient_admissions' AND column_name = 'created_at') THEN
            ALTER TABLE public.inpatient_admissions ALTER COLUMN created_at SET DEFAULT now();
        END IF;
    END IF;

    -- Transactions
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions') THEN
        ALTER TABLE public.transactions ALTER COLUMN created_at SET DEFAULT now();
        -- Ensure patient_id column exists
        ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS patient_id BIGINT REFERENCES public.patients(id);
    END IF;
END $$;

-- 9. Force Schema Cache Reload
NOTIFY pgrst, 'reload schema';

-- =================================================================
-- PERFORMANCE OPTIMIZATION (INDEXES)
-- =================================================================

-- Patients: Faster search by Name, NIK, and RM
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients USING btree (name);
CREATE INDEX IF NOT EXISTS idx_patients_nik ON public.patients USING btree (nik);
CREATE INDEX IF NOT EXISTS idx_patients_no_rm ON public.patients USING btree (no_rm);

-- Visits: Faster filtering by Status and Date
CREATE INDEX IF NOT EXISTS idx_visits_status ON public.visits USING btree (status);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON public.visits USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON public.visits USING btree (patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_doctor_id ON public.visits USING btree (doctor_id);
CREATE INDEX IF NOT EXISTS idx_visits_polyclinic_id ON public.visits USING btree (polyclinic_id);

-- Transactions: Faster reporting and history lookup
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions USING btree (status);
CREATE INDEX IF NOT EXISTS idx_transactions_visit_id ON public.transactions USING btree (visit_id);

-- Medicines: Faster search for prescriptions
CREATE INDEX IF NOT EXISTS idx_medicines_name ON public.medicines USING btree (name);

-- Medical Records: Faster history lookup
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_id ON public.medical_records USING btree (visit_id);

-- Prescriptions: Faster lookup
CREATE INDEX IF NOT EXISTS idx_prescriptions_visit_id ON public.prescriptions USING btree (visit_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON public.prescriptions USING btree (status);

-- =================================================================
-- 10. Fix Foreign Keys for Cascading Deletes (MIGRATION)
-- =================================================================
-- Run this section to fix "Unable to delete rows" errors in SQL Editor

-- 1. Doctors -> Users
ALTER TABLE public.doctors DROP CONSTRAINT IF EXISTS doctors_user_id_fkey;
ALTER TABLE public.doctors
    ADD CONSTRAINT doctors_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE;

-- 2. Medical Records -> Visits
ALTER TABLE public.medical_records DROP CONSTRAINT IF EXISTS medical_records_visit_id_fkey;
ALTER TABLE public.medical_records
    ADD CONSTRAINT medical_records_visit_id_fkey
    FOREIGN KEY (visit_id)
    REFERENCES public.visits(id)
    ON DELETE CASCADE;

-- 3. Prescriptions -> Visits
ALTER TABLE public.prescriptions DROP CONSTRAINT IF EXISTS prescriptions_visit_id_fkey;
ALTER TABLE public.prescriptions
    ADD CONSTRAINT prescriptions_visit_id_fkey
    FOREIGN KEY (visit_id)
    REFERENCES public.visits(id)
    ON DELETE CASCADE;

-- 4. Service Requests -> Visits
ALTER TABLE public.service_requests DROP CONSTRAINT IF EXISTS service_requests_visit_id_fkey;
ALTER TABLE public.service_requests
    ADD CONSTRAINT service_requests_visit_id_fkey
    FOREIGN KEY (visit_id)
    REFERENCES public.visits(id)
    ON DELETE CASCADE;

-- 5. Transactions -> Visits
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_visit_id_fkey;
ALTER TABLE public.transactions
    ADD CONSTRAINT transactions_visit_id_fkey
    FOREIGN KEY (visit_id)
    REFERENCES public.visits(id)
    ON DELETE CASCADE;