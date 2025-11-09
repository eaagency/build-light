# BuildLight Logo Setup

## Current Implementation

The navigation currently uses a simple text-based logo placeholder:
- Graphite Black (#121212) background
- White "BL" monogram
- Rounded corners
- Located in both main navigation and dashboard layout

## Adding the Actual Logo

### 1. Download the Logo

Download the BuildLight logo from:
https://drive.google.com/file/d/1Satbgq26sUlqVJA1l6GMU05mKDVy_xTk/view?usp=sharing

### 2. Save to Public Directory

Save the logo as:
```
/public/logo.svg
```
or
```
/public/logo.png
```

### 3. Update Navigation Components

Replace the logo placeholder in these files:

#### `/components/navigation.tsx` (around line 17)

Replace:
```tsx
<div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
  <span className="text-white font-bold text-xl">BL</span>
</div>
```

With:
```tsx
<Image
  src="/logo.svg"
  alt="BuildLight Logo"
  width={40}
  height={40}
  className="w-10 h-10"
/>
```

Don't forget to import Image:
```tsx
import Image from "next/image";
```

#### `/app/dashboard/layout.tsx` (around line 30)

Make the same replacement as above.

### 4. Logo Specifications

The logo should be:
- Geometric B/L monogram design
- Primary color: #121212 (Graphite Black)
- SVG format (preferred) or PNG with transparent background
- Square aspect ratio
- Minimum size: 40x40px
- Optimized for both light and dark modes

### 5. Dark Mode Support (Optional)

If you need different versions for light/dark mode:

```tsx
<Image
  src="/logo-light.svg"
  alt="BuildLight Logo"
  width={40}
  height={40}
  className="w-10 h-10 dark:hidden"
/>
<Image
  src="/logo-dark.svg"
  alt="BuildLight Logo"
  width={40}
  height={40}
  className="w-10 h-10 hidden dark:block"
/>
```

## Current Logo Locations

The logo appears in:
1. Main navigation (`/components/navigation.tsx`)
2. Dashboard layout (`/app/dashboard/layout.tsx`)
3. Both desktop and mobile views

## Testing

After adding the logo:
1. Check homepage navigation
2. Check dashboard navigation
3. Test in both light and dark modes
4. Verify mobile responsiveness
5. Test hover states and link functionality
