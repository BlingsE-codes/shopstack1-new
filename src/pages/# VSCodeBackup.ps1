# VSCodeBackup.ps1 - Backup VS Code settings & extensions

$backupPath = "$env:USERPROFILE\Desktop\VSCodeBackup"

# Create Backup Directory
if (!(Test-Path -Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath
}

# Paths to VS Code User Data
$settingsPath = "$env:APPDATA\Code\User\settings.json"
$keybindingsPath = "$env:APPDATA\Code\User\keybindings.json"
$snippetsPath = "$env:APPDATA\Code\User\snippets"

# Backup Settings and Keybindings
Copy-Item $settingsPath -Destination $backupPath -Force
Copy-Item $keybindingsPath -Destination $backupPath -Force

# Backup Snippets Folder
if (Test-Path -Path $snippetsPath) {
    Copy-Item $snippetsPath -Destination $backupPath -Recurse -Force
}

# Export Installed Extensions List
code --list-extensions > "$backupPath\extensions-list.txt"

Write-Output "✅ VS Code backup completed successfully at: $backupPath"
