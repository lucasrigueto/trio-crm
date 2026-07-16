# ============================================================
# setup-db.ps1 — Aplica todas as migrations do Trio CRM
# ============================================================
# Pré-requisitos:
#   - Docker rodando com o serviço 'trio_crm_db' ativo
#     (docker compose -f infra/docker-compose.supabase.yml up -d)
#   - Aguardar ~30s para o PostgreSQL inicializar
#
# Uso:
#   cd d:\Dev\trio-crm
#   .\infra\setup-db.ps1
# ============================================================

$ErrorActionPreference = "Stop"

$DB_HOST    = "localhost"
$DB_PORT    = "5432"
$DB_USER    = "postgres"
$DB_PASS    = "supabase_local_pw"
$DB_NAME    = "postgres"
$MIGRATIONS = "supabase\migrations"

Write-Host "`n=== Trio CRM — Aplicando Migrations ===" -ForegroundColor Cyan

# Aguarda o PostgreSQL estar pronto
Write-Host "`n[1/3] Verificando conexão com o banco..." -ForegroundColor Yellow
$maxAttempts = 20
$attempt = 0
do {
    $attempt++
    try {
        $env:PGPASSWORD = $DB_PASS
        $result = docker exec trio_crm_db pg_isready -h localhost -U $DB_USER 2>&1
        if ($result -match "accepting connections") {
            Write-Host "     ✓ PostgreSQL pronto!" -ForegroundColor Green
            break
        }
    }
    catch {
        Write-Host "     Tentativa falhou, aguardando..."
    }
    
    if ($attempt -ge $maxAttempts) {
        Write-Error "PostgreSQL não ficou pronto em $($maxAttempts * 2) segundos."
        exit 1
    }
    Write-Host "     Aguardando PostgreSQL... ($attempt/$maxAttempts)"
    Start-Sleep -Seconds 2
} while ($true)

# Obtém lista de migrations em ordem
Write-Host "`n[2/3] Aplicando migrations..." -ForegroundColor Yellow
$files = Get-ChildItem $MIGRATIONS -Filter "*.sql" | Sort-Object Name

$success = 0
$errors  = 0

foreach ($file in $files) {
    Write-Host "  Aplicando $($file.Name)..." -NoNewline
    
    $sql = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Executa via docker exec para não precisar do psql instalado localmente
    $result = $sql | docker exec -i trio_crm_db psql `
        -U $DB_USER `
        -d $DB_NAME `
        --set ON_ERROR_STOP=1 `
        -q 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✓" -ForegroundColor Green
        $success++
    } else {
        Write-Host " ✗ ERRO" -ForegroundColor Red
        Write-Host "     $result" -ForegroundColor DarkRed
        $errors++
        # Para em erro crítico nas migrations fundamentais (001-010)
        $migNum = [int]($file.BaseName -replace '[^0-9].*', '')
        if ($migNum -le 10) {
            Write-Error "Migration crítica falhou. Verifique o banco e tente novamente."
            exit 1
        }
    }
}

Write-Host "`n[3/3] Resultado:" -ForegroundColor Yellow
Write-Host "  ✓ $success migrations aplicadas com sucesso" -ForegroundColor Green
if ($errors -gt 0) {
    Write-Host "  ✗ $errors migrations com erro" -ForegroundColor Red
}

Write-Host "`n=== Setup concluído! ===" -ForegroundColor Cyan
Write-Host "Supabase Studio: http://localhost:3001" -ForegroundColor White
Write-Host "API (Kong):      http://localhost:8000" -ForegroundColor White
Write-Host "App Next.js:     npm run dev" -ForegroundColor White
Write-Host ""
