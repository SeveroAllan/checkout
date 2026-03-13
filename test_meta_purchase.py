#!/usr/bin/env python3
"""
Script de teste para disparar um evento de compra (Purchase) na Meta Conversions API
Uso: python test_meta_purchase.py TEST58888
"""

import os
import sys
import json
import hashlib
import requests
from datetime import datetime
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

PIXEL_ID = os.getenv('META_PIXEL_ID')
ACCESS_TOKEN = os.getenv('META_ACCESS_TOKEN')
API_VERSION = 'v19.0'
API_URL = f'https://graph.facebook.com/{API_VERSION}/{PIXEL_ID}/events'

def sha256_hash(value):
    """Hashear valor com SHA256 (lowercase e trimmed)"""
    return hashlib.sha256(value.lower().strip().encode()).hexdigest()

def build_user_data(email, phone):
    """Construir dados de usuário com email e phone hasheados"""
    user_data = {}
    if email:
        user_data['em'] = [sha256_hash(email)]
    if phone:
        # Remove non-digits
        clean_phone = ''.join(filter(str.isdigit, phone))
        user_data['ph'] = [sha256_hash(clean_phone)]
    return user_data

def send_purchase_event(test_code):
    """Enviar evento de compra para Meta"""
    
    test_data = {
        'email': 'teste@codigopassional.com',
        'phone': '11999999999',
        'value': 97.00,
        'order_id': f'test_{int(datetime.now().timestamp())}',
        'currency': 'BRL'
    }
    
    print('\n🚀 Iniciando teste de evento de compra (Purchase) para Meta Ads')
    print(f'📋 Código de teste: {test_code}\n')
    
    print('📊 Dados do evento:')
    print(f'   Event Name: Purchase')
    print(f'   Email: {test_data["email"]}')
    print(f'   Phone: {test_data["phone"]}')
    print(f'   Value: R$ {test_data["value"]}')
    print(f'   Currency: {test_data["currency"]}')
    print(f'   Order ID: {test_data["order_id"]}')
    print(f'   Test Code: {test_code}\n')
    
    if not PIXEL_ID or not ACCESS_TOKEN:
        print('❌ ERRO: META_PIXEL_ID ou META_ACCESS_TOKEN não configurados!')
        return False
    
    # Construir payload
    payload = {
        'data': [{
            'event_name': 'Purchase',
            'event_time': int(datetime.now().timestamp()),
            'action_source': 'website',
            'event_id': f'{test_data["order_id"]}_Purchase',
            'user_data': build_user_data(test_data['email'], test_data['phone']),
            'custom_data': {
                'value': test_data['value'],
                'currency': test_data['currency'],
                'content_ids': ['codigo-passional'],
                'content_type': 'product',
                'order_id': test_data['order_id'],
            },
        }],
        'test_event_code': test_code,
    }
    
    print('📡 Enviando para Meta Conversions API...')
    
    try:
        response = requests.post(
            API_URL,
            json=payload,
            params={'access_token': ACCESS_TOKEN},
            timeout=8
        )
        
        result = response.json()
        
        if response.status_code == 200:
            print(f'✅ Sucesso! Evento recebido.')
            print(f'   Events Received: {result.get("events_received", "n/a")}')
            print(f'   Pixel Quality Score: {result.get("fbc_quality_score", "n/a")}')
            print(f'\n💡 Próximas etapas:')
            print(f'   1. Acesse o Gerenciador de Eventos Meta Ads')
            print(f'   2. Procure pelo código de teste: {test_code}')
            print(f'   3. Verifique se o evento "Purchase" foi recebido')
            print(f'   4. Valide os dados (email hasheado, valor, moeda, etc.)\n')
            return True
        else:
            print(f'❌ Erro na resposta da Meta: {response.status_code}')
            print(f'   {result}')
            return False
            
    except requests.exceptions.RequestException as err:
        print(f'❌ Erro ao conectar com Meta: {str(err)}')
        return False

if __name__ == '__main__':
    test_code = sys.argv[1] if len(sys.argv) > 1 else 'TEST92057'
    
    success = send_purchase_event(test_code)
    sys.exit(0 if success else 1)
