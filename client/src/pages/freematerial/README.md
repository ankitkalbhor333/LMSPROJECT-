# Free Study Material - CSS & Component Structure

## 📁 Folder Organization

```
client/src/
├── pages/
│   └── freematerial/
│       ├── FreeStudyMaterial.jsx (Main Page Component)
│       └── FreeStudyMaterial.css (Main Page Styles)
│
└── components/
    └── freematerial/
        ├── StudyTabs.jsx
        ├── StudyTabs.css
        ├── VideoSection.jsx
        ├── VideoSection.css
        ├── VideoCard.jsx
        ├── NotesSection.jsx
        ├── NotesSection.css
        ├── NoteCard.jsx
        ├── TestSection.jsx
        ├── TestSection.css
        └── TestCard.jsx
```

## 📋 File Descriptions

### Main Component
- **FreeStudyMaterial.jsx** - Main page component that manages tabs and modals for:
  - Video Player Modal
  - Test Modal (with question navigation and scoring)
  - CTA Banner

### Sub-Components

#### StudyTabs Component
- **File**: `StudyTabs.jsx` / `StudyTabs.css`
- **Features**:
  - Tab navigation (Videos, Notes, Tests)
  - Active state indicator
  - Icon display
  - Responsive horizontal scrolling on mobile

#### VideoSection Component
- **File**: `VideoSection.jsx` / `VideoSection.css`
- **Features**:
  - Displays free video lectures in a grid
  - Subject filter
  - Video cards with thumbnail, title, teacher, duration
  - Play button to open video modal
  - Loading and error states
  - Responsive grid layout

#### NotesSection Component
- **File**: `NotesSection.jsx` / `NotesSection.css`
- **Features**:
  - Displays study notes and PDFs
  - Subject filter
  - Note cards with icon, description, tags
  - Download PDF functionality
  - Loading and error states

#### TestSection Component
- **File**: `TestSection.jsx` / `TestSection.css`
- **Features**:
  - Displays mock tests in a grid
  - Exam type filter
  - Test stats (questions count, duration, attempts)
  - Difficulty badge
  - Start test button
  - Loading and error states

## 🎨 CSS Features

### Main Styles (FreeStudyMaterial.css)
- Header with gradient background
- Modal overlays with animations
- Video player styling
- Test modal with progress bar
- Test navigation and question overview
- Result screen with score display
- CTA banner
- Responsive design for all screen sizes

### Component Styles
- **StudyTabs.css**: Tab buttons, active states, responsive icons
- **VideoSection.css**: Video grid, card hover effects, filters
- **NotesSection.css**: Note cards with border indicators, download buttons
- **TestSection.css**: Test cards with stats grid, difficulty badges

## 🎯 Key Features

✅ **Fully Responsive**
- Desktop (1200px+)
- Tablet (768px - 1024px)
- Mobile (480px - 768px)
- Extra Small (< 480px)

✅ **Accessibility**
- Proper color contrasts
- Focus states
- Semantic HTML
- ARIA labels where needed

✅ **Performance**
- GPU-accelerated animations
- Optimized grid layouts
- Smooth transitions

✅ **Deep Styling Customization**
- Color scheme using gradients (#667eea - #764ba2)
- Consistent spacing system
- Box shadows for depth
- Smooth transitions and animations

## 🔧 Customization Guide

### Update Color Scheme
Replace all instances of:
- `#667eea` (Primary Blue)
- `#764ba2` (Secondary Purple)

### Add New Filter Categories
Edit the filter arrays in each component:
```javascript
const subjects = ["all", ...new Set(videos.map((v) => v.subject))];
```

### Modify Card Grid
Adjust grid template columns in CSS:
```css
grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
```

### Customize Animations
Modify animation durations and easing in CSS:
```css
transition: all 0.3s ease;
```

## 📱 Responsive Breakpoints

- **1024px**: Tablet landscape
- **768px**: Tablet portrait / Mobile landscape
- **480px**: Mobile portrait

## 🔗 API Endpoints Used

- `GET /videos/free` - Fetch free videos
- `GET /materials/free` - Fetch free notes
- `GET /freetests` - Fetch free tests
- `POST /freetests/{id}/submit` - Submit test answers

## 💡 Notes

- All CSS files are modular and can be imported independently
- Each component is self-contained with its own styling
- Grid layouts use `auto-fill` for responsive columns
- Modal animations include fade-in and slide-up effects
- Hover effects include transform, shadow, and color changes
