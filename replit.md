# NomUp - Replit Agent Guidelines

## Overview

NomUp is a mobile-first grocery management app that helps users prevent food waste. The app tracks groceries, manages expiration dates, and simplifies shopping through AI-powered receipt scanning. Built with React Native (Expo) for the frontend and Express.js for the backend, the app features a distinctive "editorial grocery journal" aesthetic with serif typography and pastel category colors.

Core features:
- **Receipt Scanning**: AI-powered grocery receipt analysis using Gemini with automatic duplicate detection (merges items with same name, combines quantities)
- **Pantry Management**: Track groceries across fridge, freezer, and pantry locations with sort options (Expiration, Category, Recent)
- **Expiration Tracking**: Visual alerts for items expiring soon
- **Shopping Lists**: Manage shopping lists with Instacart integration
- **Consumption Logging**: Track food usage directly from item detail modals
- **Swipe-to-Delete**: Swipe left on any item to reveal delete button with confirmation
- **Item Detail Modal**: Tap items to view details, log consumption, edit, or add to shopping list

**Data Structure Notes**:
- GroceryItem includes `unitAmount` field for numeric measurements (e.g., 0.5 for "0.5 lb", 24 for "24 oz")
- Item display shows simplified format: "0.5 lb" for single items, "2 x 0.5 lb" only when quantity > 1
- Price tracking is stored in data but currently hidden from UI

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
- `client/context/` - React Context providers (AppContext for groceries and shopping list state)
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
- **expo-web-browser**: Instacart integration opens in-app browser

### Key npm packages
- `@tanstack/react-query`: Server state management
- `react-native-reanimated`: Animations
- `react-native-gesture-handler`: Touch handling
- `@react-native-async-storage/async-storage`: Local persistence