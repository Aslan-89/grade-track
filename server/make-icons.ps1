Add-Type -AssemblyName System.Drawing

function New-Icon {
  param([int]$S, [string]$Out)

  $bmp = New-Object System.Drawing.Bitmap($S, $S)
  $g   = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode   = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver

  # -- Background rounded rect (dark blue/purple) --
  $rr = [int]($S * 0.215)
  $bgP = New-Object System.Drawing.Drawing2D.GraphicsPath
  $bgP.AddArc(0, 0, $rr*2, $rr*2, 180, 90)
  $bgP.AddArc($S-$rr*2, 0, $rr*2, $rr*2, 270, 90)
  $bgP.AddArc($S-$rr*2, $S-$rr*2, $rr*2, $rr*2, 0, 90)
  $bgP.AddArc(0, $S-$rr*2, $rr*2, $rr*2, 90, 90)
  $bgP.CloseFigure()
  $bgBr = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.PointF(0,0)),
    (New-Object System.Drawing.PointF([float]$S,[float]$S)),
    [System.Drawing.Color]::FromArgb(255,22,10,55),
    [System.Drawing.Color]::FromArgb(255,8,18,36))
  $g.FillPath($bgBr, $bgP)

  # -- Book body (glass-like panel) --
  $bx = [int]($S*0.215); $by = [int]($S*0.155)
  $bw = [int]($S*0.570); $bh = [int]($S*0.690)
  $br2 = [int]($S*0.055)*2
  $bookP = New-Object System.Drawing.Drawing2D.GraphicsPath
  $bookP.AddArc($bx, $by, $br2, $br2, 180, 90)
  $bookP.AddArc($bx+$bw-$br2, $by, $br2, $br2, 270, 90)
  $bookP.AddArc($bx+$bw-$br2, $by+$bh-$br2, $br2, $br2, 0, 90)
  $bookP.AddArc($bx, $by+$bh-$br2, $br2, $br2, 90, 90)
  $bookP.CloseFigure()
  $g.FillPath((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(22,255,255,255))), $bookP)
  $g.DrawPath((New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(45,255,255,255), [float]([int]($S*0.006)))), $bookP)

  # -- Spine bar (purple -> blue gradient) --
  $sw2 = [int]($S*0.095)
  $spBr = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.PointF([float]$bx, [float]$by)),
    (New-Object System.Drawing.PointF([float]$bx, [float]($by+$bh))),
    [System.Drawing.Color]::FromArgb(255,124,58,237),
    [System.Drawing.Color]::FromArgb(255,37,99,235))
  $spP = New-Object System.Drawing.Drawing2D.GraphicsPath
  $spP.AddArc($bx, $by, $br2, $br2, 180, 90)
  $spP.AddLine($bx+$sw2, $by, $bx+$sw2, $by+$bh)
  $spP.AddArc($bx, $by+$bh-$br2, $br2, $br2, 90, 90)
  $spP.CloseFigure()
  $g.FillPath($spBr, $spP)

  # -- Text lines --
  $lx  = $bx + $sw2 + [int]($S*0.055)
  $lw  = [int]($S*0.295)
  $lh  = [int]($S*0.042)
  $gap = [int]($S*0.085)
  $ly0 = $by + [int]($bh*0.200)
  $br1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(215,255,255,255))
  $br2c= New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(130,255,255,255))
  $g.FillRectangle($br1,  $lx, $ly0,           $lw,            $lh)
  $g.FillRectangle($br2c, $lx, $ly0+$gap,       [int]($lw*0.80), $lh)
  $g.FillRectangle($br2c, $lx, $ly0+$gap*2,     [int]($lw*0.90), $lh)
  $g.FillRectangle($br2c, $lx, $ly0+$gap*3,     [int]($lw*0.65), $lh)

  # -- Accent dots at bottom --
  $dotR = [int]($S*0.036)
  $dy   = $by + $bh - [int]($S*0.115)
  $dotColors = @(
    [System.Drawing.Color]::FromArgb(220,124,58,237),
    [System.Drawing.Color]::FromArgb(180,37,99,235),
    [System.Drawing.Color]::FromArgb(140,6,182,212))
  for ($i = 0; $i -lt 3; $i++) {
    $dx = $lx + $i * ($dotR*2 + [int]($S*0.025))
    $g.FillEllipse((New-Object System.Drawing.SolidBrush($dotColors[$i])), $dx, $dy, $dotR*2, $dotR*2)
  }

  $g.Dispose()
  $bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "  Created: $Out ($S x $S px)"
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host ""
Write-Host "  Generating PNG icons..." -ForegroundColor Cyan
New-Icon -S 192 -Out "$root\icons\icon-192.png"
New-Icon -S 512 -Out "$root\icons\icon-512.png"
Write-Host ""
Write-Host "  Done! Re-deploy the PWA folder to Netlify." -ForegroundColor Green
Write-Host ""
