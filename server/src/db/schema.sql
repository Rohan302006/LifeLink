-- LifeLink Clean PostgreSQL Schema (Neon Optimized)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('donor', 'receiver', 'doctor', 'admin')),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    blood_group VARCHAR(10),
    city VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, verified, rejected
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Doctor Profiles Table
CREATE TABLE IF NOT EXISTS doctor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    medical_license_number VARCHAR(100) UNIQUE NOT NULL,
    hospital_name VARCHAR(255) NOT NULL,
    hospital_city VARCHAR(100),
    approval_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, verified, rejected
    rejection_reason TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Donor Profiles Table
CREATE TABLE IF NOT EXISTS donor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_donation_date DATE,
    last_donation_date_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, verified, rejected
    last_donation_rejection_reason TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Documents Table (Private Storage Metadata)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doc_type VARCHAR(50) NOT NULL CHECK (doc_type IN ('id_proof', 'donation_proof', 'medical_requisition')),
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, verified, rejected
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Blood Requests Table
CREATE TABLE IF NOT EXISTS blood_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_name VARCHAR(255) NOT NULL,
    blood_group VARCHAR(10) NOT NULL,
    units_needed INTEGER NOT NULL DEFAULT 1,
    hospital_name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    urgency VARCHAR(50) NOT NULL DEFAULT 'urgent', -- critical, urgent, planned
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, verified, rejected, fulfilled, cancelled
    rejection_reason TEXT,
    doctor_notes TEXT,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Request Matches Table
CREATE TABLE IF NOT EXISTS request_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'notified', -- notified, accepted, declined
    notified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (request_id, donor_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_group ON blood_requests(blood_group);
