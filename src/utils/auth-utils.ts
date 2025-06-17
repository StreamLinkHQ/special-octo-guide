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

// Avatar options array - should match what's in your profile component
const avatarOptions = [
  "https://res.cloudinary.com/adaeze/image/upload/v1745406833/xgkbh9clm7lwcbb2rm0a.png",
  "https://res.cloudinary.com/adaeze/image/upload/v1745406532/oeqiov1ue5ylpythux6k.png",
  "https://res.cloudinary.com/adaeze/image/upload/v1745404837/vaq22f4hotztogwlnhzq.png",
  "https://res.cloudinary.com/adaeze/image/upload/v1745404827/qm3i1gdx1ub0bvntksiz.png",
  "https://res.cloudinary.com/adaeze/image/upload/v1745404819/zhcxy9szj249qxft2fla.png",
  "https://res.cloudinary.com/adaeze/image/upload/v1745404752/nfpwn5cy2tiklsmg9o5u.png",
  "https://res.cloudinary.com/adaeze/image/upload/v1745404752/nfpwn5cy2tiklsmg9o5u.png",
  "https://res.cloudinary.com/adaeze/image/upload/v1745404741/xio2cl8cj8em9cebtyyb.png",
  "https://res.cloudinary.com/adaeze/image/upload/v1745404621/wwouagdzhxne70kkgaxv.png",
  "https://res.cloudinary.com/adaeze/image/upload/v1745404606/dfzeavyyvmooxyys4knz.png",
  "https://res.cloudinary.com/adaeze/image/upload/v1746917882/ihmztupdw0mgu6ma7v9s.png",
];

// Export function to get avatar options
export const getAvatarOptions = () => avatarOptions;

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
      : avatarOptions[preferences.selectedAvatar] || avatarOptions[0]; // Use custom avatar
      
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
    avatar: avatarOptions[0], // Default to first avatar instead of null
    isUsingGoogleName: false,
    isUsingGoogleAvatar: false,
    hasCustomPreferences: false
  };
};