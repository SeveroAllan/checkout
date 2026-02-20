require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const checkoutRouter = require('./routes/checkout');
const webhookRouter  = require('./routes/webhook');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares ──────────────────────────────────────────────────────────────

app.use(express.json());

// CORS — permite apenas o seu frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
}));

// Rate limit — protege contra spam de requisições
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30,                   // máximo 30 requisições por IP
  message: { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});
app.use('/api/', limiter);

// ─── Servir o frontend estático ───────────────────────────────────────────────
// Coloque o checkout.html dentro da pasta /public
app.use(express.static(path.join(__dirname, '../public')));

// ─── Rotas da API ─────────────────────────────────────────────────────────────

app.use('/api/checkout', checkoutRouter);
app.use('/webhook/asaas', webhookRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.ASAAS_ENV || 'sandbox',
    timestamp: new Date().toISOString(),
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📄 Checkout em:   http://localhost:${PORT}/checkout.html`);
  console.log(`🔗 API em:        http://localhost:${PORT}/api/checkout`);
  console.log(`📩 Webhook em:    http://localhost:${PORT}/webhook/asaas\n`);
});
