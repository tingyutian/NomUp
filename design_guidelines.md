# NomUp Design Guidelines

## Brand Identity

**Purpose**: NomUp helps users prevent food waste by tracking groceries, managing expiration dates, and simplifying shopping through AI-powered receipt scanning.

**Personality**: Warm, approachable, and refined. The app feels like a thoughtful kitchen companion - elegant enough to respect the user's time, friendly enough to reduce anxiety around food waste.

**Memorable Element**: The sophisticated serif typography paired with soft pastel category colors creates a unique "editorial grocery journal" aesthetic that stands apart from generic productivity apps.

## Color Palette

**Primary Palette:**
- Background Cream: `#F5F1E8`
- Primary Black Text: `#1A1A1A`
- Secondary Gray Text: `#6B6B6B`
- Divider/Border: `#E8E4DB`

**Category Accent Colors (Pastel):**
- Produce Green: `#C8E6C9` 
- Dairy Blue: `#BBDEFB`
- Bakery Yellow: `#FFF9C4`
- Meat/Protein Pink: `#F8BBD0`
- Pantry Beige: `#D7CCC8`

**Semantic Colors:**
- Expiring Soon Yellow: `#FFF176`
- Expiring Today Orange: `#FFB74D`
- Expired Red: `#EF5350`
- Success Green: `#66BB6A`
- Button Primary: `#1A1A1A` (black)

## Typography

**Font Stack:**
- **Headings/Branding**: Playfair Display (serif) - used for "NomUp" logo and major screen titles
- **Body/Interface**: Inter (sans-serif) - used for all interactive elements, body text, labels

**Type Scale:**
- Hero Title: 32pt, Playfair Display Bold
- Screen Title: 24pt, Playfair Display SemiBold
- Section Header: 18pt, Inter SemiBold
- Body Text: 16pt, Inter Regular
- Caption/Label: 14pt, Inter Regular
- Small Text: 12pt, Inter Regular

## Navigation Architecture

**Root Navigation**: Tab Navigator (4 tabs)
- Home (inventory icon)
- Add (+ floating action button in center)
- Shopping List (cart icon)
- Profile (user icon)

**Navigation Stacks:**
1. **Home Stack**: Dashboard → Item Detail → Edit Item
2. **Add Stack**: Scan Receipt → Confirm Items → Set Expiration → Success
3. **Shopping Stack**: Shopping List → Add Items Modal
4. **Profile Stack**: Profile → Settings → Notifications

## Screen Specifications

### Welcome Screen (Onboarding)
- **Header**: None
- **Layout**: Full-screen vertical stack, cream background
- **Content**: 
  - NomUp logo (Playfair Display, 40pt) centered at 30% from top
  - Tagline "Nom it up before it goes bad" (Inter Regular, 16pt) below logo
  - Illustration of groceries (vegetables, bread) in center
  - "Get Started" button at bottom (80% width, 56pt height, black background, white text, 12pt border radius)
- **Safe Area**: Top: insets.top + 60px, Bottom: insets.bottom + 40px

### Home Dashboard
- **Header**: Transparent, title "My Kitchen" (Playfair Display, 24pt), right button: Filter icon
- **Layout**: Scrollable vertical list
- **Content**:
  - "Expiring Soon" section (collapsible card with yellow/orange/red color coding)
  - Storage tabs: Fridge | Freezer | Pantry (horizontal scroll, sticky)
  - Grocery item cards with category color accent on left edge, item name, quantity, "Expires in Xd"
- **Safe Area**: Top: headerHeight + 16px, Bottom: tabBarHeight + 16px

### Scan Receipt Flow
- **Confirm Items Screen**:
  - Header: "Confirm Items" (Playfair Display, 24pt), left: Back, right: Skip
  - Scrollable list of detected items
  - Each item card: Product name, category label (small caps), price, "Expire in Xd", Edit button
  - Edit button opens modal with: Product Name field, +/- quantity controls, Expiration date picker
  - Bottom fixed: "Save All Items" button (full width, black)
- **Safe Area**: Top: 16px, Bottom: insets.bottom + 80px

### Consumption Logging
- **I Cooked Something Modal**:
  - Half-sheet modal with rounded top corners (24pt radius)
  - Two large buttons: "Take Photo" (camera icon), "Select Manually" (list icon)
- **Photo Confirmation Screen**:
  - Detected ingredients list with checkboxes
  - "Add missing items" button at top
  - Bottom: "Confirm & Track Usage" button
- **Usage Tracking Interface**:
  - Each item: Name, current quantity, slider (1/10 to 10/10 with visual marks)
  - Action buttons below slider: "Used All" | "Threw Away" | "Add to Shopping List"
  - Bottom: "Update Inventory" button

### Shopping List
- **Header**: "Shopping List" (Playfair Display)
- **Layout**: Scrollable list with sections: "Recently Used" and "Manual Items"
- **Content**: Item cards with checkbox, name, quantity, swipe-to-delete
- **Safe Area**: Bottom: tabBarHeight + 16px

## Visual Design System

**Cards**: White background, 16pt border radius, subtle shadow (offset: 0,2 / opacity: 0.08 / radius: 4)

**Buttons**:
- Primary: Black background, white text, 12pt radius, 56pt height
- Secondary: White background, black border (1pt), black text, 12pt radius, 48pt height
- Icon buttons: 44pt tap area, no background

**Forms**:
- Input fields: White background, 1pt border (#E8E4DB), 8pt radius, 48pt height
- Labels: Inter Regular 14pt, gray text, 8pt above field

**Category Badges**: Small caps text (12pt), respective pastel background, 6pt radius, 4pt padding

**Expiration Indicators**: Colored pill badges (yellow/orange/red) with "Xd" text

## Required Assets

**App Icons:**
- `icon.png` - NomUp logo with cream background (1024x1024) - Device home screen
- `splash-icon.png` - NomUp logo for launch screen (1024x1024) - App launch

**Illustrations:**
- `welcome-groceries.png` - Stylized vegetables and bread in warm colors - Welcome screen
- `empty-fridge.png` - Simple line art of empty fridge shelf - Empty Fridge tab
- `empty-freezer.png` - Simple line art of empty freezer - Empty Freezer tab  
- `empty-pantry.png` - Simple line art of empty pantry - Empty Pantry tab
- `empty-shopping-list.png` - Shopping cart with checkmark - Empty shopping list
- `success-scan.png` - Receipt with checkmark - Receipt scan success

**Icons**: Use Feather icon set from @expo/vector-icons for all UI icons (camera, plus, trash, edit, etc.)