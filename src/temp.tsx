import React, {useState} from 'react';
import {
  Button,
  Text,
  View,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import 'react-native-gesture-handler';
// import android.os.Bundle;
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import {NavigationContainer} from '@react-navigation/native';

import {useVoiceAuthentication} from './src/hook/useVoiceAuthentication';
// import AudioRecordScreen from './src/components/AudioPage';
// import SignInScreen from './src/Screens/Authentication/Login';
// import Navigation from './src/navigation';

// const baseApi = 'https://centralindia.api.cognitive.microsoft.com'; // Replace with your Azure Cognitive Service endpoint
// const apiKey = '13fa42fd33bc4ea9b1f663aa6b7726aa'; // Replace with your Azure API Key

const App = () => {
  // const [verificationProfile, setVerificationProfile] = useState(null);
  // const [remainingEnrollments, setRemainingEnrollments] = useState(3);
  const [audioRecorderPlayer] = useState(new AudioRecorderPlayer());

  const {
    createTextIndependentVerificationProfile,
    verifyTextIndependentProfile,
    verificationProfile,
    remainingEnrollments,
    verificationResult,
  } = useVoiceAuthentication();

  const requestAudioPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Audio Permission',
            message: 'App needs access to your microphone to record audio.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Error requesting permission:', err);
        Alert.alert('Permission Error', 'Failed to get audio permission');
        return false;
      }
    } else {
      return true;
    }
  };

  const startRecording = async (durationInSeconds, callback) => {
    const permissionGranted = await requestAudioPermission();
    if (!permissionGranted) {
      Alert.alert(
        'Permission Denied',
        'Audio recording permission is required',
      );
      return;
    }

    try {
      const audioPath = `${RNFS.DocumentDirectoryPath}/test-audio.m4a`;
      await audioRecorderPlayer.startRecorder(audioPath);

      console.log('Recording started for ' + durationInSeconds + ' seconds...');
      setTimeout(async () => {
        try {
          const result = await audioRecorderPlayer.stopRecorder();
          console.log('Recording stopped');
          callback(result);
        } catch (err) {
          console.error('Error stopping recording:', err);
          Alert.alert('Recording Error', 'Failed to stop the recording');
        }
      }, durationInSeconds * 1000);
    } catch (err) {
      console.error('Recording error:', err);
      Alert.alert('Recording Error', 'Failed to start recording');
    }
  };

  const handleEnrollment = () => {
    startRecording(6, createTextIndependentVerificationProfile);
  };

  const handleVerification = () => {
    startRecording(4, verifyTextIndependentProfile);
  };

  return (
    <View style={{justifyContent: 'center', alignItems: 'center', padding: 20}}>
      <TouchableOpacity
        onPress={handleEnrollment}
        style={{
          backgroundColor: 'purple',
          padding: 10,
          margin: 10,
        }}>
        <Text style={{color: 'black'}}>
          Enroll New Text Independent Profile
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleVerification}
        style={{
          backgroundColor: 'lightblue',
          padding: 10,
          margin: 10,
        }}>
        <Text style={{color: 'black'}}>Verify Text Independent Profile</Text>
      </TouchableOpacity>
      <Text style={{padding: 10, margin: 10, alignSelf: 'center'}}>
        {`Remaining Enrollments: ${remainingEnrollments}`}
      </Text>
    </View>
  );
};

export default App;
