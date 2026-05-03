/**
 * INSIGHT HALLS ENGINEERING
 * Backend API — Express + Supabase
 *
 * Deploys as a Vercel serverless function.
 * Locally: `npm run dev` listens on PORT (default 5000).
 * Production (Vercel): the `module.exports = app` below is what runs;
 * `app.listen()` is skipped in serverless.
 */

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// SUPABASE
// ============================================================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('⚠️  SUPABASE_URL and SUPABASE_ANON_KEY must be set in env vars');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// ============================================================================
// MIDDLEWARE
// ============================================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================
const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-me-in-production');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

const authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
};

// ============================================================================
// HELPERS
// ============================================================================
const generateToken = (userId, email, name, role) =>
    jwt.sign(
        { id: userId, email, name, role },
        process.env.JWT_SECRET || 'change-me-in-production',
        { expiresIn: '7d' }
    );

// ============================================================================
// AUTH — UNIFIED LOGIN (Admin + Partners)
// ============================================================================

// Authorised users and their passwords
// NOTE: replace with bcrypt-hashed passwords stored in DB in production.
const VALID_PASSWORDS = {
    'mayendayendab@gmail.com':                  'admin123',
    'isaac.mzokomera@insighthalls.com':         'partner123',
    'basiwel.mayendayenda@insighthalls.com':    'partner123',
    'amwinye.kamange@insighthalls.com':         'partner123',
    'misheck@insighthalls.com':                 'partner123',
    'adam.abdulrasheed@insighthalls.com':       'partner123',
};

// Default names in case we need to create the user record on first login
const DEFAULT_NAMES = {
    'mayendayendab@gmail.com':                  'B. Mayendayenda',
    'isaac.mzokomera@insighthalls.com':         'Isaac Mzokomera',
    'basiwel.mayendayenda@insighthalls.com':    'Basiwel Mayendayenda',
    'amwinye.kamange@insighthalls.com':         'Amwinye Kamange',
    'misheck@insighthalls.com':                 'Misheck Magombo',
    'adam.abdulrasheed@insighthalls.com':       'Adam AbdulRasheed',
};

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt:', email);

        // 1. Check the hardcoded allow-list first (fast-fail)
        if (!VALID_PASSWORDS[email] || VALID_PASSWORDS[email] !== password) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // 2. Find the user in Supabase
        let { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('status', 'Active')
            .maybeSingle();   // won't error on zero rows

        // 3. If not in DB yet, auto-create them (recovery path)
        if (!user) {
            const role = email === 'mayendayendab@gmail.com' ? 'Administrator' : 'Partner';
            const { data: created, error: createErr } = await supabase
                .from('users')
                .insert({ email, name: DEFAULT_NAMES[email] || email, role, status: 'Active' })
                .select()
                .single();
            if (createErr || !created) {
                console.error('Auto-create user failed:', createErr);
                return res.status(500).json({ success: false, message: 'Could not create user record', error: createErr?.message });
            }
            user = created;
        }

        const token = generateToken(user.id, email, user.name, user.role);
        console.log('✅ Login successful:', email, 'Role:', user.role);

        return res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: { id: user.id, email: user.email, name: user.name, role: user.role }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Error logging in', error: error.message });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, name, password, role } = req.body;

        if (!email || !name || !password || !role) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        if (!['Partner', 'Administrator'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const { data: user, error } = await supabase
            .from('users')
            .insert({ email, name, role, status: 'Active' })
            .select();

        if (error) {
            return res.status(500).json({ success: false, message: 'Error creating user', error: error.message });
        }

        const token = generateToken(user[0].id, email, name, role);

        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: { token, user: user[0] }
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ success: false, message: 'Error registering', error: error.message });
    }
});

app.get('/api/auth/profile', protect, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users').select('*').eq('id', req.user.id).single();

        if (error || !user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        let partnerDetails = null;
        if (user.role === 'Partner') {
            // Prefer the most-recently-created partner record to avoid stale duplicates
            const { data: partner } = await supabase
                .from('partners')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            partnerDetails = partner;
        }

        return res.json({ success: true, data: { user, partnerDetails } });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching profile', error: error.message });
    }
});

// ============================================================================
// INQUIRIES
// ============================================================================
app.post('/api/inquiries/submit', async (req, res) => {
    try {
        const { senderName, senderEmail, senderPhone, inquiryType, sector, message } = req.body;

        if (!senderName || !senderEmail || !senderPhone || !message) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const { data, error } = await supabase
            .from('inquiries')
            .insert({
                sender_name: senderName,
                sender_email: senderEmail,
                sender_phone: senderPhone,
                inquiry_type: inquiryType || 'General',
                sector: sector || 'General',
                message,
                status: 'New',
                created_at: new Date().toISOString()
            })
            .select();

        if (error) {
            return res.status(500).json({ success: false, message: 'Error saving inquiry', error: error.message });
        }

        return res.status(201).json({ success: true, message: 'Inquiry submitted successfully', data: data[0] });
    } catch (error) {
        console.error('Submit inquiry error:', error);
        return res.status(500).json({ success: false, message: 'Error submitting inquiry', error: error.message });
    }
});

app.get('/api/inquiries', protect, authorize('Administrator'), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('inquiries').select('*').order('created_at', { ascending: false });
        if (error) {
            return res.status(500).json({ success: false, message: 'Error fetching inquiries', error: error.message });
        }
        return res.json({ success: true, data: data || [] });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching inquiries', error: error.message });
    }
});

app.get('/api/inquiries/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase.from('inquiries').select('*').eq('id', id).single();
        if (error) {
            return res.status(404).json({ success: false, message: 'Inquiry not found', error: error.message });
        }
        return res.json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching inquiry', error: error.message });
    }
});

app.patch('/api/inquiries/:id', protect, authorize('Administrator'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, response } = req.body;
        const { data, error } = await supabase
            .from('inquiries')
            .update({
                status: status || 'In Progress',
                response: response || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();

        if (error) {
            return res.status(500).json({ success: false, message: 'Error updating inquiry', error: error.message });
        }
        return res.json({ success: true, message: 'Inquiry updated successfully', data: data[0] });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error updating inquiry', error: error.message });
    }
});

// ============================================================================
// PROJECTS
// ============================================================================
app.get('/api/projects', protect, async (req, res) => {
    try {
        const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (error) {
            return res.status(500).json({ success: false, message: 'Error fetching projects', error: error.message });
        }
        return res.json({ success: true, data: data || [] });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching projects', error: error.message });
    }
});

app.post('/api/projects', protect, authorize('Administrator'), async (req, res) => {
    try {
        const { name, client_name, sector, status, budget, description } = req.body;
        if (!name || !client_name) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        const { data, error } = await supabase
            .from('projects')
            .insert({
                name,
                client_name,
                sector: sector || 'General',
                status: status || 'Planning',
                budget: budget || 0,
                description: description || '',
                created_at: new Date().toISOString()
            })
            .select();

        if (error) {
            return res.status(500).json({ success: false, message: 'Error creating project', error: error.message });
        }
        return res.status(201).json({ success: true, message: 'Project created successfully', data: data[0] });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error creating project', error: error.message });
    }
});

// ============================================================================
// PARTNERS — Admin view (deduplicated)
// ============================================================================
app.get('/api/partners', protect, authorize('Administrator'), async (req, res) => {
    try {
        // Query unique Partner users joined with their latest partner record
        const { data: users, error } = await supabase
            .from('users')
            .select('id, name, email, role, status')
            .eq('role', 'Partner')
            .eq('status', 'Active')
            .order('name', { ascending: true });

        if (error) {
            return res.status(500).json({ success: false, message: 'Error fetching partners', error: error.message });
        }

        // Enrich each user with their latest partner record
        const enriched = await Promise.all((users || []).map(async (u) => {
            const { data: partner } = await supabase
                .from('partners')
                .select('*')
                .eq('user_id', u.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            return { ...u, partnerRecord: partner || null };
        }));

        return res.json({ success: true, data: enriched });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching partners', error: error.message });
    }
});

// ============================================================================
// PARTNER — Self-service dashboard (enhanced)
// ============================================================================
app.get('/api/partners/me/dashboard', protect, authorize('Partner'), async (req, res) => {
    try {
        // Latest partner record for this user
        const { data: partnerData, error: partnerError } = await supabase
            .from('partners')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (partnerError) {
            return res.status(404).json({ success: false, message: 'Partner profile not found' });
        }

        // All projects
        const { data: projects } = await supabase.from('projects').select('*').order('created_at', { ascending: false });

        // Funding for this partner (across all their partner records)
        let funding = [];
        if (partnerData) {
            // Get all partner record IDs for this user to catch any duplicates
            const { data: allPartnerRecs } = await supabase
                .from('partners').select('id').eq('user_id', req.user.id);
            const partnerIds = (allPartnerRecs || []).map(p => p.id);
            if (partnerIds.length) {
                const { data: fundingData } = await supabase
                    .from('partner_funding')
                    .select('*')
                    .in('partner_id', partnerIds)
                    .order('created_at', { ascending: false });
                funding = fundingData || [];
            }
        }

        // Profit shares for this user (from project_profit_share — partner_id = user id here)
        const { data: profitShares } = await supabase
            .from('project_profit_share')
            .select('*')
            .eq('partner_id', req.user.id);

        // Deal sourcing — projects where this partner is the deal sourcer
        // deal_sourcing_register.partner_id can be user_id directly
        const { data: dealSourcing } = await supabase
            .from('deal_sourcing_register')
            .select('*')
            .eq('partner_id', req.user.id);

        // Expenses submitted by this user
        const { data: expenses } = await supabase
            .from('expenses')
            .select('*')
            .eq('created_by', req.user.id)
            .order('created_at', { ascending: false });

        // All deal sourcing (so partner can see who sourced each project)
        const { data: allDealSourcing } = await supabase
            .from('deal_sourcing_register')
            .select('*, users:partner_id(name, email)');

        // Effort ratings received by this partner
        const { data: effortRatings } = await supabase
            .from('effort_ratings')
            .select('*')
            .eq('rated_partner_id', req.user.id);

        return res.json({
            success: true,
            data: {
                partner: partnerData,
                funding: funding,
                projects: projects || [],
                profitShares: profitShares || [],
                dealSourcing: dealSourcing || [],
                allDealSourcing: allDealSourcing || [],
                expenses: expenses || [],
                effortRatings: effortRatings || []
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching partner dashboard', error: error.message });
    }
});

// ============================================================================
// PARTNER — Submit funding contribution
// ============================================================================
app.post('/api/partners/me/funding', protect, authorize('Partner'), async (req, res) => {
    try {
        const { project_id, amount, notes } = req.body;
        if (!project_id || !amount) {
            return res.status(400).json({ success: false, message: 'project_id and amount are required' });
        }

        // Find or create the partner record for this user
        let { data: partnerRec } = await supabase
            .from('partners')
            .select('id')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!partnerRec) {
            // Auto-create a partner record
            const { data: newRec, error: recErr } = await supabase
                .from('partners')
                .insert({ user_id: req.user.id, email: req.user.email, status: 'Active', company_name: 'Insight Halls Engineering' })
                .select()
                .single();
            if (recErr) return res.status(500).json({ success: false, message: 'Could not create partner record', error: recErr.message });
            partnerRec = newRec;
        }

        const { data, error } = await supabase
            .from('partner_funding')
            .insert({
                partner_id: partnerRec.id,
                project_id,
                amount: Number(amount),
                status: 'Pending',
                notes: notes || null,
                created_at: new Date().toISOString()
            })
            .select();

        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.status(201).json({ success: true, data: data[0], message: 'Funding submission received. Admin will verify it.' });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

// ============================================================================
// PARTNER — My profit shares across projects
// ============================================================================
app.get('/api/financials/me/profit-shares', protect, async (req, res) => {
    try {
        const { data: shares, error } = await supabase
            .from('project_profit_share')
            .select('*')
            .eq('partner_id', req.user.id)
            .order('calculated_at', { ascending: false });

        if (error) return res.status(500).json({ success: false, message: error.message });

        // Enrich with project names
        const projectIds = [...new Set((shares || []).map(s => s.project_id))];
        let projectMap = {};
        if (projectIds.length) {
            const { data: projs } = await supabase.from('projects').select('id, name').in('id', projectIds);
            (projs || []).forEach(p => { projectMap[p.id] = p.name; });
        }

        const enriched = (shares || []).map(s => ({ ...s, project_name: projectMap[s.project_id] || 'Unknown' }));
        return res.json({ success: true, data: enriched });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

// ============================================================================
// PARTNER — My submitted expenses
// ============================================================================
app.get('/api/partners/me/expenses', protect, authorize('Partner'), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('created_by', req.user.id)
            .order('created_at', { ascending: false });
        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.json({ success: true, data: data || [] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

// ============================================================================
// WEBSITE (Public)
// ============================================================================
app.get('/api/website/landing', (req, res) => {
    return res.json({
        success: true,
        data: {
            company: 'Insight Halls Engineering',
            tagline: 'Built with Intent',
            location: 'P.O. BOX 797, Area 15, Lilongwe, Malawi',
            phone: '+265 99 873 2673',
            email: 'insighthalls@gmail.com'
        }
    });
});

app.get('/api/website/services', (req, res) => {
    return res.json({
        success: true,
        data: [
            { id: 1, name: 'Fuel Systems', icon: '⛽' },
            { id: 2, name: 'Electrical Services', icon: '⚡' },
            { id: 3, name: 'Welding & Fabrication', icon: '🔧' },
            { id: 4, name: 'Building Construction', icon: '🏗️' },
            { id: 5, name: 'Air Conditioning', icon: '❄️' },
            { id: 6, name: 'Plumbing Services', icon: '💧' },
            { id: 7, name: 'Vehicle Spares & Repair', icon: '🚗' }
        ]
    });
});

// ============================================================================
// HEALTH CHECK
// ============================================================================
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV || 'unknown'
    });
});

// ============================================================================
// PHASE 2 — EXPENSES
// ============================================================================

// Tiered approval helper
const autoApprovalStatus = (amount) => {
    if (Number(amount) < 500000) return 'Approved';
    return 'Pending';
};

app.get('/api/expenses', protect, authorize('Administrator'), async (req, res) => {
    try {
        const { project_id } = req.query;
        let query = supabase.from('expenses').select('*').order('created_at', { ascending: false });
        if (project_id) query = query.eq('project_id', project_id);
        const { data, error } = await query;
        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.json({ success: true, data: data || [] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/api/projects/:id/expenses', protect, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('expenses').select('*').eq('project_id', req.params.id)
            .order('created_at', { ascending: false });
        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.json({ success: true, data: data || [] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

// Both admin and partners can submit expenses
app.post('/api/expenses', protect, async (req, res) => {
    try {
        const { project_id, category, amount, vendor, description, receipt_url } = req.body;
        if (!project_id || !amount) {
            return res.status(400).json({ success: false, message: 'project_id and amount are required' });
        }
        const status = req.user.role === 'Administrator' ? autoApprovalStatus(amount) : 'Pending';
        const insertData = {
            project_id, category, amount: Number(amount), vendor, description,
            receipt_url, status, created_by: req.user.id
        };
        if (status === 'Approved') {
            insertData.approved_by = req.user.id;
            insertData.approved_at = new Date().toISOString();
        }
        const { data, error } = await supabase.from('expenses').insert(insertData).select();
        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.status(201).json({ success: true, data: data[0] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

app.patch('/api/expenses/:id/approve', protect, authorize('Administrator'), async (req, res) => {
    try {
        const { data, error } = await supabase.from('expenses')
            .update({
                status: 'Approved',
                approved_by: req.user.id,
                approved_at: new Date().toISOString()
            })
            .eq('id', req.params.id).select();
        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.json({ success: true, data: data[0] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

app.patch('/api/expenses/:id/reject', protect, authorize('Administrator'), async (req, res) => {
    try {
        const { data, error } = await supabase.from('expenses')
            .update({ status: 'Rejected', approved_by: req.user.id, approved_at: new Date().toISOString() })
            .eq('id', req.params.id).select();
        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.json({ success: true, data: data[0] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

// ============================================================================
// PHASE 2 — INVOICES
// ============================================================================

app.get('/api/invoices', protect, authorize('Administrator'), async (req, res) => {
    try {
        const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.json({ success: true, data: data || [] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/api/projects/:id/invoices', protect, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('invoices').select('*').eq('project_id', req.params.id)
            .order('created_at', { ascending: false });
        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.json({ success: true, data: data || [] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/invoices', protect, authorize('Administrator'), async (req, res) => {
    try {
        const { project_id, invoice_number, client_name, amount, due_date, notes } = req.body;
        if (!project_id || !amount) {
            return res.status(400).json({ success: false, message: 'project_id and amount are required' });
        }
        const { data, error } = await supabase.from('invoices').insert({
            project_id,
            invoice_number: invoice_number || `INV-${Date.now()}`,
            client_name,
            amount: Number(amount),
            status: 'Draft',
            due_date,
            notes
        }).select();
        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.status(201).json({ success: true, data: data[0] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

app.patch('/api/invoices/:id', protect, authorize('Administrator'), async (req, res) => {
    try {
        const updates = {};
        ['status', 'invoice_number', 'client_name', 'amount', 'due_date', 'paid_date', 'notes']
            .forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
        if (updates.amount !== undefined) updates.amount = Number(updates.amount);

        const { data, error } = await supabase.from('invoices').update(updates).eq('id', req.params.id).select();
        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.json({ success: true, data: data[0] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

// ============================================================================
// PHASE 2 — PAYMENTS
// ============================================================================

app.post('/api/invoices/:id/payments', protect, authorize('Administrator'), async (req, res) => {
    try {
        const { amount, method, reference } = req.body;
        if (!amount) {
            return res.status(400).json({ success: false, message: 'amount is required' });
        }

        const { data: invoice, error: invErr } = await supabase
            .from('invoices').select('*').eq('id', req.params.id).single();
        if (invErr || !invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        const { data: payment, error: payErr } = await supabase.from('payments').insert({
            invoice_id: req.params.id,
            project_id: invoice.project_id,
            amount: Number(amount),
            method, reference
        }).select();
        if (payErr) return res.status(500).json({ success: false, message: payErr.message });

        const { data: existingPayments } = await supabase.from('payments').select('amount').eq('invoice_id', req.params.id);
        const totalPaid = (existingPayments || []).reduce((s, p) => s + Number(p.amount || 0), 0);
        if (totalPaid >= Number(invoice.amount)) {
            await supabase.from('invoices').update({
                status: 'Paid',
                paid_date: new Date().toISOString().slice(0, 10)
            }).eq('id', req.params.id);
        }

        return res.status(201).json({ success: true, data: payment[0] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

// ============================================================================
// PHASE 2 — FINANCIAL CALCULATION (3-pool engine)
// ============================================================================

app.post('/api/financials/projects/:id/calculate-profit', protect, authorize('Administrator'), async (req, res) => {
    try {
        const projectId = req.params.id;

        const { data: payments } = await supabase.from('payments').select('amount').eq('project_id', projectId);
        const totalRevenue = (payments || []).reduce((s, p) => s + Number(p.amount || 0), 0);

        const { data: expenses } = await supabase
            .from('expenses').select('amount').eq('project_id', projectId).eq('status', 'Approved');
        const totalCosts = (expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0);

        const grossProfit = totalRevenue - totalCosts;
        const reserveFund = Math.max(0, grossProfit) * 0.40;
        const distributablePool = Math.max(0, grossProfit) * 0.60;

        const { data: existing } = await supabase
            .from('project_financials').select('id').eq('project_id', projectId).maybeSingle();

        const payload = {
            project_id: projectId,
            total_revenue: totalRevenue,
            total_costs: totalCosts,
            gross_profit: grossProfit,
            reserve_fund: reserveFund,
            distributable_pool: distributablePool,
            calculated_at: new Date().toISOString()
        };

        let result;
        if (existing) {
            const { data, error } = await supabase.from('project_financials')
                .update(payload).eq('project_id', projectId).select();
            if (error) return res.status(500).json({ success: false, message: error.message });
            result = data[0];
        } else {
            const { data, error } = await supabase.from('project_financials').insert(payload).select();
            if (error) return res.status(500).json({ success: false, message: error.message });
            result = data[0];
        }

        return res.json({ success: true, data: result });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/financials/projects/:id/calculate-shares', protect, authorize('Administrator'), async (req, res) => {
    try {
        const projectId = req.params.id;

        const { data: fin } = await supabase
            .from('project_financials').select('*').eq('project_id', projectId).maybeSingle();
        if (!fin) {
            return res.status(400).json({
                success: false,
                message: 'Run /calculate-profit first — no financials found for this project.'
            });
        }

        const distributable = Number(fin.distributable_pool) || 0;

        const { data: allUsers } = await supabase
            .from('users').select('id, name, email, role')
            .in('role', ['Partner', 'Administrator'])
            .eq('status', 'Active');

        const { data: partnerLinks } = await supabase
            .from('partners').select('id, user_id');
        const partnerToUser = new Map((partnerLinks || []).map(p => [p.id, p.user_id]));

        const { data: projectFunding } = await supabase
            .from('partner_funding').select('partner_id, amount, status, project_id')
            .eq('project_id', projectId).eq('status', 'Verified');

        const fundingPerUser = new Map();
        (projectFunding || []).forEach(f => {
            const userId = partnerToUser.get(f.partner_id);
            if (!userId) return;
            fundingPerUser.set(userId, (fundingPerUser.get(userId) || 0) + Number(f.amount || 0));
        });
        const totalFunding = Array.from(fundingPerUser.values()).reduce((s, v) => s + v, 0);

        const { data: ratings } = await supabase
            .from('effort_ratings').select('rated_partner_id, rating').eq('project_id', projectId);
        const ratingsByUser = new Map();
        (ratings || []).forEach(r => {
            if (!ratingsByUser.has(r.rated_partner_id)) ratingsByUser.set(r.rated_partner_id, []);
            ratingsByUser.get(r.rated_partner_id).push(Number(r.rating));
        });
        const avgEffort = new Map();
        for (const [uid, list] of ratingsByUser) {
            avgEffort.set(uid, list.reduce((s, v) => s + v, 0) / list.length);
        }
        const totalEffort = Array.from(avgEffort.values()).reduce((s, v) => s + v, 0);

        // Deal sourcing — partner_id in deal_sourcing_register is user_id directly
        const { data: dealRows } = await supabase
            .from('deal_sourcing_register').select('partner_id, share_pct').eq('project_id', projectId);
        const dealPerUser = new Map();
        (dealRows || []).forEach(d => {
            dealPerUser.set(d.partner_id, (dealPerUser.get(d.partner_id) || 0) + Number(d.share_pct || 0));
        });
        const totalDeal = Array.from(dealPerUser.values()).reduce((s, v) => s + v, 0);

        const shares = [];
        for (const u of (allUsers || [])) {
            const fundingPct = totalFunding > 0 ? (fundingPerUser.get(u.id) || 0) / totalFunding * 100 : 0;
            const effortPct = totalEffort > 0 ? (avgEffort.get(u.id) || 0) / totalEffort * 100 : 0;
            const dealPct = totalDeal > 0 ? (dealPerUser.get(u.id) || 0) / totalDeal * 100 : 0;

            const totalSharePct = (fundingPct * 0.60) + (effortPct * 0.20) + (dealPct * 0.20);

            if (totalSharePct === 0) continue;

            const grossAmount = distributable * totalSharePct / 100;
            const tax = grossAmount * 0.10;
            const net = grossAmount - tax;

            await supabase.from('project_profit_share')
                .delete().eq('project_id', projectId).eq('partner_id', u.id);
            await supabase.from('project_profit_share').insert({
                project_id: projectId,
                partner_id: u.id,
                funding_index_pct: fundingPct,
                effort_index_pct: effortPct,
                deal_index_pct: dealPct,
                total_share_pct: totalSharePct,
                gross_amount: grossAmount,
                tax_withheld: tax,
                net_amount: net,
                calculated_at: new Date().toISOString()
            });

            shares.push({
                partner_id: u.id,
                partner_name: u.name,
                partner_email: u.email,
                funding_index_pct: fundingPct,
                effort_index_pct: effortPct,
                deal_index_pct: dealPct,
                total_share_pct: totalSharePct,
                gross_amount: grossAmount,
                tax_withheld: tax,
                net_amount: net
            });
        }

        return res.json({
            success: true,
            data: {
                distributable_pool: distributable,
                shares: shares.sort((a, b) => b.total_share_pct - a.total_share_pct)
            }
        });
    } catch (e) {
        console.error('calculate-shares error:', e);
        return res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/api/financials/projects/:id/summary', protect, async (req, res) => {
    try {
        const projectId = req.params.id;
        const [
            { data: project },
            { data: fin },
            { data: expenses },
            { data: invoices },
            { data: shares }
        ] = await Promise.all([
            supabase.from('projects').select('*').eq('id', projectId).maybeSingle(),
            supabase.from('project_financials').select('*').eq('project_id', projectId).maybeSingle(),
            supabase.from('expenses').select('*').eq('project_id', projectId),
            supabase.from('invoices').select('*').eq('project_id', projectId),
            supabase.from('project_profit_share').select('*').eq('project_id', projectId)
        ]);

        return res.json({
            success: true,
            data: {
                project: project || null,
                financials: fin || null,
                expenses: expenses || [],
                invoices: invoices || [],
                shares: shares || []
            }
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/api/financials/projects/:id/profit-shares', protect, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('project_profit_share').select('*').eq('project_id', req.params.id);
        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.json({ success: true, data: data || [] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

// ============================================================================
// PHASE 2 — DISTRIBUTIONS
// ============================================================================

app.get('/api/financials/distributions', protect, authorize('Administrator'), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profit_distributions').select('*').order('created_at', { ascending: false });
        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.json({ success: true, data: data || [] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/api/financials/me/distributions', protect, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('profit_distributions').select('*')
            .eq('partner_id', req.user.id)
            .order('created_at', { ascending: false });
        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.json({ success: true, data: data || [] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

app.post('/api/financials/projects/:id/distribute', protect, authorize('Administrator'), async (req, res) => {
    try {
        const projectId = req.params.id;
        const { data: shares, error: sErr } = await supabase
            .from('project_profit_share').select('*').eq('project_id', projectId);
        if (sErr) return res.status(500).json({ success: false, message: sErr.message });
        if (!shares || !shares.length) {
            return res.status(400).json({ success: false, message: 'Calculate shares first' });
        }

        const inserts = shares.map(s => ({
            project_id: projectId,
            partner_id: s.partner_id,
            amount: s.net_amount,
            status: 'Pending'
        }));

        await supabase.from('profit_distributions')
            .delete().eq('project_id', projectId).eq('status', 'Pending');

        const { data, error } = await supabase.from('profit_distributions').insert(inserts).select();
        if (error) return res.status(500).json({ success: false, message: error.message });

        return res.status(201).json({ success: true, data: data || [] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

app.patch('/api/financials/distributions/:id/pay', protect, authorize('Administrator'), async (req, res) => {
    try {
        const { payment_reference } = req.body;
        const { data, error } = await supabase.from('profit_distributions')
            .update({
                status: 'Paid',
                payment_reference: payment_reference || null,
                paid_at: new Date().toISOString()
            })
            .eq('id', req.params.id).select();
        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.json({ success: true, data: data[0] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

// ============================================================================
// PHASE 2 — EFFORT RATINGS & DEAL SOURCING
// ============================================================================

app.post('/api/projects/:id/effort-ratings', protect, async (req, res) => {
    try {
        const { rated_partner_id, rating, comment } = req.body;
        if (!rated_partner_id || !rating) {
            return res.status(400).json({ success: false, message: 'rated_partner_id and rating required' });
        }
        const { data, error } = await supabase.from('effort_ratings').insert({
            project_id: req.params.id,
            rater_id: req.user.id,
            rated_partner_id,
            rating: Number(rating),
            comment
        }).select();
        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.status(201).json({ success: true, data: data[0] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/api/projects/:id/effort-ratings', protect, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('effort_ratings').select('*').eq('project_id', req.params.id);
        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.json({ success: true, data: data || [] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

// Admin sets deal sourcer — partner_id is user_id here
app.post('/api/projects/:id/deal-source', protect, authorize('Administrator'), async (req, res) => {
    try {
        const { partner_id, share_pct, notes } = req.body;
        if (!partner_id) {
            return res.status(400).json({ success: false, message: 'partner_id required' });
        }
        const { data, error } = await supabase.from('deal_sourcing_register').insert({
            project_id: req.params.id,
            partner_id,
            share_pct: Number(share_pct || 100),
            notes
        }).select();
        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.status(201).json({ success: true, data: data[0] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

app.get('/api/projects/:id/deal-source', protect, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('deal_sourcing_register').select('*').eq('project_id', req.params.id);
        if (error) return res.status(500).json({ success: false, message: error.message });
        return res.json({ success: true, data: data || [] });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

// ============================================================================
// 404 + ERROR HANDLERS
// ============================================================================
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found', path: req.path });
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
    });
});

// ============================================================================
// LOCAL DEV ONLY — Vercel ignores this
// ============================================================================
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════════════════════╗
║   INSIGHT HALLS ENGINEERING — BACKEND                      ║
║   ✅ Server running on http://localhost:${PORT}                ║
║   🔐 Unified Login: Admin + Partners                        ║
║   📊 Supabase Connected                                     ║
╚════════════════════════════════════════════════════════════╝
        `);
    });
}

module.exports = app;
