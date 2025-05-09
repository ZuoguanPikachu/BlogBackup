$source = "C:\Users\zuoguan\Documents\Blog\source\_posts"
$destination = "C:\Users\zuoguan\Documents\BlogBackup\src\posts"

if (!(Test-Path $source)) {
    Write-Host "源目录不存在：$source" -ForegroundColor Red
    exit 1
}

if (!(Test-Path $destination)) {
    Write-Host "目标目录不存在，正在创建：$destination"
    New-Item -ItemType Directory -Path $destination | Out-Null
}

Get-ChildItem -Path $destination -Recurse -Force | Remove-Item -Force -Recurse

Write-Host "复制文件从 $source 到 $destination ..."
Copy-Item -Path "$source\*" -Destination $destination -Recurse -Force

Write-Host "同步完成。" -ForegroundColor Green
