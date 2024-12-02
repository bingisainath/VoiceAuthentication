import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import Svg, {Path} from 'react-native-svg';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import {Buffer} from 'buffer';
import auth from '@react-native-firebase/auth';
import {useToast} from 'react-native-toast-notifications';
import RNFetchBlob from 'rn-fetch-blob';
import {useDispatch, useSelector} from 'react-redux';

import {useVoiceAuthentication} from '../hook/useVoiceAuthentication'; // Assuming this hook is correctly implemented for Azure API
import {Colors} from '../theme/Colors';
import {logout} from '../redux/userSlice';

const AudioWaveform = ({currentMetering}) => {
  const generateWaveformPath = level => {
    const height = 50;
    const scale = (level + 60) * 1.5;

    return `M0 ${height} Q 10 ${Math.random() * scale} 20 ${height} Q 30 ${
      Math.random() * scale
    } 40 ${height} Q 50 ${Math.random() * scale} 60 ${height} Q 70 ${
      Math.random() * scale
    } 80 ${height}`;
  };

  return (
    <Svg height="100" width="200" viewBox="0 0 100 100">
      <Path
        d={generateWaveformPath(currentMetering)}
        fill="none"
        stroke="red"
        strokeWidth="2"
      />
    </Svg>
  );
};

const RegisterAudioScreen = ({navigation}) => {
  // const [profile, setProfile] = useState({});
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState('00:00');
  // const [audioPath1, setAudioPath1] = useState(null);
  // const [audioPath2, setAudioPath2] = useState(null);
  // const [playback1, setPlayback1] = useState(false);
  // const [playback2, setPlayback2] = useState(false);
  const [currentMetering, setCurrentMetering] = useState(0);
  // const [mode, setMode] = useState('enroll'); // Mode to decide between enroll/verify
  const [recordDuration, setRecordDuration] = useState(0); // Track the recording duration
  const [attempts, setAttempts] = useState(0); // Track recording attempts
  const [voiceProfileId, setVoceProfileId] = useState('');

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  const dispatch = useDispatch();
  const toast = useToast();

  const recorderPlayer = useRef(new AudioRecorderPlayer()).current;

  const user = useSelector((state: any) => state.user);

  const {
    createTextIndependentVerificationProfile,
    enrollTextIndependentProfileAudioForVerification,
    remainingEnrollments,
    verificationResult,
    getProfileData,
  } = useVoiceAuthentication();

  const CreateAudioProfile = async () => {
    setPageLoading(true);
    if (!user?.email) {
      // throw new Error('Email is required');
      showToast('Error Occurred While creating profile', 'danger');
      setPageLoading(false);
      navigation.navigate('Home');
    }

    try {
      const userVoiceData = await firestore()
        .collection('users')
        .doc(user?.email)
        .get();

      if (userVoiceData?._data?.voiceRegisterOrNot) {
        console.log(
          'User Data:',
          userVoiceData?._data?.voiceProfileId?.profileId,
        );
        setVoceProfileId(userVoiceData?._data?.voiceProfileId?.profileId);
        setPageLoading(false);
      } else {
        const profileResp = await createTextIndependentVerificationProfile();

        setVoceProfileId(profileResp?.data?.profileId);

        if (profileResp?.success) {
          // Prepare the fields to update
          const updatedData = {
            voiceProfileId: profileResp.data, // Update voiceProfileId if provided
            voiceRegisterOrNot: true, // Update the boolean flag
          };

          // Update user data in Firestore
          await firestore()
            .collection('users')
            .doc(user?.email) // Using email as the document ID
            .update(updatedData);

          showToast('Profile created Successfully', 'success');
          setPageLoading(false);
        } else {
          showToast('Error Occurred While creating profile', 'danger');
          setPageLoading(false);
          navigation.navigate('Home');
        }
      }
    } catch (error) {
      setPageLoading(false);
      console.error('Error saving user data:', error);
    }
  };

  useEffect(() => {
    CreateAudioProfile();
  }, []);

  const showToast = (message: string, type: string) => {
    toast.show(message, {
      type: type, //'normal | success | warning | danger | custom'
      placement: 'top',
      duration: 4000,
      offset: 30,
      // animationType: 'slide-in',
      animationType: 'zoom-in',
    });
  };

  const requestAudioPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Audio Permission',
            message: 'App needs access to your microphone to record audio.',
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

  const startRecording = async () => {
    const permissionGranted = await requestAudioPermission();
    if (!permissionGranted) {
      Alert.alert(
        'Permission Denied',
        'Audio recording permission is required',
      );
      return;
    }

    if (attempts > 2) {
      Alert.alert(
        'Max Attempts Reached',
        'You have completed all attempts. Please try again later.',
      );
      return;
    }

    const directoryPath = `${RNFS.DocumentDirectoryPath}/recordings`;
    await RNFS.mkdir(directoryPath);
    const path = `${directoryPath}/recorded_audio_${attempts}.m4a`;

    await recorderPlayer.startRecorder(path);
    recorderPlayer.addRecordBackListener(e => {
      setRecordTime(recorderPlayer.mmssss(Math.floor(e.currentPosition)));
      setRecordDuration(Math.floor(e.currentPosition / 1000)); // Duration in seconds

      if (e.currentMetering) {
        setCurrentMetering(e.currentMetering);
      }

      // Auto-stop after 20 to 21 seconds
      if (Math.floor(e.currentPosition / 1000) >= 21) {
        const resp = stopRecording(path);
      }
    });

    setRecording(true);
  };

  const [enrollResp, setEnrollResp] = useState(true);

  const stopRecording = async path => {
    setRecording(false);
    await recorderPlayer.stopRecorder();
    recorderPlayer.removeRecordBackListener();
    setRecordTime('00:00:00');
    setCurrentMetering(0);

    const base64Audio1 = await RNFS.readFile(path, 'base64');
    // const data = await AsyncStorage.getItem('voiceData');
    // const parsedData = JSON.parse(data);
    setPageLoading(true);
    const enrollResp = await enrollTextIndependentProfileAudioForVerification(
      base64Audio1,
      voiceProfileId,
    );

    console.log('========== enrollResp====== =');
    console.log(enrollResp);
    console.log('====================================');
    

    if (enrollResp) {
      setPageLoading(false);
      if (enrollResp?.success) {
        setEnrollResp(true);
        setAttempts(attempts + 1);
        showToast(enrollResp?.message, 'success');
        return true;
      } else {
        setEnrollResp(false);
        showToast(enrollResp?.message, 'danger');
        return false;
      }
    } else {
      setPageLoading(false);
      setEnrollResp(false);
      showToast(enrollResp?.message, 'danger');
      return false;
    }

    // if (enrollResp?.success) {
    //   showToast(enrollResp?.message, 'success');
    //   return true;
    // } else {
    //   showToast(enrollResp?.message, 'danger');
    //   return false;
    // }
  };

  const handleLogout = async () => {
    const currentUser = auth().currentUser;
    if (currentUser) {
      try {
        await auth().signOut();
        dispatch(logout(true));
        navigation.replace('EmailForm');
      } catch (error) {
        console.error('Error signing out:', error);
      }
    } else {
      dispatch(logout(true));
      navigation.replace('EmailForm');
    }
  };

  useEffect(() => {
    if (attempts >= 2 && enrollResp) {
      if (enrollResp) {
        // showToast('Enrollment Success', 'success');
        Alert.alert(
          'Message',
          'Successfully Enrolled Your Voice',
          [
            {
              text: 'Cancel',
              onPress: () => console.log('Cancel Pressed'),
              style: 'cancel',
            },
            {
              text: 'logout',
              onPress: () => handleLogout(),
            },
          ],
          {cancelable: true},
        );
      } else {
        showToast('Error while enrolling audio', 'danger');
        Alert.alert(
          'Error',
          'Error while Enrolling the Voice.Please Try Again.',
          [
            {
              text: 'Cancel',
              onPress: () => console.log('Cancel Pressed'),
              style: 'cancel',
            },
            {
              text: 'Enroll Again',
            },
          ],
          {cancelable: true},
        );
      }
    }
  }, [enrollResp, attempts]);

  const deleteVoiceProfile = async () => {
    try {
      await AsyncStorage.removeItem('voiceData');
      Alert.alert(
        'Profile Deletion',
        'Your voice profile has been successfully deleted from storage.',
      );
    } catch (error) {
      console.error('Error deleting user profile:', error);
    }
  };

  return (
    <View style={styles.outerContainer}>
      {pageLoading ? (
        <View style={styles.container}>
          <ActivityIndicator size={65} color={'#80cde0'}></ActivityIndicator>
          <Text style={{color: '#80cde0', margin: 10, fontSize: 15}}>
            Loading ...
          </Text>
        </View>
      ) : (
        <View style={styles.container}>
          <TouchableOpacity
            style={{position: 'absolute', top: 20, left: 20}}
            onPress={() => {
              navigation.goBack();
            }}>
            <FontAwesome5
              name={'arrow-alt-circle-left'}
              color={Colors.primary}
              size={30}
            />
          </TouchableOpacity>

          <View style={{marginBottom: 40, alignItems: 'center'}}>
            <Text
              style={{
                fontSize: 25,
                color: Colors.primary,
                fontWeight: 'bold',
                marginBottom: 10,
              }}>
              Attempt
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text
                style={{
                  fontSize: 40,
                  color: Colors.primary,
                  fontWeight: 'bold',
                  marginRight: 10,
                }}>
                {attempts} of 2
              </Text>
            </View>
          </View>

          <Text style={styles.timer}>
            {recording ? recordTime : '00:00:00'}
          </Text>

          <AudioWaveform currentMetering={currentMetering} />

          {/* <TouchableOpacity
        onPress={recording ? stopRecording : startRecording}
        style={styles.button}>
        <Text style={styles.buttonText}>{recording ? 'pause' : 'Record'}</Text>
      </TouchableOpacity> */}

          {loading ? (
            <View style={styles.button}>
              <ActivityIndicator size="large" color={Colors.white} />
            </View>
          ) : (
            <TouchableOpacity
              onPress={recording ? stopRecording : startRecording}
              style={styles.button}>
              {recording ? (
                <Text style={styles.buttonText}>Stop</Text>
              ) : (
                <View style={{justifyContent: 'center', alignItems: 'center'}}>
                  <Text style={styles.buttonText}>Record</Text>
                  <Text style={styles.buttonText}>&</Text>
                  <Text style={styles.buttonText}>Verify</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          <View
            style={{
              bottom: 70,
              position: 'absolute',
              flexDirection: 'row',
              paddingHorizontal: 20,
            }}>
            <Text style={[styles.descriptionText, {fontWeight: 'bold'}]}>
              Note :
            </Text>
            <Text style={styles.descriptionText}>
              Please speak clearly while recording the audio
            </Text>
          </View>
        </View>
      )}

      {/* <TouchableOpacity
        onPress={deleteVoiceProfile}
        style={styles.deleteAudioBtn}>
        <Text style={{color: Colors.white, fontWeight: 'bold'}}>
          Delete Audio Profile
        </Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 20, // Added padding for better layout
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.white,
    marginHorizontal: 5,
    marginBottom: 60,
    textAlign: 'center',
  },
  timer: {
    fontSize: 36, // Increased font size for better readability
    fontWeight: 'bold',
    color: Colors.white, // Changed text color for better contrast
    marginBottom: 20,
  },
  button: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary, // Used primary color for consistency
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  buttonText: {
    color: Colors.background,
    fontSize: 18, // Increased font size for button text
    fontWeight: 'bold',
    textAlign: 'center',
  },
  playButton: {
    backgroundColor: Colors.primary,
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-evenly', // Adjusted alignment for better spacing
  },
  infoText: {
    marginTop: 20,
    fontSize: 16,
    color: Colors.white,
  },
  VerifyBtn: {
    backgroundColor: Colors.secondary,
    width: '60%',
    alignItems: 'center',
    padding: 15,
    borderRadius: 20,
    elevation: 8,
    shadowColor: Colors.black,
    marginTop: 25,
  },
  VerifyBtnText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 18,
  },
  deleteAudioBtn: {
    backgroundColor: Colors.error,
    padding: 15,
    borderRadius: 10,
    position: 'absolute',
    bottom: 50,
    elevation: 5,
  },
});

export default RegisterAudioScreen;
