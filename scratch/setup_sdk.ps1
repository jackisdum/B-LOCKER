# B-LOCKER Android SDK Setup Automation
$ErrorActionPreference = "Stop"

$baseDir = "C:\android"
$zipPath = "$baseDir\commandlinetools-win-14742923_latest.zip"
$extractDir = "$baseDir\temp_extract"
$targetDir = "$baseDir\cmdline-tools\latest"

Write-Host "--- Starting Android SDK Setup ---"

# 1. Clean up old attempts
if (Test-Path $extractDir) { Remove-Item -Recurse -Force $extractDir }
if (Test-Path "$baseDir\cmdline-tools") { Remove-Item -Recurse -Force "$baseDir\cmdline-tools" }

# 2. Extract ZIP
Write-Host "Extracting ZIP..."
Expand-Archive -Path $zipPath -DestinationPath $extractDir

# 3. Create target directory structure
Write-Host "Organizing files..."
New-Item -ItemType Directory -Path $targetDir -Force
Move-Item -Path "$extractDir\cmdline-tools\*" -Destination $targetDir -Force

# 4. Set Environment Variables for this session and permanently
Write-Host "Setting Environment Variables..."
$env:JAVA_HOME = "C:\Program Files\Java\jdk-24"
$env:ANDROID_HOME = $baseDir
$env:SKIP_JDK_VERSION_CHECK = "1"
$env:Path += ";$targetDir\bin;$baseDir\platform-tools"

[Environment]::SetEnvironmentVariable("ANDROID_HOME", $baseDir, "User")
$oldPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($oldPath -notlike "*$baseDir\platform-tools*") {
    [Environment]::SetEnvironmentVariable("Path", "$oldPath;$targetDir\bin;$baseDir\platform-tools", "User")
}

# 5. Accept Licenses
Write-Host "Accepting licenses..."
$yes = "y`ny`ny`ny`ny`ny`ny`ny`ny`n" # Multiple yes's for prompts
$yes | & "$targetDir\bin\sdkmanager.bat" --licenses

# 6. Install SDK Components
Write-Host "Installing SDK components (platform-tools, platforms;android-34, build-tools;34.0.0)..."
& "$targetDir\bin\sdkmanager.bat" "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# 7. Create local.properties for the project
Write-Host "Configuring project local.properties..."
$propsContent = "sdk.dir=C:/android"
$propsContent | Out-File -FilePath "e:\B-LOCKER\android\local.properties" -Encoding utf8

Write-Host "--- Setup Complete! ---"
Write-Host "You may need to restart your terminal for the Path changes to take effect."
