# ============================================================
# setup-db.ps1 - Applies Trio CRM local Supabase migrations
# ============================================================

$ErrorActionPreference = "Stop"

$DB_USER = "postgres"
$DB_NAME = "postgres"
$MIGRATIONS = "supabase\migrations"

Write-Host "`n=== Trio CRM - Applying migrations ===" -ForegroundColor Cyan

Write-Host "`n[1/4] Checking PostgreSQL..." -ForegroundColor Yellow
$maxAttempts = 20
$attempt = 0

do {
    $attempt++
    try {
        $result = docker exec trio_crm_db pg_isready -h localhost -U $DB_USER 2>&1
        if ($result -match "accepting connections") {
            Write-Host "     PostgreSQL ready" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "     Attempt failed, waiting..."
    }

    if ($attempt -ge $maxAttempts) {
        Write-Error "PostgreSQL was not ready after $($maxAttempts * 2) seconds."
        exit 1
    }

    Write-Host "     Waiting for PostgreSQL... ($attempt/$maxAttempts)"
    Start-Sleep -Seconds 2
} while ($true)

function Invoke-DbSql {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Sql
    )

    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $output = $Sql | docker exec -i trio_crm_db psql `
        -U $DB_USER `
        -d $DB_NAME `
        --set ON_ERROR_STOP=1 `
        -q 2>&1
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = $oldPreference

    return [pscustomobject]@{
        ExitCode = $exitCode
        Output = $output
    }
}

Write-Host "`n[2/4] Preparing uuid compatibility..." -ForegroundColor Yellow
$uuidWrapper = "infra\uuid-wrapper.sql"
if (Test-Path $uuidWrapper) {
    $sql = Get-Content $uuidWrapper -Raw -Encoding UTF8
    $result = Invoke-DbSql -Sql $sql
    if ($result.ExitCode -ne 0) {
        Write-Host "     Failed to prepare uuid_generate_v4" -ForegroundColor Red
        Write-Host "     $($result.Output)" -ForegroundColor DarkRed
        exit 1
    }
}

Write-Host "`n[3/4] Applying migrations..." -ForegroundColor Yellow
$files = Get-ChildItem $MIGRATIONS -Filter "*.sql" | Sort-Object Name

if (Test-Path (Join-Path $MIGRATIONS "001_initial_schema_noext.sql")) {
    $files = $files | Where-Object { $_.Name -ne "001_initial_schema.sql" }
}

if (Test-Path (Join-Path $MIGRATIONS "030_ai_knowledge_noext.sql")) {
    $files = $files | Where-Object { $_.Name -ne "030_ai_knowledge.sql" }
}

$success = 0
$errors = 0

foreach ($file in $files) {
    Write-Host "  Applying $($file.Name)..." -NoNewline
    $sql = Get-Content $file.FullName -Raw -Encoding UTF8
    $result = Invoke-DbSql -Sql $sql

    if ($result.ExitCode -eq 0) {
        Write-Host " OK" -ForegroundColor Green
        $success++
    } else {
        Write-Host " ERROR" -ForegroundColor Red
        Write-Host "     $($result.Output)" -ForegroundColor DarkRed
        $errors++

        $migNum = [int]($file.BaseName -replace '[^0-9].*', '')
        if ($migNum -le 10) {
            Write-Error "Critical migration failed. Check the database and try again."
            exit 1
        }
    }
}

Write-Host "`n[4/4] Result:" -ForegroundColor Yellow
Write-Host "  $success migrations applied successfully" -ForegroundColor Green
if ($errors -gt 0) {
    Write-Host "  $errors migrations failed" -ForegroundColor Red
}

Write-Host "`n=== Setup complete ===" -ForegroundColor Cyan
Write-Host "Supabase Studio: http://localhost:3001" -ForegroundColor White
Write-Host "API (Kong):      http://localhost:8000" -ForegroundColor White
Write-Host "App Next.js:     npm run dev" -ForegroundColor White
Write-Host ""

if ($errors -gt 0) {
    exit 1
}
