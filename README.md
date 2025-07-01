# Happy Thoughts

A full-featured React app that allows users to create accounts, post their happy thoughts with automatic tagging, like posts, and manage their content. Features user authentication, thought editing, tag filtering, and a responsive design.

# Live Site

https://creative-hotteok-2e5655.netlify.app/

[![Netlify Status](https://api.netlify.com/api/v1/badges/8131bd8a-605d-4338-89f7-97ca5fcc0cc4/deploy-status)](https://app.netlify.com/sites/creative-hotteok-2e5655/deploys)

## Features

- 🔐 **User Authentication** - Sign up, login, and secure JWT-based sessions
- ✨ **Automatic Tag Generation** - AI-powered content analysis assigns relevant tags
- 📝 **Thought Management** - Create, edit, and delete your own thoughts
- 💖 **Social Interactions** - Like system with optimistic UI updates
- 🏷️ **Tag Filtering** - Filter thoughts by categories like programming, food, emotions
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🎨 **Theme Support** - Dynamic theming based on thought tags
- 📄 **Pagination** - Efficient loading with infinite scroll and pagination
- 🔍 **User Profiles** - View your own thoughts and liked content
- 🎯 **Real-time Updates** - Optimistic UI with server synchronization

## High-level Architecture

### Core Components

1. **App.jsx**  
   • Root component with routing (React Router)  
   • Wraps app in UserContext and ThoughtsContext providers  
   • Handles authentication state and protected routes  
   • Manages global notification system

2. **Contexts**

   - **UserContext.jsx** - Authentication state, login/logout, user profile management
   - **ThoughtsContext.jsx** - Global thought state, CRUD operations, pagination

3. **Pages & Components**
   - **LoginSignup.jsx** - Authentication forms with validation
   - **ThoughtForm.jsx** - Create new thoughts with tag suggestions
   - **ThoughtsList.jsx** - Main feed with filtering and pagination
   - **UserThoughts.jsx** - User's personal thought management
   - **LikedThoughts.jsx** - Thoughts user has liked
   - **UpdateModal.jsx** - Edit existing thoughts

### Custom Hooks

4. **useThoughts.js**  
   • Manages thought state with full CRUD operations  
   • Handles pagination, filtering, and search  
   • Provides optimistic UI updates  
   • Integrates with ThoughtsContext for global state

5. **useLikeSystem.js**  
   • Individual thought like management  
   • Optimistic UI updates for hearts  
   • Persistent like state in localStorage  
   • API synchronization

6. **useThoughtAuthorization.js**  
   • Determines user permissions for thought actions  
   • Handles edit/delete authorization  
   • Manages anonymous vs authenticated user actions

### API Layer

7. **api.js**  
   • Centralized API client with retry logic  
   • JWT token management and automatic header injection  
   • Endpoints for:
   - Authentication: `login()`, `signup()`, `refreshToken()`
   - Thoughts: `getThoughts()`, `postThought()`, `updateThought()`, `deleteThought()`
   - Social: `likeThought()`
   - Filtering: `getThoughtsByTag()`, `searchThoughts()`
     • Error handling and network resilience

## Authentication Flow

1. User visits app → UserContext checks for stored JWT
2. If token exists → validate and decode user info
3. If no token → redirect to login/signup
4. On login → store JWT in localStorage, update context
5. All API calls automatically include Authorization header
6. Token refresh handled automatically on expiration

## Thought Management Flow

1. **Create**: User types → form validation → API call → optimistic UI → server sync
2. **Read**: Fetch with pagination → cache in context → render with themes
3. **Update**: Edit modal → validation → API call → local state update → server sync
4. **Delete**: Confirmation → optimistic removal → API call → cleanup
5. **Like**: Click heart → optimistic update → API call → persist state

## Tag System

- **Automatic Tagging**: Content analysis assigns relevant categories
- **Theme Integration**: Tags determine visual themes for thoughts
- **Filtering**: Users can filter thoughts by specific tags
- **Categories**: programming, emotions, work, home, food, health, weather, travel, entertainment, learning

## State Management

- **Global State**: React Context for user auth and thoughts
- **Local State**: Component-level state for forms and UI
- **Persistent State**: localStorage for user preferences and like history
- **Optimistic Updates**: Immediate UI feedback with server reconciliation

## Error Handling

- **Network Errors**: Automatic retry with exponential backoff
- **Authentication Errors**: Automatic logout and redirect
- **Validation Errors**: Real-time form feedback
- **API Errors**: User-friendly notifications with retry options

## Performance Optimizations

- **Pagination**: Server-side pagination with infinite scroll
- **Caching**: Context-based caching of thoughts and user data
- **Debouncing**: Search and filter inputs debounced
- **Lazy Loading**: Code splitting for routes and components
- **Optimistic UI**: Immediate feedback before server confirmation

## API Integration

**Base URLs:**

- Development: Configured via REACT_APP_API_BASE_URL in .env
- Production: https://happy-thoughts-api-yn3p.onrender.com

**Key Endpoints:**

- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `GET /thoughts` - Paginated thoughts list
- `POST /thoughts` - Create new thought
- `PUT /thoughts/:id` - Update thought
- `DELETE /thoughts/:id` - Delete thought
- `POST /thoughts/:id/like` - Like/unlike thought
- `GET /thoughts/tag/:tag` - Filter by tag

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Environment Variables

```bash
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_ENABLE_MOCK_API=false
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── pages/              # Route components
├── api/                # API client and utilities
├── utils/              # Helper functions
├── styles/             # Global styles and themes
└── main.jsx           # Application entry point
```

This architecture provides a scalable, maintainable codebase with clear separation of concerns, robust error handling, and excellent user experience through optimistic updates and real-time synchronization.
