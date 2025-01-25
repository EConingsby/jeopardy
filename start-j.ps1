# Start Chrome in a new window
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chrome)) {
    $chrome = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
    if (-not (Test-Path $chrome)) {
        Write-Error "Chrome not found in standard locations"
        exit 1
    }
}

# Start Chrome in a new window
Start-Process powershell -ArgumentList @"
    & '$chrome' --new-window 'http://localhost:3000/' 'http://localhost:3000/#/board'
"@

# Start the Node.js server in the current window
Write-Host "Starting Jeopardy server..."
node app.js
