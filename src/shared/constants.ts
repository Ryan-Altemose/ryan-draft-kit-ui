// API Configuration
export const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// React Query Keys
export const QUERY_KEYS = {
  PLAYERS: 'players',
  PLAYER: 'player',
  RANKINGS: 'rankings',
  DRAFT: 'draft',
  TEAM: 'team',
  LEAGUES: 'leagues',
  LEAGUE: 'league',
  NOTEBOOKS: 'notebooks',
  NOTEBOOK: 'notebook',
  CURRENT_USER_PROFILE: 'current-user-profile',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// Breakpoints (matches Tailwind defaults)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  DRAFT_STATE: 'draft_state',
  EXTERNAL_USER_ID: 'draftkit.externalUserId',
  USER_ID: 'draftkit.userId',
  USER_NAME: 'draftkit.userName',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  PLAYERS: '/players',
  RANKINGS: '/rankings',
  DRAFT: '/draft',
  MY_TEAM: '/my-team',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  NOT_FOUND: 'Resource not found.',
  UNAUTHORIZED: 'User session expired. Reloading user session.',
  FORBIDDEN: 'Access denied.',
  USER_BOOTSTRAP: 'Unable to initialize user session.',
} as const;
