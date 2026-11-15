$ErrorActionPreference = 'Stop'
$dir = 'public\assets\products'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
if (Test-Path "$dir\test.jpg") { Move-Item -Force "$dir\test.jpg" "$dir\product-01.jpg" }
$urls = @{
  'product-02.jpg' = 'photo-1505740420928-5e560c06d30e'
  'product-03.jpg' = 'photo-1523275335684-37898b6baf30'
  'product-04.jpg' = 'photo-1553062407-98eeb64c6a62'
  'product-05.jpg' = 'photo-1572635196237-14b3f281503f'
  'product-06.jpg' = 'photo-1526170375885-4d8ecf77b99f'
  'product-07.jpg' = 'photo-1587829741301-dc798b83add3'
  'product-08.jpg' = 'photo-1491553895911-0055eca6402d'
}
foreach ($k in $urls.Keys) {
  $uri = 'https://images.unsplash.com/' + $urls[$k] + '?q=80&w=900&auto=format&fit=crop'
  Invoke-WebRequest -Uri $uri -OutFile "$dir\$k"
}
Get-ChildItem $dir | Select-Object Name, Length | Format-Table -AutoSize
