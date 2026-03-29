# 🎨 Homepage Modern Design System

## Color Palette (Psychology-Based)

### Primary Colors
- **Primary Blue (Trust & Focus)**: `#667eea`
- **Primary Blue Dark**: `#5a67d8`
- **Primary Purple (Creativity)**: `#764ba2`

### Accent Colors
- **Success Green (Action/Completion)**: `#10b981`
- **Warning Orange (Urgency/Attention)**: `#f97316`
- **Error Red (Warnings)**: `#ef4444`
- **Info Cyan (Information)**: `#06b6d4`

### Neutral Colors
- **White**: `#ffffff`
- **Light Gray 50**: `#f9fafb`
- **Light Gray 100**: `#f3f4f6`
- **Light Gray 200**: `#e5e7eb`
- **Light Gray 500**: `#9ca3af`
- **Dark Gray 700**: `#374151`
- **Dark Gray 900**: `#111827`

### Gradients
- **Primary Gradient**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Success Gradient**: `linear-gradient(135deg, #10b981 0%, #059669 100%)`
- **Warm Gradient**: `linear-gradient(135deg, #f97316 0%, #ea580c 100%)`

---

## Typography System

### Font Stack
- **Primary**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Fallback**: System fonts for better performance

### Font Sizes & Weights

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| **H1** | 3.5rem (56px) | 700 | Hero title |
| **H2** | 2.25rem (36px) | 700 | Section title |
| **H3** | 1.5rem (24px) | 600 | Sub-section title |
| **Body Large** | 1.125rem (18px) | 400 | Large body text |
| **Body** | 1rem (16px) | 400 | Default body & UI |
| **Sm** | 0.875rem (14px) | 400 | Secondary text |
| **Xs** | 0.75rem (12px) | 500 | Labels & badges |

### Line Heights
- **Headings**: 1.2
- **Body**: 1.6
- **Tight**: 1.4

---

## Spacing System (8px baseline)

```
xs: 4px (0.5 × 8)
sm: 8px (1 × 8)
md: 16px (2 × 8)
lg: 24px (3 × 8)
xl: 32px (4 × 8)
2xl: 40px (5 × 8)
3xl: 48px (6 × 8)
4xl: 64px (8 × 8)
```

---

## Component Patterns

### Buttons
- **Primary Button**: Gradient background, white text, rounded corners
- **Secondary Button**: White background, blue text, border
- **Ghost Button**: Transparent, hover effect
- **Size Variations**: sm (32px), md (40px), lg (48px)

### Cards
- **Background**: White or light gray
- **Shadow**: Subtle `0 1px 3px rgba(0,0,0,0.1)`
- **Hover**: Lift effect with shadow increase + 4px translateY
- **Border Radius**: 12px
- **Padding**: 24px

### Inputs & Forms
- **Border**: 2px solid `#e5e7eb`
- **Border Radius**: 8px
- **Focus**: Border color `#667eea` + box-shadow
- **Height**: 44px

---

## Layout Grid

- **Container**: Max-width 1200px, 24px horizontal padding
- **Column System**: 12-column grid
- **Gap**: 24px
- **Responsive Breakpoints**:
  - Mobile: < 640px
  - Tablet: 640px - 1024px
  - Desktop: > 1024px

---

## Animation & Transitions

### Timing Functions
- **Quick**: 150ms (ui interactions)
- **Standard**: 300ms (normal interactions)
- **Slow**: 500ms (important transitions)

### Easing
- **Ease**: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- **Ease-Out**: `cubic-bezier(0.34, 1.56, 0.64, 1)`

### Micro-interactions
- **Hover**: Scale 1.02 + shadow increase
- **Click**: Scale 0.98
- **Focus**: Glow effect with box-shadow

---

## Homepage Sections

### 1. Hero Section
- **Height**: 100vh (responsive)
- **Background**: Gradient or image with overlay
- **Content Alignment**: Center/Left with grid
- **CTA**: Primary button with arrow icon

### 2. Features Section
- **Layout**: 3-column grid (responsive to 1 column)
- **Cards**: Icon + Title + Description
- **Icon Size**: 48px in gradient background

### 3. How It Works
- **Layout**: 4-step flow with connecting lines
- **Each Step**: Number + Title + Description
- **Visual**: Connected dots/lines

### 4. Testimonials
- **Layout**: 3 testimonial cards
- **Content**: Quote + Author + Role + Avatar
- **Stars**: 5-star rating

### 5. CTA Section
- **Background**: Gradient
- **Content**: Headline + Description + Button
- **Text Color**: White

### 6. Footer
- **Background**: Dark gray
- **Layout**: 4-5 columns
- **Content**: Links, copyright, social icons

---

## Accessibility Standards (WCAG AA)

- **Color Contrast**: Minimum 4.5:1 for text
- **Focus Indicators**: Clear and visible
- **Keyboard Navigation**: Fully supported
- **Semantic HTML**: Proper heading hierarchy
- **Alt Text**: All images have descriptive alt text

---

## Performance Guidelines

- **Mobile First**: Design and code for mobile first
- **Lazy Loading**: Images and components
- **CSS**: Minified and optimized
- **Animations**: GPU-accelerated (transform, opacity)
- **Images**: Responsive and optimized formats

---

## Design Tokens (CSS Variables)

```css
:root {
  /* Colors */
  --color-primary: #667eea;
  --color-primary-dark: #5a67d8;
  --color-accent: #764ba2;
  --color-success: #10b981;
  --color-warning: #f97316;
  --color-error: #ef4444;
  
  /* Neutrals */
  --color-white: #ffffff;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-500: #9ca3af;
  --color-gray-700: #374151;
  --color-gray-900: #111827;
  
  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-h1: 3.5rem;
  --font-size-h2: 2.25rem;
  --font-size-h3: 1.5rem;
  --font-size-body: 1rem;
  --font-size-sm: 0.875rem;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 40px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 50%;
  
  /* Transitions */
  --transition-quick: 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --transition-base: 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --transition-slow: 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

---

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)
