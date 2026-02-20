const axios = require('axios');

const BASE_URLS = {
  sandbox:    'https://sandbox.asaas.com/api/v3',
  production: 'https://api.asaas.com/v3',
};

const env = process.env.ASAAS_ENV || 'sandbox';

const asaas = axios.create({
  baseURL: BASE_URLS[env],
  headers: {
    'Content-Type': 'application/json',
    'access_token': process.env.ASAAS_KEY,
  },
});

// Log de ambiente no startup
console.log(`🔌 Asaas configurado em modo: ${env.toUpperCase()}`);

module.exports = asaas;
