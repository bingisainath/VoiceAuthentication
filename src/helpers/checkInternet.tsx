import NetInfo from '@react-native-community/netinfo';

/**
 * Helper function to check internet connectivity.
 * @returns {Promise<boolean>} - Returns true if connected, otherwise false.
 */
export const checkInternet = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected;
  } catch (error) {
    console.error('Error checking internet connectivity:', error);
    return false;
  }
};
