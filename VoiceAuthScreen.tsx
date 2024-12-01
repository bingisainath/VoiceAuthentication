import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  Button,
  Text,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import useVoiceAuthentication from './src/hook/useVoiceAuthentication'; // Corrected import
import RNFS from 'react-native-fs';
import RNFetchBlob from 'rn-fetch-blob';

const VoiceAuthScreen = () => {
  const apiKey = '13fa42fd33bc4ea9b1f663aa6b7726aa'; // Replace with your actual API key
  const baseApi = 'https://centralindia.api.cognitive.microsoft.com'; // Replace with your actual base API URL

  // Initialize the hook with apiKey and baseApi
  const {
    error,
    isEnrolled,
    remainingEnrollmentsSpeechLength,
    createTextIndependentVerificationProfile,
    enrollTextIndependentProfileAudioForVerification,
  } = useVoiceAuthentication(apiKey, baseApi);

  const [base64Data, setBase64Data] = useState('');

  useEffect(() => {
    const readFileAsBase64 = async () => {
      try {
        let assetPath;
        let Base64fileData;

        if (Platform.OS === 'android') {
          // For Android, access the file in the assets folder
          // assetPath = RNFetchBlob.fs.asset('auth.wav');
          // assetPath = RNFetchBlob.fs.asset(require('./assets/auth.wav'));
          assetPath = 'auth.wav';
          Base64fileData = await RNFetchBlob.fs.readFile(RNFetchBlob.fs.asset(assetPath), 'base64');
        } else if (Platform.OS === 'ios') {
          // For iOS, access the file in the main bundle
          assetPath = `${RNFS.MainBundlePath}/auth.wav`;
          Base64fileData = await RNFS.readFile(assetPath, 'base64');
        } else {
          throw new Error('Unsupported platform');
        }

        if (!Base64fileData || Base64fileData.trim() === '') {
          console.error('Base64 data is empty or invalid.');
          Alert.alert(
            'Error',
            'Failed to read asset as base64. The data is empty or invalid.',
          );
          return;
        }

        if (Base64fileData) {
          setBase64Data(Base64fileData);
        } else {
          throw new Error('File data is empty');
        }

        // setBase64Data(base64Data);
      } catch (error) {
        console.error('Error reading file as base64:', error);
        Alert.alert('Error', 'An error occurred while reading the file.');
      }
    };

    readFileAsBase64();
  }, []);

  const handleCreateProfile = async () => {
    const id = await createTextIndependentVerificationProfile();
    
    if (id) {
      Alert.alert('Profile Created', `Profile ID: ${id}`);
    } else {
      Alert.alert('Error', 'Failed to create profile');
    }
  };

  const handleEnrollProfile = async () => {
    try {
      if (!base64Data) {
        Alert.alert('Error', 'No audio data available for enrollment.');
        return;
      }

      console.log('Base64 Audio Data for Enrollment:', base64Data); // Log the base64 data

      await enrollTextIndependentProfileAudioForVerification(base64Data);

      if (isEnrolled) {
        Alert.alert('Success', 'Voice successfully enrolled!');
      } else {
        Alert.alert(
          'Enrollment Incomplete',
          `Time remaining: ${remainingEnrollmentsSpeechLength}`,
        );
      }
    } catch (error) {
      console.error('Error during profile enrollment:', error);
      Alert.alert('Error', 'An error occurred during enrollment.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Button title="Create Profile" onPress={handleCreateProfile} />
      <Button title="Enroll Profile" onPress={handleEnrollProfile} />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginTop: 10,
  },
});

export default VoiceAuthScreen;
