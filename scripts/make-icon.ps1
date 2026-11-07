# Генерирует build/icon.png (512x512) и build/icon.ico для приложения.
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'build'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function New-KotobaBitmap([int]$size) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.Clear([System.Drawing.Color]::Transparent)

  $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
  $radius = [int]($size * 0.22)
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $radius * 2
  $path.AddArc(0, 0, $d, $d, 180, 90)
  $path.AddArc($size - $d, 0, $d, $d, 270, 90)
  $path.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
  $path.AddArc(0, $size - $d, $d, $d, 90, 90)
  $path.CloseFigure()

  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::FromArgb(255, 235, 104, 82),
    [System.Drawing.Color]::FromArgb(255, 184, 53, 37),
    45
  )
  $g.FillPath($brush, $path)

  $gloss = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    [System.Drawing.Color]::FromArgb(46, 255, 255, 255),
    [System.Drawing.Color]::FromArgb(0, 255, 255, 255),
    90
  )
  $g.FillPath($gloss, $path)

  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(30, 0, 0, 0), [float]($size * 0.008))
  $g.DrawPath($pen, $path)

  $font = New-Object System.Drawing.Font(
    'Yu Mincho',
    [float]($size * 0.62),
    [System.Drawing.FontStyle]::Regular,
    [System.Drawing.GraphicsUnit]::Pixel
  )
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
  $textRect = New-Object System.Drawing.RectangleF(0, [float]($size * 0.045), $size, $size)
  $g.DrawString('あ', $font, $textBrush, $textRect, $format)

  $g.Dispose()
  return $bmp
}

$pngPath = Join-Path $outDir 'icon.png'
$iconPath = Join-Path $outDir 'icon.ico'

$big = New-KotobaBitmap 512
$big.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
$big.Dispose()

# ICO с PNG-полезной нагрузкой 256x256
$small = New-KotobaBitmap 256
$ms = New-Object System.IO.MemoryStream
$small.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$small.Dispose()
$bytes = $ms.ToArray()
$ms.Dispose()

$fs = [System.IO.File]::Create($iconPath)
$bw = New-Object System.IO.BinaryWriter($fs)
$bw.Write([UInt16]0)      # reserved
$bw.Write([UInt16]1)      # type: icon
$bw.Write([UInt16]1)      # count
$bw.Write([Byte]0)        # width 256
$bw.Write([Byte]0)        # height 256
$bw.Write([Byte]0)        # palette
$bw.Write([Byte]0)        # reserved
$bw.Write([UInt16]1)      # planes
$bw.Write([UInt16]32)     # bpp
$bw.Write([UInt32]$bytes.Length)
$bw.Write([UInt32]22)     # offset
$bw.Write($bytes)
$bw.Flush()
$bw.Close()

Write-Output "Готово: $pngPath"
Write-Output "Готово: $iconPath"
