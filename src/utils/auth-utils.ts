import type { GoogleCredentials, UserPreferences, DisplayCredentials } from '../types';
import { STORAGE_KEYS } from '../types';

// Helper functions for localStorage operations
export const saveGoogleCredentials = (credentials: Omit<GoogleCredentials, 'savedAt'>) => {
  try {
    const credentialsWithTimestamp: GoogleCredentials = {
      ...credentials,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.GOOGLE_CREDENTIALS, JSON.stringify(credentialsWithTimestamp));
    console.log('Google credentials saved to localStorage');
  } catch (error) {
    console.error('Failed to save Google credentials:', error);
  }
};

export const getGoogleCredentials = (): GoogleCredentials | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.GOOGLE_CREDENTIALS);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to retrieve Google credentials:', error);
    return null;
  }
};

export const getUserPreferences = (): UserPreferences | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to retrieve user preferences:', error);
    return null;
  }
};

export const saveUserPreferences = (preferences: UserPreferences) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    console.log('User preferences saved to localStorage:', preferences);
  } catch (error) {
    console.error('Error saving preferences to localStorage:', error);
  }
};

// Main function to get display credentials with proper priority
export const getDisplayCredentials = (): DisplayCredentials => {
  const preferences = getUserPreferences();
  const googleCreds = getGoogleCredentials();
  
  // If user has custom preferences, respect their choices
  if (preferences) {
    const displayName = preferences.useGoogleName 
      ? googleCreds?.name || preferences.username || 'User'
      : preferences.username || googleCreds?.name || 'User';
      
    const displayAvatar = preferences.useGoogleAvatar
      ? googleCreds?.picture || null
      : null; // Will fall back to custom avatar selection
      
    return {
      name: displayName,
      avatar: displayAvatar,
      isUsingGoogleName: preferences.useGoogleName,
      isUsingGoogleAvatar: preferences.useGoogleAvatar,
      hasCustomPreferences: true
    };
  }
  
  // Fallback to Google credentials if no custom preferences
  if (googleCreds) {
    return {
      name: googleCreds.name,
      avatar: googleCreds.picture,
      isUsingGoogleName: true,
      isUsingGoogleAvatar: true,
      hasCustomPreferences: false
    };
  }
  
  // Ultimate fallback
  return {
    name: 'User',
    avatar: null,
    isUsingGoogleName: false,
    isUsingGoogleAvatar: false,
    hasCustomPreferences: false
  };
};