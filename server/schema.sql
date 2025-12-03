-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id BIGINT PRIMARY KEY DEFAULT (extract(epoch from now()) * 1000)::bigint,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- In production, this should be hashed!
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default users from existing users.json
INSERT INTO public.users (id, username, password, role, name) VALUES
(1764705853532, 'Wahyu', 'Rahasia051200.', 'super_admin', 'PROGRAMMER IT'),
(1764706645242, 'Tuti', '123', 'staff_pendaftaran', 'Staff 1'),
(1764706832318, 'DRS. Agung', '123', 'dokter', 'Dokter'),
(1764706966525, 'siti', '123', 'kasir', 'Petugas Kasir')
ON CONFLICT (username) DO NOTHING;
