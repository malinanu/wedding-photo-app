# Setup script for mobile testing of Wedding Photo App

Write-Host "`n📱 Mobile Testing Setup for Wedding Photo App" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Get local IP addresses
Write-Host "Finding your local network IP addresses..." -ForegroundColor Yellow
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" -and
    $_.IPAddress -ne "::1"
}

$localIPs = @()
foreach ($ip in $ipAddresses) {
    if ($ip.IPAddress -match "^192\.168\.|^10\.|^172\.") {
        $localIPs += $ip.IPAddress
    }
}

if ($localIPs.Count -eq 0) {
    Write-Host "❌ No local network IP found. Make sure you're connected to a network." -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Found local IP address(es):" -ForegroundColor Green
$selectedIP = $localIPs[0]
$index = 1
foreach ($ip in $localIPs) {
    Write-Host "  [$index] $ip" -ForegroundColor Cyan
    $index++
}

if ($localIPs.Count -gt 1) {
    Write-Host ""
    $selection = Read-Host "Select which IP to use (1-$($localIPs.Count)) [default: 1]"
    if ($selection -and $selection -match "^\d+$") {
        $selectedIndex = [int]$selection - 1
        if ($selectedIndex -ge 0 -and $selectedIndex -lt $localIPs.Count) {
            $selectedIP = $localIPs[$selectedIndex]
        }
    }
}

$appUrl = "http://${selectedIP}:3000"
Write-Host "`n🌐 Your app will be accessible at:" -ForegroundColor Green
Write-Host "   $appUrl" -ForegroundColor Yellow
Write-Host ""

# Generate test URLs
Write-Host "📱 Test URLs for mobile scanning:" -ForegroundColor Cyan
Write-Host ""

$eventId = "wedding2025"
$tables = 1..5

Write-Host "Direct access URL:" -ForegroundColor White
Write-Host "  $appUrl" -ForegroundColor Yellow
Write-Host ""

Write-Host "Table-specific URLs (for QR codes):" -ForegroundColor White
foreach ($table in $tables) {
    $tableUrl = "${appUrl}?event=${eventId}&table=${table}"
    Write-Host "  Table $table : $tableUrl" -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📋 Next Steps:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Update your .env file:" -ForegroundColor Yellow
Write-Host "   NEXT_PUBLIC_APP_URL=`"$appUrl`"" -ForegroundColor White
Write-Host ""
Write-Host "2. Windows Firewall Configuration:" -ForegroundColor Yellow
Write-Host "   Run this command to allow access through firewall:" -ForegroundColor White
Write-Host "   " -NoNewline
Write-Host "New-NetFirewallRule -DisplayName 'Wedding Photo App' -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Start the app:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "   OR" -ForegroundColor Gray
Write-Host "   docker-compose -f docker-compose.app.yml up -d" -ForegroundColor White
Write-Host ""
Write-Host "4. On your phone:" -ForegroundColor Yellow
Write-Host "   - Connect to the same WiFi network" -ForegroundColor White
Write-Host "   - Open browser and go to: $appUrl" -ForegroundColor White
Write-Host "   - Or scan a QR code generated for the URLs above" -ForegroundColor White
Write-Host ""
Write-Host "5. Generate QR codes:" -ForegroundColor Yellow
Write-Host "   Visit: https://qr-code-generator.com" -ForegroundColor White
Write-Host "   Enter one of the URLs above to create QR codes" -ForegroundColor White
Write-Host ""

# Ask if user wants to open firewall port
Write-Host "Would you like to open the firewall port now? (y/n) " -NoNewline -ForegroundColor Yellow
$openFirewall = Read-Host

if ($openFirewall -eq 'y' -or $openFirewall -eq 'Y') {
    Write-Host "`nOpening firewall port 3000..." -ForegroundColor Yellow
    try {
        # Remove existing rule if it exists
        Remove-NetFirewallRule -DisplayName "Wedding Photo App" -ErrorAction SilentlyContinue
        
        # Create new firewall rule
        New-NetFirewallRule -DisplayName "Wedding Photo App" `
            -Direction Inbound `
            -Protocol TCP `
            -LocalPort 3000 `
            -Action Allow `
            -Profile Private,Public | Out-Null
            
        Write-Host "✅ Firewall port 3000 opened successfully!" -ForegroundColor Green
        Write-Host "   You can close it later with:" -ForegroundColor Gray
        Write-Host "   Remove-NetFirewallRule -DisplayName 'Wedding Photo App'" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Failed to open firewall port. Run PowerShell as Administrator." -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✨ Setup complete! Your app is ready for mobile testing." -ForegroundColor Green
Write-Host ""

# Display QR code in terminal (optional - using Unicode box characters)
Write-Host "Sample QR Code Pattern (scan actual QR from generator):" -ForegroundColor Gray
Write-Host "  ██████████████████████████" -ForegroundColor DarkGray
Write-Host "  ██ ▄▄▄▄▄ ██   ██ ▄▄▄▄▄ ██" -ForegroundColor DarkGray
Write-Host "  ██ █   █ ██████ █   █ ██" -ForegroundColor DarkGray
Write-Host "  ██ █▄▄▄█ ██   ██ █▄▄▄█ ██" -ForegroundColor DarkGray
Write-Host "  ██▄▄▄▄▄▄▄██ █ ██▄▄▄▄▄▄▄██" -ForegroundColor DarkGray
Write-Host "  ██ URL HERE: $appUrl    ██" -ForegroundColor DarkGray
Write-Host "  ██████████████████████████" -ForegroundColor DarkGray
