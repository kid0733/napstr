import { googleAuth } from './googleAuth';
import { userService } from './api/userService';

export const useGoogleAuthSession = () => {
  const signIn = async () => {
    try {
      const { idToken, platform } = await googleAuth.signIn();
      
      // Login or register with our backend
      const authResponse = await userService.loginWithGoogle({
        idToken,
        platform
      });

      return authResponse;
    } catch (error) {
      console.error('Error during Google sign in:', error);
      throw error;
    }
  };

  return {
    signIn
  };
}; 