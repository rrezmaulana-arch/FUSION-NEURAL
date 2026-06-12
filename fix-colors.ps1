$files = Get-ChildItem -Path 'frontend\src' -Include '*.tsx', '*.ts' -Recurse
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    if ($content -match 'emerald' -or $content -match '#10B981') {
        $content = $content -replace 'emerald', 'purple'
        $content = $content -replace '#10B981', '#760EFF'
        Set-Content -Path $f.FullName -Value $content
    }
}
