import React, {useState, useRef} from 'react';
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
import auth from '@react-native-firebase/auth';
import {useToast} from 'react-native-toast-notifications';

import {useVoiceAuthentication} from '../hook/useVoiceAuthentication'; // Assuming this hook is correctly implemented for Azure API
import {Colors} from '../theme/Colors';
// import Navigation from '../navigation';

// const baseApi = 'https://centralindia.api.cognitive.microsoft.com'; // Replace with your Azure Cognitive Service endpoint
// const apiKey = '13fa42fd33bc4ea9b1f663aa6b7726aa'; // Replace with your Azure API Key

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

const LoginAudioScreen = ({navigation, route}) => {
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState('00:00:00');
  const [audioPath, setAudioPath] = useState(null);
  const [playback, setPlayback] = useState(false);
  const [currentMetering, setCurrentMetering] = useState(0);
  const [mode, setMode] = useState('enroll'); // Mode to decide between enroll/verify
  const [recordDuration, setRecordDuration] = useState(0); // Track the recording duration
  const [loading, setLoading] = useState(false);

  const toast = useToast();

  const recorderPlayer = useRef(new AudioRecorderPlayer()).current;

  const userData = JSON.parse(route?.params?.voiceData);

  const {
    verifyTextIndependentProfile,
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

    try {
      const directoryPath = `${RNFS.DocumentDirectoryPath}/recordings`;
      await RNFS.mkdir(directoryPath);
      const path = `${directoryPath}/recorded_audio.m4a`;

      console.log('==================path ============');
      console.log(path);
      console.log('====================================');

      // setAudioPath(path);

      await recorderPlayer.startRecorder(path);
      recorderPlayer.addRecordBackListener(e => {
        setRecordTime(recorderPlayer.mmssss(Math.floor(e.currentPosition)));
        setRecordDuration(Math.floor(e.currentPosition / 1000)); // Duration in seconds

        if (e.currentMetering) {
          setCurrentMetering(e.currentMetering);
        }

        // Auto-stop after 20 to 21 seconds
        if (Math.floor(e.currentPosition / 1000) >= 6) {
          stopRecording(path);
          // verifyProfile();
        }
      });

      setAudioPath(path);

      setRecording(true);
    } catch (error) {
      Alert.alert('Recording Error', 'Failed to start recording audio.');
      console.error('Start Recording Error:', error);
    }
  };

  const stopRecording = async path => {
    setRecording(false);
    await recorderPlayer.stopRecorder();
    recorderPlayer.removeRecordBackListener();
    setRecordTime('00:00:00');
    setCurrentMetering(0);

    console.log('===========recordDuration===========');
    console.log(recordDuration);
    console.log(recordTime);
    console.log(audioPath);
    console.log('====================================');

    // if (recordDuration < 5) {
    //   Alert.alert(
    //     'Recording Too Short',
    //     'Please record audio for at least 5 seconds to proceed.',
    //   );
    //   setRecordDuration(0); // Reset the duration
    //   return;
    // }

    // const directoryPath = `${RNFS.DocumentDirectoryPath}/recordings`;
    // const path = `${directoryPath}/recorded_audio.m4a`;

    if (path) {
      console.log('============== if ==========');
      console.log(audioPath);
      console.log(recordDuration);
      console.log('====================================');
      verifyProfile(path);
      // if (recordDuration < 5) {
      //   Alert.alert(
      //     'Recording Too Short',
      //     'Please record audio for at least 5 seconds to proceed.',
      //   );
      //   setRecordDuration(0); // Reset the duration
      //   return; // Exit early
      // } else {
      //   verifyProfile(path); // Automatically start verification after stopping the recording
      // }
    } else {
      Alert.alert('Recording Error', 'Failed to record the audio properly.');
    }
  };

  const verifyProfile = async path => {
    setRecordDuration(0);
    setLoading(true);
    console.log('Verification path, ', path);

    try {
      if (path) {
        const base64Audio = await RNFS.readFile(path, 'base64');

        console.log('==========userData========');
        console.log(userData);
        console.log(userData?.profileData?.profileId);
        console.log('====================================');

        if (userData) {
          const verificationResp = await verifyTextIndependentProfile(
            base64Audio,
            userData?.profileData?.profileId,
          );

          console.log(verificationResp);
          setLoading(false);

          if (verificationResp.success) {
            console.log(verificationResp.score);
            if (verificationResp?.score > 0.5) {
              showToast('Verification Success', 'success');
              SignIn();
            } else {
              // showToast('Verification Failed', 'danger');
              Alert.alert('Verification Failed', 'Voice input does not match.');
            }
          } else {
            console.log(verificationResp);
            Alert.alert('Verification Error', verificationResp?.message);
          }
        } else {
          setLoading(false);
          Alert.alert('Invalid Data', 'User data is not available.');
        }
      } else {
        setLoading(false);
        Alert.alert('No Audio Found', 'Please record audio for verification.');
      }
    } catch (error) {
      console.error('Verification Error:', error);
      setLoading(false);
      Alert.alert(
        'Verification Error',
        'An error occurred while verifying the audio.',
      );
    }
  };

  const SignIn = async () => {
    await auth()
      .signInWithEmailAndPassword(userData?.email, userData?.password)
      .then(() => {
        console.log('User account created & signed in!');
        navigation.replace('Home');
      })
      .catch(error => {
        if (error.code === 'auth/invalid-email') {
          Alert.alert('Invalid Email', 'The email address is not valid.');
        } else if (error.code === 'auth/invalid-credential') {
          Alert.alert('Invalid Credentials', 'Please check your credentials.');
        } else {
          Alert.alert('Sign In Error', 'An error occurred during sign-in.');
        }
        console.error(error);
      });
  };

  const startPlayback = async () => {
    console.log('=========== startPlayback ============');
    console.log(audioPath);
    console.log('====================================');
    console.log('===========recordDuration===========');
    console.log(recordDuration);
    console.log(recordTime);
    console.log('====================================');
    setPlayback(true);
    await recorderPlayer.startPlayer(audioPath);
    recorderPlayer.addPlayBackListener(e => {
      if (e.currentPosition === e.duration) {
        setPlayback(true);
        recorderPlayer.stopPlayer();
      }
    });
  };

  const stopPlayback = async () => {
    setPlayback(false);
    await recorderPlayer.stopPlayer();
    recorderPlayer.removePlayBackListener();
  };

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

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <FontAwesome5
            name={'arrow-alt-circle-left'}
            color={Colors.primary}
            size={30}
          />
        </TouchableOpacity>
      </View>

      <View style={{alignItems: 'center', marginTop: 30}}>
        <Text style={styles.headerText}>Welcome Back,</Text>
      </View>

      <View style={styles.middleContainer}>
        <Text style={styles.timer}>{recording ? recordTime : '00:00'}</Text>

        <AudioWaveform currentMetering={currentMetering} />

        {/* Show the loading indicator while verifying */}
        {/* {loading && (
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            style={{marginTop: 20}}
          />
        )} */}

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

        {/* <TouchableOpacity style={styles.VerifyBtn} onPress={verifyProfile}>
          <Text style={styles.VerifyBtnText}>Verify Profile</Text>
        </TouchableOpacity> */}

        {/* {audioPath && !recording && (
          <TouchableOpacity
            onPress={playback ? stopPlayback : startPlayback}
            style={styles.playButton}>
            <FontAwesome5
              name={playback ? 'pause' : 'play'}
              color={'white'}
              size={30}
            />
          </TouchableOpacity>
        )} */}
      </View>

      <View style={styles.infoContainer}>
        <Text style={[styles.descriptionText, {fontWeight: 'bold'}]}>
          Note:{' '}
        </Text>
        <Text style={styles.descriptionText}>
          Once you start recording, it will capture audio for 5 seconds before
          stopping.
        </Text>
        <Text style={styles.descriptionText}>
          Please speak clearly while recording the audio
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
  },
  headerText: {
    fontSize: 35,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  backButton: {
    padding: 10,
  },
  middleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timer: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.primary,
  },
  button: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ff6347',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 10,
    shadowColor: Colors.shadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 4,
    padding: 5,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  VerifyBtn: {
    width: '60%',
    height: 60,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  VerifyBtnText: {
    fontSize: 18,
    color: Colors.black,
    fontWeight: 'bold',
  },
  playButton: {
    backgroundColor: 'purple',
    padding: 10,
  },
  infoContainer: {
    // padding: 60,
    // backgroundColor: '#ffffff',
    borderRadius: 15,
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
  },
  descriptionText: {
    fontSize: 16,
    // color: Colors.gray,
    textAlign: 'center',
  },
});

export default LoginAudioScreen;
