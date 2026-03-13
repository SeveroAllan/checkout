#!/usr/bin/env node
/**
 * Validador de Token Meta - Verifica escopos e permissões
 */

require('dotenv').config();
const axios = require('axios');

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const PIXEL_ID = process.env.META_PIXEL_ID;

async function validateToken() {
  console.log('\n🔍 VALIDAÇÃO DE TOKEN META\n');
  
  if (!ACCESS_TOKEN) {
    console.log('❌ META_ACCESS_TOKEN não configurado no .env');
    return false;
  }
  
  if (!PIXEL_ID) {
    console.log('❌ META_PIXEL_ID não configurado no .env');
    return false;
  }
  
  try {
    // 1. Verificar informações do token
    console.log('1️⃣  Verificando informações do token...');
    const meResponse = await axios.get(
      `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${ACCESS_TOKEN}`,
      { timeout: 5000 }
    );
    console.log(`✅ Token válido`);
    console.log(`   ID: ${meResponse.data.id}`);
    console.log(`   Name: ${meResponse.data.name}\n`);
    
    // 2. Verificar permissões do token
    console.log('2️⃣  Verificando escopos do token...');
    const debugResponse = await axios.get(
      `https://graph.facebook.com/v19.0/debug_token?input_token=${ACCESS_TOKEN}&access_token=${ACCESS_TOKEN}`,
      { timeout: 5000 }
    );
    
    const scopes = debugResponse.data.data.scopes || [];
    console.log(`✅ Escopos encontrados: ${scopes.length}`);
    scopes.forEach(scope => {
      console.log(`   - ${scope}`);
    });
    
    const requiredScopes = ['ads_management', 'pages_read_engagement'];
    const hasRequiredScopes = requiredScopes.every(scope => scopes.includes(scope));
    
    if (hasRequiredScopes) {
      console.log('\n✅ Todos os escopos necessários estão presentes\n');
    } else {
      console.log('\n⚠️  AVISO: Token pode estar sem permissões completas');
      const missing = requiredScopes.filter(s => !scopes.includes(s));
      console.log(`   Escopos faltando: ${missing.join(', ')}\n`);
    }
    
    // 3. Verificar acesso ao Pixel
    console.log('3️⃣  Verificando acesso ao Pixel...');
    try {
      const pixelResponse = await axios.get(
        `https://graph.facebook.com/v19.0/${PIXEL_ID}?fields=id,name,owner_id,status&access_token=${ACCESS_TOKEN}`,
        { timeout: 5000 }
      );
      console.log(`✅ Acesso ao Pixel confirmado`);
      console.log(`   Pixel ID: ${pixelResponse.data.id}`);
      console.log(`   Pixel Name: ${pixelResponse.data.name || 'N/A'}`);
      console.log(`   Status: ${pixelResponse.data.status || 'N/A'}\n`);
    } catch (err) {
      console.log(`❌ Sem acesso ao Pixel ${PIXEL_ID}`);
      console.log(`   Status: ${err.response?.status}`);
      console.log(`   Message: ${err.response?.data?.error?.message}\n`);
      return false;
    }
    
    // 4. Testar envio de evento
    console.log('4️⃣  Testando envio de evento...');
    const crypto = require('crypto');
    
    const payload = {
      data: [{
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_id: `test_${Math.floor(Date.now() / 1000)}_Purchase`,
        user_data: {
          em: [crypto.createHash('sha256').update('test@example.com').digest('hex')],
          ph: [crypto.createHash('sha256').update('11999999999').digest('hex')]
        },
        custom_data: {
          value: 97.00,
          currency: 'BRL',
          content_type: 'product',
          order_id: `test_${Math.floor(Date.now() / 1000)}`
        }
      }],
      test_event_code: 'TEST58888'
    };
    
    const eventResponse = await axios.post(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`,
      payload,
      {
        params: { access_token: ACCESS_TOKEN },
        timeout: 8000
      }
    );
    
    console.log(`✅ Evento enviado com sucesso`);
    console.log(`   Events Received: ${eventResponse.data.events_received}`);
    console.log(`   Warnings: ${eventResponse.data.events_received}`);
    
    if (eventResponse.data.warnings) {
      console.log('   Warnings:');
      eventResponse.data.warnings.forEach(w => {
        console.log(`     - ${w}`);
      });
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ VALIDAÇÃO COMPLETA - TUDO OK!');
    console.log('='.repeat(70));
    console.log('\nProximas etapas:');
    console.log('1. Acesse: https://business.facebook.com/events_manager');
    console.log(`2. Selecione o Pixel: ${PIXEL_ID}`);
    console.log('3. Procure pela aba "Teste Seu Pixel"');
    console.log('4. Procure pelo código: TEST58888');
    console.log('5. Verifique se o evento "Purchase" foi recebido\n');
    
    return true;
    
  } catch (err) {
    console.log(`\n❌ Erro durante validação:`);
    
    if (err.response) {
      console.log(`   Status: ${err.response.status}`);
      console.log(`   Message: ${err.response.data.error?.message || err.response.data.message}`);
      
      if (err.response.status === 401) {
        console.log('\n   💡 Seu token pode ter expirado.');
        console.log('   Regenere em: https://business.facebook.com/settings/apps-and-websites');
      } else if (err.response.status === 403) {
        console.log('\n   💡 Permissões insuficientes.');
        console.log('   Verifique os escopos do App Role no Meta Ads Manager');
      }
    } else {
      console.log(`   ${err.message}`);
    }
    
    return false;
  }
}

validateToken().then(success => {
  process.exit(success ? 0 : 1);
});
