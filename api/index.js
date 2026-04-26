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
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt:', email);

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('status', 'Active')
            .single();

        if (error || !user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // TODO: replace this with bcrypt-hashed passwords stored in the users table.
        const validPasswords = {
            'mayendayendab@gmail.com': 'admin123',
            'isaac.mzokomera@insighthalls.com': 'partner123',
            'webster.chipwaila@insighthalls.com': 'partner123',
            'basiwel.mayendayenda@insighthalls.com': 'partner123',
            'misheck@insighthalls.com': 'partner123',
            'adam.abdulrasheed@insighthalls.com': 'partner123'
        };

        if (validPasswords[email] !== password) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
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
            const { data: partner } = await supabase
                .from('partners').select('*').eq('user_id', user.id).single();
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
// PARTNERS
// ============================================================================
app.get('/api/partners', protect, authorize('Administrator'), async (req, res) => {
    try {
        const { data, error } = await supabase.from('partner_dashboard').select('*');
        if (error) {
            return res.status(500).json({ success: false, message: 'Error fetching partners', error: error.message });
        }
        return res.json({ success: true, data: data || [] });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching partners', error: error.message });
    }
});

app.get('/api/partners/me/dashboard', protect, authorize('Partner'), async (req, res) => {
    try {
        const { data: partnerData, error: partnerError } = await supabase
            .from('partners').select('*').eq('user_id', req.user.id).single();

        if (partnerError) {
            return res.status(404).json({ success: false, message: 'Partner profile not found' });
        }

        const { data: funding } = await supabase
            .from('partner_funding').select('*').eq('partner_id', partnerData.id);
        const { data: projects } = await supabase.from('projects').select('*');

        return res.json({
            success: true,
            data: { partner: partnerData, funding: funding || [], projects: projects || [] }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching partner dashboard', error: error.message });
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
