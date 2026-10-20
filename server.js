require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: '*' })); 
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const JWT_SECRET = process.env.JWT_SECRET;

// OWASP: Brute-Force Qoruması (YALNIZ SƏHV CƏHDLƏR SAYILACAQ)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5,
  skipSuccessfulRequests: true, // Vacib kod: Uğurlu girişləri limitə daxil etmir
  message: { error: 'Çox sayda səhv cəhd etdiniz. Lütfən 15 dəqiqə sonra yenidən yoxlayın.' }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Giriş icazəsi yoxdur.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Sessiyanın vaxtı bitib.' });
    req.user = user;
    next();
  });
};

app.post('/api/admin/register', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Məlumatların formatı düzgün deyil' });
  }
  if (password.length < 8) return res.status(400).json({ error: 'Şifrə ən azı 8 simvol olmalıdır' });

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const { error } = await supabase.from('admins').insert([{ username, password_hash: hashedPassword }]);
    if (error) throw error;
    res.status(201).json({ message: 'Uğurla qeydiyyatdan keçdiniz' });
  } catch (err) {
    res.status(500).json({ error: 'Bu istifadəçi artıq mövcud ola bilər.' });
  }
});

app.post('/api/admin/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Məlumatlar eksikdir' });

  try {
    const { data, error } = await supabase.from('admins').select('*').eq('username', username).single();
    if (error || !data) return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yalnışdır' });

    const match = await bcrypt.compare(password, data.password_hash);
    if (!match) return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yalnışdır' });

    const token = jwt.sign({ id: data.id, username: data.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Sistemə daxil oldunuz!', username: data.username, token });
  } catch (err) {
    res.status(500).json({ error: 'Server xətası' });
  }
});

app.get('/api/products', authenticateToken, async (req, res) => {
  const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
  if (error) return res.status(500).json({ error: 'Baza xətası' });
  res.json(data);
});

app.post('/api/checkout', authenticateToken, async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'Səbət etibarsızdır' });

  try {
    const itemCounts = {};
    items.forEach(item => { if(item && item.id) itemCounts[item.id] = (itemCounts[item.id] || 0) + 1; });

    for (const [id, quantity] of Object.entries(itemCounts)) {
        const { data: product } = await supabase.from('products').select('stock').eq('id', id).single();
        if (product && product.stock >= quantity) {
            const newStock = product.stock - quantity;
            await supabase.from('products').update({ stock: newStock }).eq('id', id);
        } else {
            throw new Error(`Bəzi məhsullar üçün kifayət qədər stok yoxdur.`);
        }
    }
    res.json({ message: 'Sifarişiniz uğurla təsdiqləndi! Məhsullar bazadan silindi.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server http://localhost:${port} ünvanında işləyir`);
});