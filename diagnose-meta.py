#!/usr/bin/env python3
"""
Script de diagnóstico para testar integração com Meta Conversions API
Verifica credenciais, conectividade e valida o payload
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

def print_section(title):
    """Imprimir seção de diagnóstico"""
    print(f"\n{'='*70}")
    print(f"🔍 {title}")
    print('='*70)

def sha256_hash(value):
    """Hashear valor com SHA256 (lowercase e trimmed)"""
    return hashlib.sha256(value.lower().strip().encode()).hexdigest()

def build_user_data(email, phone):
    """Construir dados de usuário com email e phone hasheados"""
    user_data = {}
    if email:
        user_data['em'] = [sha256_hash(email)]
    if phone:
        clean_phone = ''.join(filter(str.isdigit, phone))
        user_data['ph'] = [sha256_hash(clean_phone)]
    return user_data

def check_env_vars():
    """Verificar se as variáveis de ambiente estão configuradas"""
    print_section("VERIFICANDO VARIÁVEIS DE AMBIENTE")
    
    issues = []
    
    if not PIXEL_ID:
        print("❌ META_PIXEL_ID não configurado")
        issues.append("META_PIXEL_ID")
    else:
        print(f"✅ META_PIXEL_ID: {PIXEL_ID}")
    
    if not ACCESS_TOKEN:
        print("❌ META_ACCESS_TOKEN não configurado")
        issues.append("META_ACCESS_TOKEN")
    else:
        token_preview = ACCESS_TOKEN[:20] + "..." + ACCESS_TOKEN[-10:] if len(ACCESS_TOKEN) > 30 else "***"
        print(f"✅ META_ACCESS_TOKEN: {token_preview}")
    
    test_code = os.getenv('META_TEST_CODE')
    if test_code:
        print(f"✅ META_TEST_CODE: {test_code}")
    else:
        print("⚠️  META_TEST_CODE não configurado (será usado padrão)")
    
    return len(issues) == 0

def check_connectivity():
    """Verificar se consegue conectar com a API Meta"""
    print_section("VERIFICANDO CONECTIVIDADE COM META")
    
    try:
        # Fazer uma requisição simples para validar token
        test_url = f"https://graph.facebook.com/{API_VERSION}/{PIXEL_ID}?fields=name&access_token={ACCESS_TOKEN}"
        response = requests.get(test_url, timeout=5)
        
        if response.status_code == 200:
            print("✅ Conexão com Meta API bem-sucedida")
            data = response.json()
            print(f"   Pixel Name: {data.get('name', 'N/A')}")
            return True
        elif response.status_code == 401:
            print("❌ Token de acesso inválido ou expirado")
            print(f"   Response: {response.json()}")
            return False
        elif response.status_code == 403:
            print("❌ Acesso negado. Verifique as permissões do token")
            print(f"   Response: {response.json()}")
            return False
        else:
            print(f"❌ Erro ao conectar: {response.status_code}")
            print(f"   Response: {response.json()}")
            return False
    except requests.exceptions.Timeout:
        print("❌ Timeout ao conectar com Meta (timeout de 5s)")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Erro de conexão com Meta (verifique sua internet)")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {str(e)}")
        return False

def test_purchase_event(test_code):
    """Testar disparo do evento de compra"""
    print_section("DISPARANDO EVENTO DE COMPRA (TEST)")
    
    test_data = {
        'email': 'teste@codigopassional.com',
        'phone': '11999999999',
        'value': 97.00,
        'order_id': f'test_{int(datetime.now().timestamp())}',
        'currency': 'BRL'
    }
    
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
    }
    
    if test_code:
        payload['test_event_code'] = test_code
    
    print(f"📝 Payload a enviar:")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    
    print(f"\n📡 Enviando para: {API_URL}")
    print(f"   Token: {ACCESS_TOKEN[:20]}...{ACCESS_TOKEN[-10:]}")
    print(f"   Pixel ID: {PIXEL_ID}\n")
    
    try:
        response = requests.post(
            API_URL,
            json=payload,
            params={'access_token': ACCESS_TOKEN},
            timeout=8
        )
        
        print(f"📍 Status Code: {response.status_code}")
        
        try:
            result = response.json()
            print(f"📋 Response JSON:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
        except:
            print(f"📋 Response Text: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            events_received = result.get('events_received', 0)
            fbc_quality = result.get('fbc_quality_score', 'N/A')
            
            if events_received > 0:
                print(f"\n✅ SUCESSO! Evento recebido.")
                print(f"   Events Received: {events_received}")
                print(f"   FBC Quality Score: {fbc_quality}")
                return True
            else:
                print(f"\n⚠️  Resposta OK mas sem eventos recebidos")
                print(f"   Verifique o payload no Gerenciador de Eventos Meta")
                return False
        else:
            print(f"\n❌ Erro na requisição")
            if 'error' in response.json():
                error = response.json()['error']
                print(f"   Código: {error.get('code')}")
                print(f"   Mensagem: {error.get('message')}")
                print(f"   Type: {error.get('type')}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"❌ Timeout ao enviar evento (timeout de 8s)")
        return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Erro de conexão ao enviar evento")
        return False
    except Exception as e:
        print(f"❌ Erro inesperado: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Executar diagnóstico completo"""
    print("\n" + "="*70)
    print("🔧 DIAGNÓSTICO DE INTEGRAÇÃO - META CONVERSIONS API")
    print("="*70)
    
    test_code = sys.argv[1] if len(sys.argv) > 1 else os.getenv('META_TEST_CODE', 'TEST92057')
    
    # Step 1: Verificar variáveis
    if not check_env_vars():
        print_section("⚠️  ABORTING")
        print("Configure as variáveis de ambiente antes de continuar")
        return False
    
    # Step 2: Verificar conectividade
    if not check_connectivity():
        print_section("⚠️  ABORTING")
        print("Não conseguiu conectar com a API Meta")
        print("Verifique:")
        print("  1. Sua conexão com internet")
        print("  2. Se o token de acesso é válido")
        print("  3. Se o Pixel ID está correto")
        return False
    
    # Step 3: Teste evento
    success = test_purchase_event(test_code)
    
    # Resumo
    print_section("RESUMO DO DIAGNÓSTICO")
    
    if success:
        print("✅ TUDO FUNCIONANDO!")
        print(f"\n💡 Próximas etapas:")
        print(f"   1. Acesse: https://business.facebook.com/events_manager")
        print(f"   2. Selecione o Pixel: {PIXEL_ID}")
        print(f"   3. Procure na aba 'Teste Seu Pixel' pelo código: {test_code}")
        print(f"   4. Verifique se o evento 'Purchase' foi recebido\n")
    else:
        print("❌ FALHAS ENCONTRADAS")
        print("\nRecommendações:")
        print("   1. Verifique as credenciais no arquivo .env")
        print("   2. Confirme se o token não expirou")
        print("   3. Regenere o token em Meta Ads Manager se necessário")
        print("   4. Verifique se o Pixel ID está correto\n")
    
    return success

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
