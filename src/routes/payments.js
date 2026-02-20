const express = require('express');
const router = express.Router();
const asaas = require('../services/asaas');

// GET /api/payments/:id/status
router.get('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { data } = await asaas.get(`/payments/${id}`);

        // Retorna apenas status e dados seguros
        res.json({
            status: data.status,
            value: data.value,
            billingType: data.billingType,
            confirmedDate: data.confirmedDate
        });
    } catch (error) {
        console.error('Erro ao buscar status:', error.message);
        res.status(500).json({ error: 'Erro ao buscar pagamento' });
    }
});

// GET /api/payments/:id/pixQrCode
router.get('/:id/pixQrCode', async (req, res) => {
    try {
        const { id } = req.params;
        // Rota específica do Asaas para pegar o QR Code Pix
        const { data } = await asaas.get(`/payments/${id}/pixQrCode`);

        res.json({
            encodedImage: data.encodedImage, // Base64 image
            payload: data.payload,           // Copia e Cola
            expirationDate: data.expirationDate
        });
    } catch (error) {
        console.error('Erro ao buscar QR Code:', error.message);
        res.status(500).json({ error: 'Erro ao buscar QR Code Pix' });
    }
});

module.exports = router;
