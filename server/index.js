const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Root route for checking status
app.get("/", (req, res) => {
  res.send("SIMRS API is running");
});

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials missing in .env file. Please configure SUPABASE_URL and SUPABASE_KEY.");
}

const supabase = createClient(supabaseUrl || "", supabaseKey || "");

// --- Routes ---

// 1. Add Patient
app.post("/patients", async (req, res) => {
  try {
    const { name, nik, phone, address } = req.body;
    const { data, error } = await supabase
      .from("patients")
      .insert([{ name, nik, phone, address }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 2. Get All Patients
app.get("/patients", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 3. Create Visit
app.post("/visits", async (req, res) => {
  try {
    const { patient_id, doctor } = req.body;
    const { data, error } = await supabase
      .from("visits")
      .insert([{ patient_id, doctor, status: 'registered' }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 4. Get Visits (Optional: Filter by status or date could be added later)
app.get("/visits", async (req, res) => {
  try {
    // Join with patients table to get patient name and transactions for billing state
    const { data, error } = await supabase
      .from("visits")
      .select("*, patients(name), transactions(id, amount, status, created_at)")
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 5. Add Medical Record
app.post("/medical-records", async (req, res) => {
  try {
    const { visit_id, diagnosis, notes } = req.body;
    
    // Insert record
    const { data, error } = await supabase
      .from("medical_records")
      .insert([{ visit_id, diagnosis, notes }])
      .select();

    if (error) throw error;

    // Update visit status to 'closed' or 'in_consultation' if needed, 
    // but for now let's keep it simple or update explicitly.
    
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 6. Create/Update Transaction (Billing)
app.post("/transactions", async (req, res) => {
  try {
    const { visit_id, amount, status } = req.body;
    const { data, error } = await supabase
      .from("transactions")
      .insert([{ visit_id, amount, status: status || 'pending' }])
      .select();

    if (error) throw error;

    // Update visit status when payment processed
    if (status) {
      await supabase
        .from("visits")
        .update({ status: status === 'paid' ? 'closed' : status })
        .eq('id', visit_id);
    }

    // Return enriched transaction with visit + patient info for frontend convenience
    const inserted = data[0];
    const { data: transactionWithRelations, error: relationError } = await supabase
      .from("transactions")
      .select("*, visits(*, patients(name))")
      .eq('id', inserted.id)
      .single();

    if (relationError) throw relationError;

    res.status(201).json(transactionWithRelations);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 7. Get Transactions for billing overview
app.get("/transactions", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("*, visits(*, patients(name))")
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// 8. Search Patients
app.get("/patients/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .or(`name.ilike.%${q}%,nik.ilike.%${q}%,phone.ilike.%${q}%,address.ilike.%${q}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// 9. Search Visits with patient info
app.get("/visits/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const { data, error } = await supabase
      .from("visits")
      .select("*, patients(name), transactions(id, amount, status, created_at)")
      .or(`patients.name.ilike.%${q}%,doctor.ilike.%${q}%,id.ilike.%${q}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// 10. Search Transactions
app.get("/transactions/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*, visits(*, patients(name))")
      .or(`visits.patients.name.ilike.%${q}%,amount.ilike.%${q}%,status.ilike.%${q}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// 11. Get Medical History for a Patient
app.get("/medical-records/:patientId", async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Get all medical records linked to visits for this patient
    const { data, error } = await supabase
      .from("medical_records")
      .select("*, visits!inner(doctor, created_at, patients(name))")
      .eq("visits.patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

// 12. User Management Routes (Supabase Auth)

// Login
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Username atau password salah" });
    }

    res.json({ 
      token: "mock-jwt-token-" + user.id, 
      user: { id: user.id, username: user.username, role: user.role, name: user.name } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Users
app.get("/users", async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, username, role, name") // Don't select password
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create User
app.post("/users", async (req, res) => {
  try {
    const { username, password, role, name } = req.body;
    
    if (!username || !password || !role || !name) {
      return res.status(400).json({ error: "Semua field harus diisi" });
    }

    // Check username existence
    const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .single();
    
    if (existing) {
        return res.status(400).json({ error: "Username sudah digunakan" });
    }

    const newUser = {
      username,
      password,
      role,
      name
    };

    const { data, error } = await supabase
      .from("users")
      .insert([newUser])
      .select()
      .single();

    if (error) throw error;
    
    res.status(201).json({ success: true, user: { ...data, password: "***" } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete User
app.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Export app for Vercel
module.exports = app;

// Only listen if not running in Vercel (Vercel handles this automatically)
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
