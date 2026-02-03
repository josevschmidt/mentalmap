@echo off
setlocal EnableDelayedExpansion

REM ==========================================
REM CONFIGURAÇÃO
REM ==========================================
set "NOME_ARQUIVO_SAIDA=projeto_completo.txt"

REM Limpa o arquivo de saída se ele já existir
if exist "%NOME_ARQUIVO_SAIDA%" del "%NOME_ARQUIVO_SAIDA%"

echo Gerando relatorio do projeto...
echo Aguarde, lendo arquivos...

REM ==========================================
REM 1. GERAR A ÁRVORE DE ARQUIVOS
REM ==========================================
echo ======================================================= >> "%NOME_ARQUIVO_SAIDA%"
echo ESTRUTURA DE DIRETORIOS >> "%NOME_ARQUIVO_SAIDA%"
echo ======================================================= >> "%NOME_ARQUIVO_SAIDA%"
REM /F exibe arquivos, /A usa caracteres ASCII (melhor compatibilidade)
tree /F /A >> "%NOME_ARQUIVO_SAIDA%"
echo. >> "%NOME_ARQUIVO_SAIDA%"
echo. >> "%NOME_ARQUIVO_SAIDA%"

REM ==========================================
REM 2. LER O CONTEÚDO DOS ARQUIVOS
REM ==========================================
REM Loop recursivo (/R) por todos os arquivos (*)
for /R %%F in (*) do (
    
    set "IGNORAR=0"

    REM --- FILTROS DE SEGURANÇA ---
    
    REM 1. Ignorar o próprio arquivo de saída
    if "%%~nxF"=="%NOME_ARQUIVO_SAIDA%" set "IGNORAR=1"
    
    REM 2. Ignorar este script .bat
    if "%%~nxF"=="%~nx0" set "IGNORAR=1"

    REM 3. Ignorar pasta node_modules (Verifica se o caminho contém node_modules)
    echo "%%F" | findstr /I /C:"\node_modules\" >nul && set "IGNORAR=1"

    REM 4. Ignorar pasta .git
    echo "%%F" | findstr /I /C:"\.git\" >nul && set "IGNORAR=1"

    REM 5. Ignorar arquivos de bloqueio ou log grandes (opcional)
    if "%%~xF"==".lock" set "IGNORAR=1"
    if "%%~xF"==".log" set "IGNORAR=1"

    REM 6. Ignorar Imagens/Binários (para não corromper o texto)
    if /I "%%~xF"==".png" set "IGNORAR=1"
    if /I "%%~xF"==".jpg" set "IGNORAR=1"
    if /I "%%~xF"==".jpeg" set "IGNORAR=1"
    if /I "%%~xF"==".gif" set "IGNORAR=1"
    if /I "%%~xF"==".ico" set "IGNORAR=1"
    if /I "%%~xF"==".svg" set "IGNORAR=1"

    REM --- PROCESSAMENTO ---
    if "!IGNORAR!"=="0" (
        echo Lendo: %%~nxF
        
        echo ======================================================= >> "%NOME_ARQUIVO_SAIDA%"
        echo ARQUIVO: %%F >> "%NOME_ARQUIVO_SAIDA%"
        echo ======================================================= >> "%NOME_ARQUIVO_SAIDA%"
        
        REM Comando type lê o conteúdo e joga no arquivo de saída
        type "%%F" >> "%NOME_ARQUIVO_SAIDA%"
        
        echo. >> "%NOME_ARQUIVO_SAIDA%"
        echo. >> "%NOME_ARQUIVO_SAIDA%"
    )
)

echo.
echo Concluido!
echo O arquivo "%NOME_ARQUIVO_SAIDA%" foi criado com sucesso.
pause