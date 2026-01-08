# Script para limpar instalações anteriores do Pomodoro
Write-Host "🧹 Limpando instalações anteriores do Pomodoro..." -ForegroundColor Yellow

# Parar processos em execução
Write-Host "🛑 Parando processos em execução..." -ForegroundColor Cyan
Get-Process | Where-Object { $_.ProcessName -like "*Pomodoro*" -or $_.ProcessName -like "*pomodoro*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Remover diretório de instalação
$installPath = "$env:LOCALAPPDATA\Programs\pomodoro"
if (Test-Path $installPath) {
    Write-Host "🗂️ Removendo diretório de instalação: $installPath" -ForegroundColor Cyan
    Remove-Item $installPath -Recurse -Force -ErrorAction SilentlyContinue
}

# Remover diretório de instalação alternativo
$installPath2 = "$env:LOCALAPPDATA\Programs\Analice Pomodoro Timer"
if (Test-Path $installPath2) {
    Write-Host "🗂️ Removendo diretório de instalação: $installPath2" -ForegroundColor Cyan
    Remove-Item $installPath2 -Recurse -Force -ErrorAction SilentlyContinue
}

# Remover atalhos da área de trabalho
$desktopShortcut = "$env:USERPROFILE\Desktop\Pomodoro.lnk"
if (Test-Path $desktopShortcut) {
    Write-Host "🗂️ Removendo atalho da área de trabalho" -ForegroundColor Cyan
    Remove-Item $desktopShortcut -Force -ErrorAction SilentlyContinue
}

$desktopShortcut2 = "$env:USERPROFILE\Desktop\Analice Pomodoro Timer.lnk"
if (Test-Path $desktopShortcut2) {
    Write-Host "🗂️ Removendo atalho da área de trabalho" -ForegroundColor Cyan
    Remove-Item $desktopShortcut2 -Force -ErrorAction SilentlyContinue
}

# Remover do menu iniciar
$startMenuPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Pomodoro.lnk"
if (Test-Path $startMenuPath) {
    Write-Host "🗂️ Removendo do menu iniciar" -ForegroundColor Cyan
    Remove-Item $startMenuPath -Force -ErrorAction SilentlyContinue
}

$startMenuPath2 = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Analice Pomodoro Timer.lnk"
if (Test-Path $startMenuPath2) {
    Write-Host "🗂️ Removendo do menu iniciar" -ForegroundColor Cyan
    Remove-Item $startMenuPath2 -Force -ErrorAction SilentlyContinue
}

Write-Host "✅ Limpeza concluída! Agora você pode instalar a nova versão." -ForegroundColor Green
Write-Host "💡 Execute 'npm run build' para criar uma nova versão." -ForegroundColor Blue