-- LifeLink Complete PostgreSQL Schema with Row Level Security (RLS)
-- Optimized for PostgreSQL and NeonDB

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('requester', 'donor', 'doctor', 'admin')),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    phone_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Hospitals Table
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT TRUE,
    emergency_contact VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Doctors Table (Hospital Verifiers)
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    medical_license_number VARCHAR(100) UNIQUE NOT NULL,
    specialization VARCHAR(100) DEFAULT 'Emergency & Transfusion Medicine',
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Donors Table
CREATE TABLE IF NOT EXISTS donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blood_group VARCHAR(10) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    approx_area VARCHAR(150),
    last_donation_date DATE,
    is_available BOOLEAN DEFAULT TRUE,
    consent_given_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    medical_notes_self_reported TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Blood Requests Table
CREATE TABLE IF NOT EXISTS blood_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_name VARCHAR(255) NOT NULL,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    blood_group VARCHAR(10) NOT NULL,
    component VARCHAR(50) DEFAULT 'whole_blood',
    units_needed INTEGER NOT NULL CHECK (units_needed > 0),
    urgency VARCHAR(50) NOT NULL DEFAULT 'urgent_within_24h',
    required_by TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, verified, rejected, fulfilled, expired
    doctor_notes TEXT,
    rejection_reason TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    fulfilled_at TIMESTAMP WITH TIME ZONE
);

-- 6. Request Matches Table (Donor responses & privacy gating)
CREATE TABLE IF NOT EXISTS request_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    distance_km DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'notified', -- notified, accepted, declined, expired
    notified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (request_id, donor_id)
);

-- 7. Donations Table (Logged strictly by verified doctors)
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES blood_requests(id) ON DELETE SET NULL,
    donor_id UUID NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE RESTRICT,
    blood_group VARCHAR(10) NOT NULL,
    component VARCHAR(50) NOT NULL,
    units_donated INTEGER NOT NULL DEFAULT 1,
    donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    verified_by_doctor_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Organ Pledges Table (Awareness, Intent & Next-of-Kin Record)
CREATE TABLE IF NOT EXISTS organ_pledges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    blood_group VARCHAR(10),
    organs_pledged TEXT[] NOT NULL,
    kin_name VARCHAR(255) NOT NULL,
    kin_phone VARCHAR(50) NOT NULL,
    kin_relation VARCHAR(50) NOT NULL,
    kin_notified BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    official_registry_redirect_clicked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Coordinator Logs Table (Hospital Transplant Counselor Log)
CREATE TABLE IF NOT EXISTS coordinator_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    coordinator_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    patient_identifier VARCHAR(100) NOT NULL,
    conversation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    family_members_present VARCHAR(255) NOT NULL,
    outcome_notes TEXT NOT NULL,
    notto_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    metadata_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Audit Logs Table (DPDP Act Compliance & Medical Traceability)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    ip_address VARCHAR(50),
    details_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Hospital Policies Table (Configurable Medical Eligibility Rules)
CREATE TABLE IF NOT EXISTS hospital_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    whole_blood_gap_days INTEGER DEFAULT 90,
    plasma_gap_days INTEGER DEFAULT 14,
    platelets_gap_days INTEGER DEFAULT 7,
    escalation_timeout_mins INTEGER DEFAULT 30,
    escalation_radius_km DOUBLE PRECISION DEFAULT 25.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance & matching
CREATE INDEX IF NOT EXISTS idx_donors_location ON donors(lat, lng);
CREATE INDEX IF NOT EXISTS idx_donors_blood_group ON donors(blood_group);
CREATE INDEX IF NOT EXISTS idx_requests_status ON blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_blood_group ON blood_requests(blood_group);
CREATE INDEX IF NOT EXISTS idx_requests_duplicate_check ON blood_requests(patient_name, hospital_id, blood_group, status);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organ_pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinator_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users RLS: Users can view and edit their own account; Admins can view all
CREATE POLICY users_self_access ON users
    FOR ALL
    USING (auth.uid() = id OR current_user = 'admin');

-- Donors RLS: Donor can edit own profile; Requests only see approximate data until match accepted
CREATE POLICY donors_self_manage ON donors
    FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY donors_read_pre_acceptance ON donors
    FOR SELECT
    USING (true); -- Note: Sensitive phone and coordinates are masked at application query layer

-- Blood Requests RLS: Requesters manage their own; Doctors can view pending and verify
CREATE POLICY requests_requester_access ON blood_requests
    FOR ALL
    USING (auth.uid() = requester_id);

CREATE POLICY requests_doctor_view ON blood_requests
    FOR SELECT
    USING (status = 'verified' OR EXISTS (
        SELECT 1 FROM doctors d WHERE d.user_id = auth.uid() AND d.hospital_id = blood_requests.hospital_id
    ));

-- Audit Logs RLS: Insert only, Admin read-only
CREATE POLICY audit_logs_read ON audit_logs
    FOR SELECT
    USING (current_user = 'admin');
