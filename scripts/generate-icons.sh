#!/bin/bash
# Generate all required icon assets from icon.svg
set -e

ASSETS_DIR="$(dirname "$0")/../assets"
SVG="$ASSETS_DIR/icon.svg"

echo "Generating PWA and app icons from $SVG..."

# Helper: create sized SVG by injecting width/height into root <svg>, then convert to PNG
generate() {
  local size=$1
  local out_svg=$2
  local out_png=$3

  # Inject explicit width and height into the SVG root element
  sed "s|width=\"100%\" height=\"100%\"|width=\"$size\" height=\"$size\"|" "$SVG" > "$out_svg"

  # Convert SVG to PNG using rsvg-convert
  rsvg-convert -w "$size" -h "$size" "$out_svg" -o "$out_png"

  # Remove intermediate SVG (keep only PNG for Expo)
  rm -f "$out_svg"

  echo "  ✓ $out_png (${size}x${size})"
}

# 1. Main app icon (512x512)
generate 512 "$ASSETS_DIR/_tmp_icon.svg" "$ASSETS_DIR/icon.png"

# 2. Web favicon (48x48)
generate 48 "$ASSETS_DIR/_tmp_favicon.svg" "$ASSETS_DIR/favicon.png"

# 3. PWA icons
generate 192 "$ASSETS_DIR/_tmp_192.svg" "$ASSETS_DIR/icon-192.png"
generate 512 "$ASSETS_DIR/_tmp_512.svg" "$ASSETS_DIR/icon-512.png"

# 4. PWA maskable icon (512x512 with safe zone — scale content to 80% centered)
# We create a version with extra padding for maskable safe zone
cat > "$ASSETS_DIR/_tmp_maskable.svg" << 'MASKABLE_EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#2e083a" />
    </linearGradient>
    <linearGradient id="clock-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c084fc" />
      <stop offset="100%" stop-color="#f43f5e" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <!-- Full bleed background for maskable safe zone -->
  <rect width="512" height="512" fill="url(#bg-grad)" />
  <!-- Content scaled to 80% centered (safe zone: 40.6px inset on each side) -->
  <g transform="translate(51.2, 51.2) scale(0.8)">
    <rect x="32" y="32" width="448" height="448" rx="108" fill="url(#bg-grad)" stroke="#4c1d95" stroke-width="4" />
    <path d="M120 160 C100 110, 160 70, 190 105 Z" fill="url(#clock-grad)" opacity="0.85" />
    <path d="M392 160 C412 110, 352 70, 322 105 Z" fill="url(#clock-grad)" opacity="0.85" />
    <rect x="135" y="400" width="30" height="50" rx="15" transform="rotate(25 150 425)" fill="#6b21a8" />
    <rect x="347" y="400" width="30" height="50" rx="15" transform="rotate(-25 362 425)" fill="#6b21a8" />
    <circle cx="256" cy="270" r="145" fill="none" stroke="url(#clock-grad)" stroke-width="22" filter="url(#glow)" />
    <circle cx="256" cy="270" r="125" fill="#110e2e" />
    <circle cx="256" cy="170" r="8" fill="#f43f5e" filter="url(#glow)" />
    <circle cx="356" cy="270" r="7" fill="#c084fc" />
    <circle cx="256" cy="370" r="7" fill="#c084fc" />
    <circle cx="156" cy="270" r="7" fill="#c084fc" />
    <path d="M256 270 L256 210" stroke="#ffffff" stroke-width="10" stroke-linecap="round" />
    <path d="M256 270 L320 270" stroke="#ffffff" stroke-width="8" stroke-linecap="round" />
    <circle cx="256" cy="270" r="12" fill="#f43f5e" filter="url(#glow)" />
    <circle cx="256" cy="270" r="5" fill="#ffffff" />
  </g>
</svg>
MASKABLE_EOF
rsvg-convert -w 512 -h 512 "$ASSETS_DIR/_tmp_maskable.svg" -o "$ASSETS_DIR/maskable-icon-512.png"
rm -f "$ASSETS_DIR/_tmp_maskable.svg"
echo "  ✓ $ASSETS_DIR/maskable-icon-512.png (512x512 maskable)"

# 5. Android adaptive icon — foreground (432x432 with transparent padding for safe zone)
# Android expects foreground to be 108dp out of 432dp total, centered
# The icon content should be within the center 304x304 (72dp safe zone on each side)
cat > "$ASSETS_DIR/_tmp_fg.svg" << 'FG_EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 432 432" width="432" height="432">
  <defs>
    <linearGradient id="clock-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c084fc" />
      <stop offset="100%" stop-color="#f43f5e" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <!-- Foreground: icon content centered within 432x432, safe to crop 72dp on each side -->
  <g transform="translate(24, 24) scale(0.75)">
    <path d="M120 160 C100 110, 160 70, 190 105 Z" fill="url(#clock-grad)" opacity="0.85" />
    <path d="M392 160 C412 110, 352 70, 322 105 Z" fill="url(#clock-grad)" opacity="0.85" />
    <rect x="135" y="400" width="30" height="50" rx="15" transform="rotate(25 150 425)" fill="#6b21a8" />
    <rect x="347" y="400" width="30" height="50" rx="15" transform="rotate(-25 362 425)" fill="#6b21a8" />
    <circle cx="256" cy="270" r="145" fill="none" stroke="url(#clock-grad)" stroke-width="22" filter="url(#glow)" />
    <circle cx="256" cy="270" r="125" fill="#110e2e" />
    <circle cx="256" cy="170" r="8" fill="#f43f5e" filter="url(#glow)" />
    <circle cx="356" cy="270" r="7" fill="#c084fc" />
    <circle cx="256" cy="370" r="7" fill="#c084fc" />
    <circle cx="156" cy="270" r="7" fill="#c084fc" />
    <path d="M256 270 L256 210" stroke="#ffffff" stroke-width="10" stroke-linecap="round" />
    <path d="M256 270 L320 270" stroke="#ffffff" stroke-width="8" stroke-linecap="round" />
    <circle cx="256" cy="270" r="12" fill="#f43f5e" filter="url(#glow)" />
    <circle cx="256" cy="270" r="5" fill="#ffffff" />
  </g>
</svg>
FG_EOF
rsvg-convert -w 432 -h 432 "$ASSETS_DIR/_tmp_fg.svg" -o "$ASSETS_DIR/android-icon-foreground.png"
rm -f "$ASSETS_DIR/_tmp_fg.svg"
echo "  ✓ $ASSETS_DIR/android-icon-foreground.png (432x432 foreground)"

# 6. Android adaptive icon — background (432x432 solid gradient)
cat > "$ASSETS_DIR/_tmp_bg.svg" << 'BG_EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 432 432" width="432" height="432">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#2e083a" />
    </linearGradient>
  </defs>
  <rect width="432" height="432" fill="url(#bg-grad)" />
</svg>
BG_EOF
rsvg-convert -w 432 -h 432 "$ASSETS_DIR/_tmp_bg.svg" -o "$ASSETS_DIR/android-icon-background.png"
rm -f "$ASSETS_DIR/_tmp_bg.svg"
echo "  ✓ $ASSETS_DIR/android-icon-background.png (432x432 background)"

# 7. Android monochrome icon (432x432, single color)
cat > "$ASSETS_DIR/_tmp_mono.svg" << 'MONO_EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 432 432" width="432" height="432">
  <!-- Monochrome: single color for Android themed icons -->
  <g transform="translate(24, 24) scale(0.75)">
    <path d="M120 160 C100 110, 160 70, 190 105 Z" fill="#ffffff" opacity="0.85" />
    <path d="M392 160 C412 110, 352 70, 322 105 Z" fill="#ffffff" opacity="0.85" />
    <rect x="135" y="400" width="30" height="50" rx="15" transform="rotate(25 150 425)" fill="#ffffff" />
    <rect x="347" y="400" width="30" height="50" rx="15" transform="rotate(-25 362 425)" fill="#ffffff" />
    <circle cx="256" cy="270" r="145" fill="none" stroke="#ffffff" stroke-width="22" />
    <circle cx="256" cy="270" r="125" fill="none" />
    <circle cx="256" cy="170" r="8" fill="#ffffff" />
    <circle cx="356" cy="270" r="7" fill="#ffffff" />
    <circle cx="256" cy="370" r="7" fill="#ffffff" />
    <circle cx="156" cy="270" r="7" fill="#ffffff" />
    <path d="M256 270 L256 210" stroke="#ffffff" stroke-width="10" stroke-linecap="round" />
    <path d="M256 270 L320 270" stroke="#ffffff" stroke-width="8" stroke-linecap="round" />
    <circle cx="256" cy="270" r="12" fill="#ffffff" />
    <circle cx="256" cy="270" r="5" fill="#ffffff" />
  </g>
</svg>
MONO_EOF
rsvg-convert -w 432 -h 432 "$ASSETS_DIR/_tmp_mono.svg" -o "$ASSETS_DIR/android-icon-monochrome.png"
rm -f "$ASSETS_DIR/_tmp_mono.svg"
echo "  ✓ $ASSETS_DIR/android-icon-monochrome.png (432x432 monochrome)"

# 8. Splash icon (512x512) — same as main icon
cp "$ASSETS_DIR/icon.png" "$ASSETS_DIR/splash-icon.png"
echo "  ✓ $ASSETS_DIR/splash-icon.png (512x512 splash)"

# Cleanup any temp files
rm -f "$ASSETS_DIR"/_tmp_*.svg

echo ""
echo "All icons generated successfully!"
ls -la "$ASSETS_DIR"/*.png
