# Task Plan

## Issues
1. Gallery play/stop buttons overlapped by bottom tab bar
2. Gallery tab bar shows "Gallery" and "Packages" but should show "Portfolio" and "Studio"

## Changes needed

### 1. frontend/src/render.ts
- Add `GALLERY_NAV` constant with `[Portfolio, Studio]`
- Update `renderGalleryPage()` to use `GALLERY_NAV` instead of `STUDIO_NAV`

### 2. frontend/src/gallery-panorama.ts
- Boost tile z-index minimum so tiles always render above the bottom tab bar (z-index 110)
- Change z-index calculation: add `+ 200_000` offset to current formula

### 3. Verify with `npm run build`