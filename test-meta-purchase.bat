@echo off
REM Script para testar evento de compra na Meta Ads
REM Uso: test-meta-purchase.bat [CODIGO_TESTE]

setlocal enabledelayedexpansion

cd /d "%~dp0"

if "%1"=="" (
    echo Uso: test-meta-purchase.bat [CODIGO_TESTE]
    echo Exemplo: test-meta-purchase.bat TEST58888
    exit /b 1
)

echo.
echo === Teste de Evento de Compra - Meta Ads ===
echo Codigo de teste: %1
echo.

REM Verifica se Python está disponível
python --version >nul 2>&1
if errorlevel 1 (
    echo Erro: Python nao encontrado. Instalando requisitos do Node.js...
    call npm install
    node test-meta-purchase.js %1
) else (
    echo Usando Python para teste...
    python test_meta_purchase.py %1
)

endlocal
