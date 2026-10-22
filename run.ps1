param([ValidateSet('dev','start','build','lint','typecheck','test','test:e2e','check','ci')][string]$Task = 'dev')
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$portfolioNode = (Get-Command node -ErrorAction SilentlyContinue).Source
if (!$portfolioNode -or [int]((& $portfolioNode --version) -replace '^v(\d+).*','$1') -lt 24) {
  $portfolioBundledNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
  if (Test-Path -LiteralPath $portfolioBundledNode) { $portfolioNode = $portfolioBundledNode }
  else { throw 'Install Node.js 24 LTS before running this project.' }
}
$portfolioNpm = (Get-Command npm.cmd -ErrorAction Stop).Source
$portfolioNpmCli = Join-Path (Split-Path $portfolioNpm) 'node_modules\npm\bin\npm-cli.js'
$env:Path = (Split-Path $portfolioNode) + ';' + $env:Path
if ($Task -eq 'ci') { & $portfolioNode $portfolioNpmCli ci }
else { & $portfolioNode $portfolioNpmCli run $Task }
exit $LASTEXITCODE
