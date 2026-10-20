require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const path = require('path'); // YENİ: Fayl yolları üçün

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "https://*.supabase.co"]
        }
    }
}));
app.use(cors({ origin: '*' })); 
app.use(express.json());

// YENİ: public qovluğundakı HTML/JS fayllarını göstərmək üçün
app.use(express.static(path.join(__dirname, 'public')));

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const JWT_SECRET = process.env.JWT_SECRET;

// OWASP: Brute-Force Qoruması
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5,
  skipSuccessfulRequests: true,
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
  // ... (əvvəlki kimi)
});

app.post('/api/admin/login', authLimiter, async (req, res) => {
  // ... (əvvəlki kimi)
});

app.get('/api/products', authenticateToken, async (req, res) => {
  // ... (əvvəlki kimi)
});

app.post('/api/checkout', authenticateToken, async (req, res) => {
  // ... (əvvəlki kimi)
});

// YENİ: Kök yola (/) daxil olanda index.html faylını qaytar
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server http://localhost:${port} ünvanında işləyir`);
});