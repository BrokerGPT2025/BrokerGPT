# Tailwind UI Style Guide

## Colors

### Primary Colors
- Primary Blue: #38bdf8 (Tailwind logo color)
- Dark Text: #111827 (Nearly black)
- White: #FFFFFF
- Light Gray Background: #F9FAFB (Sidebar background)

### Accent Colors
- Success Green: #22c55e (Used for positive percentages)
- Error Red: #ef4444 (Used for negative percentages)

### Text Colors
- Primary Text: #111827
- Secondary Text: #6B7280
- Muted Text: #9CA3AF

## Typography

### Font Family
- Primary Font: Inter, system-ui, sans-serif

### Font Sizes
- Heading Large (Page title): 24px / 1.5rem
- Heading Medium (Section titles): 18px / 1.125rem
- Body Text: 14px / 0.875rem
- Small Text (Percentages): 12px / 0.75rem
- Table Headers: 14px / 0.875rem
- Navigation Items: 14px / 0.875rem

### Font Weights
- Bold: 700 (Headings, Numeric values like $2.6M)
- Medium: 500 (Section titles, navigation)
- Regular: 400 (Body text, table content)

## Spacing

### Margins and Padding
- Container Padding: 24px
- Section Spacing: 32px
- Element Spacing: 16px
- Table Row Padding: 12px
- Card Padding: 24px

## Borders and Shapes

### Border Radius
- Button Radius: 6px
- Card Radius: 8px
- Input/Dropdown Radius: 6px
- Pill/Badge Radius: 9999px (For percentage indicators)

### Border Widths
- Default Border: 1px
- Divider: 1px

### Border Colors
- Border Light: #E5E7EB
- Border Medium: #D1D5DB

## Shadows

### Box Shadows
- Card Shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)
- Dropdown Shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
- Modal Shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)

## Components

### Buttons
- Primary Button:
  - Background: #000000
  - Text: #FFFFFF
  - Padding: 8px 16px
  - Border Radius: 6px
  - Font Weight: Medium
  - Font Size: 14px

- Secondary Button/Link:
  - Text: #6B7280
  - Padding: 8px 16px
  - Border Radius: 6px
  - Font Weight: Medium
  - Font Size: 14px

### Navigation
- Active Item:
  - Background: Slightly darker gray (#F3F4F6)
  - Font Weight: Medium
- Icon Size: 20px
- Spacing between icon and text: 12px

### Cards
- Background: #FFFFFF
- Border Radius: 8px
- Padding: 24px
- Shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)

### Tables
- Header:
  - Font Weight: Medium
  - Text Color: #6B7280
  - Border Bottom: 1px solid #E5E7EB
  - Padding: 12px 16px
- Rows:
  - Border Bottom: 1px solid #E5E7EB
  - Padding: 12px 16px
  - Hover Background: #F9FAFB

### Badge/Pill (Percentage indicators)
- Positive:
  - Background: rgba(34, 197, 94, 0.1)
  - Text: #22c55e
  - Padding: 2px 8px
  - Border Radius: 9999px
- Negative:
  - Background: rgba(239, 68, 68, 0.1)
  - Text: #ef4444
  - Padding: 2px 8px
  - Border Radius: 9999px

### Dropdown/Select
- Background: #FFFFFF
- Border: 1px solid #D1D5DB
- Border Radius: 6px
- Padding: 8px 12px
- Dropdown Icon: Chevron down icon

### Avatar/User Images
- Border Radius: 9999px (circular)
- Size: 32px (standard), 24px (smaller)

## Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Adaptations
- Sidebar collapses to dropdown or hidden menu
- Tables become scrollable horizontally
- Cards stack vertically
- Font sizes may decrease slightly
