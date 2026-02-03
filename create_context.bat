@echo off
setlocal enabledelayedexpansion

title Gerador de Contexto para IA v4.0 (Definitivo)

REM --- Define o nome do arquivo de saida ---
set OUTPUT_FILE=project_context.txt

echo =================================================================
echo  Gerando arquivo de contexto para IA... (v4.0 Definitivo)
echo =================================================================
echo.

REM --- Limpa o arquivo de saida antigo, se existir ---
if exist "%OUTPUT_FILE%" del "%OUTPUT_FILE%"

REM --- =================================================================
REM --- Secao 1: Estrutura de Arquivos (Metodo a Prova de Falhas)
REM --- =================================================================
echo Gerando a lista de arquivos importantes...

(
    echo =================================================================
    echo                  ESTRUTURA DE ARQUIVOS DO PROJETO
    echo =================================================================
    echo Caso necessário, solicite especificamente o conteúdo de qualquer arquivo abaixo para que possamos trabalhar juntos de forma mais direcionada.
    echo.
    REM --- Este comando lista TODOS os arquivos (sem pastas) de forma recursiva ---
    REM --- e o pipe para o findstr REMOVE as linhas que contem as pastas proibidas. ---
    REM --- Este e o metodo mais confiavel para evitar as 30 mil linhas. ---
    dir /S /B /A:-D | findstr /V /I /L /C:"node_modules" /C:"venv" /C:".git" /C:"__pycache__" /C:"dist" /C:".pnpm-store"
    echo.
    echo.
) > "%OUTPUT_FILE%"

REM --- =================================================================
REM --- Secao 2: Conteudo dos Arquivos Principais
REM --- =================================================================
echo Adicionando conteudo dos arquivos essenciais...

REM --- Lista de arquivos a serem adicionados ---
set "files_to_add=package.json tsconfig.json App.tsx index.html"

REM --- Loop para adicionar cada arquivo ---
for %%F in (%files_to_add%) do (
    (
        echo.
        echo =================================================================
        echo                  CONTEUDO DE %%F
        echo =================================================================
        if exist "%%F" (
            echo --- INICIO DO ARQUIVO %%F ---
            echo.
            type "%%F"
            echo.
            echo --- FIM DO ARQUIVO %%F ---
        ) else (
            echo Arquivo %%F nao encontrado.
        )
    ) >> "%OUTPUT_FILE%"
)

echo.
echo =================================================================
echo  SUCESSO!
echo.
echo  O arquivo "%OUTPUT_FILE%" foi criado com um tamanho razoavel.
echo  Pode copiar e colar com seguranca.
echo =================================================================
echo.
pause