@echo off
REM Script para diagnosticar problema com Meta Ads
REM Este script testa as variáveis de ambiente e conectividade com Meta

cd /d "%~dp0"

echo.
echo ============================================================================
echo DIAGNOSTICO DE INTEGRAÇÃO META CONVERSIONS API
echo ============================================================================
echo.

REM Carregar arquivo .env
for /f "delims== tokens=1,2" %%A in (.env) do (
    if "%%A"=="META_PIXEL_ID" set META_PIXEL_ID=%%B
    if "%%A"=="META_ACCESS_TOKEN" set META_ACCESS_TOKEN=%%B
    if "%%A"=="META_TEST_CODE" set META_TEST_CODE=%%B
)

echo 1. VARIAVEIS CARREGADAS:
echo    META_PIXEL_ID: %META_PIXEL_ID%
if defined META_ACCESS_TOKEN (
    for /f "tokens=1-2" %%A in ('echo %META_ACCESS_TOKEN% ^| findstr /r /c:"."') do (
        set FIRST=!META_ACCESS_TOKEN:~0,20!
        set LAST=!META_ACCESS_TOKEN:~-10!
        echo    META_ACCESS_TOKEN: !FIRST!...!LAST!
    )
) else (
    echo    META_ACCESS_TOKEN: NOT SET
)
echo    META_TEST_CODE: %META_TEST_CODE%
echo.

REM Tentar executar Node.js
echo 2. TESTANDO CONECTIVIDADE COM META (Node.js)...
echo.

if exist node_modules\axios (
    node validate-token.js
) else (
    echo Instalando dependências...
    call npm install
    node validate-token.js
)

echo.
echo ============================================================================
echo FIM DO DIAGNOSTICO
echo ============================================================================
echo.
