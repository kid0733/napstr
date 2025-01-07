import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

// Initialize the Google Sign In configuration
GoogleSignin.configure({
  // Get this from your Firebase Console > Project Settings > General > Your apps > Android > Web client (auto created by Google Service)
  webClientId: '227082141491-cc43ejoot1jdtd6hqjs0hapifg4tiod5.apps.googleusercontent.com',
  ...Platform.select({
    ios: {
      iosClientId: '227082141491-cc43ejoot1jdtd6hqjs0hapifg4tiod5.apps.googleusercontent.com'
    },
    android: {}
  }),
  offlineAccess: true,
});

export const googleAuth = {
  async signIn() {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();
      return {
        userInfo,
        idToken: tokens.idToken,
        platform: Platform.OS
      };
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('User cancelled the login flow');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign in is in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Play services not available');
      } else {
        console.error('Google Sign-In Error:', error);
        throw new Error('Something went wrong');
      }
    }
  },

  async signOut() {
    try {
      await GoogleSignin.signOut();
      return true;
    } catch (error) {
      console.error('Google Sign-Out Error:', error);
      return false;
    }
  },

  async getCurrentUser() {
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      return currentUser;
    } catch (error) {
      console.error('Get Current User Error:', error);
      return null;
    }
  },

  async isSignedIn() {
    try {
      await GoogleSignin.signInSilently();
      return true;
    } catch (error) {
      console.error('Check Sign-In Status Error:', error);
      return false;
    }
  }
}; 