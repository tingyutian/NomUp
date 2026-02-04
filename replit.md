# NomUp - Replit Agent Guidelines

## Overview

NomUp is a mobile-first grocery management app that helps users prevent food waste. The app tracks groceries, manages expiration dates, and simplifies shopping through AI-powered receipt scanning. Built with React Native (Expo) for the frontend and Express.js for the backend, the app features a distinctive "editorial grocery journal" aesthetic with serif typography and pastel category colors.

Core features:
- **Receipt Scanning**: AI-powered grocery receipt analysis using Gemini with automatic duplicate detection (merges items with same name, combines quantities)
- **Pantry Management**: Track groceries across fridge, freezer, and pantry locations with sort options (Expiration, Category, Recent)
- **Expiration Tracking**: Visual alerts for items expiring soon
- **Shopping Lists**: Manage shopping lists
- **Consumption Logging**: Track food usage directly from item detail modals
- **Swipe-to-Delete**: Swipe left on any item to reveal delete button with confirmation
- **Item Detail Modal**: Tap items to view details, log consumption, edit, find recipes, or add to shopping list
- **Recipe Discovery**: Recipe suggestions based on pantry items, accessible via book icon in ItemDetailModal. Uses TheMealDB API for recipes with optimized local fuzzy matching for ingredient scoring (no AI call for matching). Shows match percentage, "You Have" and "Need to Buy" sections, with ability to add missing ingredients to shopping list. Performance optimized: ingredient lookup table for 70+ common items, 5 recipe limit, under 1 second load times. Flow: ItemDetailModal (book icon) → RecipeFeedScreen → RecipeDetailScreen → CookingModeScreen → CookingCompleteScreen
- **Cooking Mode**: Full-screen step-by-step cooking instructions with swipeable navigation, progress dots, and metadata badges (duration, temperature). Accessed via "Start Cooking" button on RecipeDetailScreen. Parses TheMealDB text instructions into structured steps
- **Cooking Complete**: After finishing cooking, users can log ingredient usage to update pantry quantities. Uses navigation.reset() to clear the cooking stack and return to pantry
- **Push Notifications**: Expiring item notifications using expo-notifications (no in-app banner). Permission requested after first item added to pantry. Notifications scheduled for items expiring within 5 days

**Data Structure Notes**:
- GroceryItem includes `unitAmount` field for numeric measurements (e.g., 0.5 for "0.5 lb", 24 for "24 oz")
- Item display shows simplified format: "0.5 lb" for single items, "2 x 0.5 lb" only when quantity > 1
- Price tracking is stored in data but currently hidden from UI
- ShoppingListItem IDs use unique format: `${timestamp}-${index}-${random}` to prevent duplicates in batch additions

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation v7 with native stack and bottom tabs
- **State Management**: React Context (AppContext) for global state, TanStack React Query for server state
- **Animations**: React Native Reanimated for smooth micro-interactions
- **Styling**: StyleSheet-based with a centralized theme system in `client/constants/theme.ts`

**Directory Structure**:
- `client/screens/` - Screen components (PantryScreen is the main screen, ShoppingListScreen, ConsumptionScreen, etc.)
- `client/components/` - Reusable components organized by atomic design (atoms, molecules, organisms)
- `client/navigation/` - Navigation stack definitions (MainTabNavigator has Pantry, Add, List tabs)
- `client/context/` - React Context providers (AppContext for groceries and shopping list state, includes `addMultipleToShoppingList` for batch additions)
- `client/hooks/` - Custom hooks for theming, screen options

**Key Components**:
- `SwipeableGroceryItem` - Grocery item card with swipe-to-delete gesture, simplified unit display
- `ItemDetailModal` - Full-featured modal for viewing, editing, and managing items
- `EditItemModal` - Edit modal with separate Category and Storage Location dropdown selectors
- `DeleteConfirmModal` - Confirmation dialog for item deletion
- `ConfirmationBanner` - Auto-dismissing success banner for actions like "Added to shopping list"

**Design System**: The app uses a warm, sophisticated palette with cream backgrounds (#F5F1E8), category-specific pastel colors, and Playfair Display for headings paired with Inter for body text.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI Integration**: Google Gemini via Replit AI Integrations for receipt scanning

**Key Endpoints**:
- `POST /api/scan-receipt` - Analyzes receipt images and extracts grocery items
- `GET /api/recipes/by-ingredient/:itemName` - Fetches recipes using TheMealDB with local fuzzy matching for ingredient scoring (uses lookup table for 70+ common ingredients, Gemini fallback when no results). Returns 5 recipes with match percentage, matched/missing ingredients. Query param `pantry` contains user's pantry items
- Chat and image generation routes available through `server/replit_integrations/`

**Database Schema**: Located in `shared/schema.ts`, currently includes users table. The schema uses Drizzle ORM with Zod validation via `drizzle-zod`.

### Data Persistence
- **Server-side**: PostgreSQL database (configured via DATABASE_URL)
- **Client-side**: AsyncStorage for local grocery data, shopping lists, and onboarding state

### Build & Development
- Development: `npm run expo:dev` (mobile) + `npm run server:dev` (API)
- Database migrations: `npm run db:push` via Drizzle Kit
- Path aliases: `@/` maps to `client/`, `@shared/` maps to `shared/`

## External Dependencies

### AI Services
- **Google Gemini**: Receipt image analysis via Replit AI Integrations
  - Environment variables: `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`
  - Models used: `gemini-2.5-flash` for text, `gemini-2.5-flash-image` for image generation

### Database
- **PostgreSQL**: Primary data store
  - Connection: `DATABASE_URL` environment variable
  - ORM: Drizzle with schema in `shared/schema.ts`

### Mobile/Expo APIs
- **expo-camera**: Receipt photo capture
- **expo-image-picker**: Gallery selection
- **expo-haptics**: Tactile feedback
- **expo-web-browser**: Opens external links in-app browser
- **expo-notifications**: Push notifications for expiring items (mobile only, not supported on web)

### Key npm packages
- `@tanstack/react-query`: Server state management
- `react-native-reanimated`: Animations
- `react-native-gesture-handler`: Touch handling
- `@react-native-async-storage/async-storage`: Local persistence