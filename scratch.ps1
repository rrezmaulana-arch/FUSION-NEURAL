$latestImage = Get-ChildItem -Path 'C:\Users\Reza_Moetia\.gemini\antigravity\brain\d4161468-51b9-4ad6-875a-f57da316c741\.tempmediaStorage' -Filter '*.png' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($null -ne $latestImage) {
    Copy-Item $latestImage.FullName -Destination 'c:\Olivia\FUSION NEURAL\src\assets\olivia-logo.png'
    Write-Host "Copied $($latestImage.FullName)"
}
