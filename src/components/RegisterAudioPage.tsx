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
  const [profile, setProfile] = useState({});
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState('00:00');
  const [audioPath1, setAudioPath1] = useState(null);
  const [audioPath2, setAudioPath2] = useState(null);
  const [playback1, setPlayback1] = useState(false);
  const [playback2, setPlayback2] = useState(false);
  const [currentMetering, setCurrentMetering] = useState(0);
  const [mode, setMode] = useState('enroll'); // Mode to decide between enroll/verify
  const [recordDuration, setRecordDuration] = useState(0); // Track the recording duration
  const [attempts, setAttempts] = useState(0); // Track recording attempts

  const [loading, setLoading] = useState(false);

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
    const profileData = await AsyncStorage.getItem('voiceData');
    console.log('=========== profileData ===========');
    console.log(profileData);
    console.log('====================================');
    if (!profileData) {
      const profileResp = await createTextIndependentVerificationProfile();
      console.log('====================================');
      console.log(profileResp);
      console.log('====================================');
      if (profileResp?.success) {
        showToast('Profile created Successfully', 'success');
        setProfile(profileResp);
      } else {
        showToast('Error Occurred While creating profile', 'danger');
        navigation.navigate('Home');
      }
    } else {
      console.log('Profile Already Created');
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
      if (Math.floor(e.currentPosition / 1000) >= 23) {
        setAttempts(attempts + 1);
        stopRecording(path);
      }
    });

    // if (attempts == 0) {
    //   setAudioPath1(path);
    // } else {
    //   setAudioPath2(path);
    // }

    setRecording(true);
  };

  // const pauseRecording = async () => {
  //   await recorderPlayer.pauseRecorder();
  //   setRecording(false);
  // };

  // const resumeRecording = async () => {
  //   await recorderPlayer.resumeRecorder();
  //   setRecording(true);
  // };

  const [enrollResp, setEnrollResp] = useState(true);
  // const [enrollResp2, setEnrollResp2] = useState({});

  const stopRecording = async path => {
    setRecording(false);
    await recorderPlayer.stopRecorder();
    recorderPlayer.removeRecordBackListener();
    setRecordTime('00:00:00');
    setCurrentMetering(0);

    const base64Audio1 = await RNFS.readFile(path, 'base64');
    const data = await AsyncStorage.getItem('voiceData');
    const parsedData = JSON.parse(data);
    const enrollResp = await enrollTextIndependentProfileAudioForVerification(
      base64Audio1,
      parsedData?.profileData?.profileId,
    );

    console.log(enrollResp);

    if (enrollResp) {
      if (enrollResp?.success) {
        setEnrollResp(true);
      } else {
        setEnrollResp(false);
      }
    } else {
      setEnrollResp(false);
    }

    if (enrollResp?.success) {
      showToast(enrollResp?.message, 'success');
    } else {
      showToast(enrollResp?.message, 'danger');
    }

    // if (attempts == 0) {
    //   const base64Audio1 = await RNFS.readFile(path, 'base64');
    //   const data = await AsyncStorage.getItem('voiceData');
    //   const parsedData = JSON.parse(data);
    //   console.log('================= temp Data ===================');
    //   console.log(parsedData?.profileData);
    //   console.log('====================================');
    //   const enrollResp = await enrollTextIndependentProfileAudioForVerification(
    //     base64Audio1,
    //     parsedData?.profileData?.profileId,
    //   );
    //   setEnrollResp1(enrollResp);
    // } else {
    //   const base64Audio1 = await RNFS.readFile(audioPath1, 'base64');
    //   const data = await AsyncStorage.getItem('voiceData');
    //   const parsedData = JSON.parse(data);
    //   console.log('================= temp Data ===================');
    //   console.log(parsedData?.profileId);
    //   console.log('====================================');
    //   const enrollResp = await enrollTextIndependentProfileAudioForVerification(
    //     base64Audio1,
    //     parsedData?.profileId?.profileId,
    //   );
    //   setEnrollResp2(enrollResp);
    // }
  };

  // const createProfile = async () => {
  //   setLoading(true);
  //   const base64Audio1 = await RNFS.readFile(audioPath1, 'base64');
  //   const base64Audio2 = await RNFS.readFile(audioPath2, 'base64');
  //   const createProfileResp = await createTextIndependentVerificationProfile(
  //     base64Audio1,
  //     base64Audio2,
  //   );
  //   if (createProfileResp?.success) {
  //     setLoading(false);
  //     Alert.alert('Success', createProfileResp?.data);
  //   } else {
  //     setLoading(false);
  //     Alert.alert('Error', createProfileResp?.data);
  //   }
  // };

  // useEffect(() => {
  //   if (attempts >= 2) {
  //     showToast('Voice Enrollment Success', 'success');
  //     handleLogout();
  //   }
  // }, [attempts]);

  const handleLogout = async () => {
    const currentUser = auth().currentUser;
    if (currentUser) {
      try {
        await auth().signOut();
        dispatch(logout(true));
        navigation.replace('LoginForm');
      } catch (error) {
        console.error('Error signing out:', error);
      }
    } else {
      dispatch(logout(true));
      navigation.replace('LoginForm');
    }
  };

  const getProfileDataById = async () => {
    const data = await AsyncStorage.getItem('voiceData');
    if (data) {
      const parsedData = JSON.parse(data);
      console.log('================= temp Data ===================');
      console.log(parsedData?.profileId);
      console.log('====================================');
      const profileDataResp = await getProfileData(
        parsedData?.profileData?.profileId,
      );
      console.log('===========profileDataResp========');
      console.log(profileDataResp);
      console.log('====================================');
      if (profileDataResp?.success) {
        const asyncData = JSON.stringify({
          profileData: profileDataResp?.data,
          email: user.email,
          password: '123456',
        });
        await AsyncStorage.setItem('voiceData', asyncData);
      } else {
        console.log('Error Getting Profile Data');
      }
    }
  };

  useEffect(() => {
    console.log('================= 1 & 2 responses ===================');
    console.log(enrollResp);
    console.log('====================================');
    getProfileDataById();
    if (attempts >= 2 && enrollResp) {
      if (enrollResp) {
        showToast('Enrollment Success', 'success');
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
              text: 'Ok',
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

  const startPlayback = async (audioNo: Number) => {
    audioNo == 1 ? setPlayback1(true) : setPlayback2(true);
    await recorderPlayer.startPlayer(audioNo == 1 ? audioPath1 : audioPath2);
    recorderPlayer.addPlayBackListener(e => {
      if (e.currentPosition === e.duration) {
        audioNo == 1 ? setPlayback1(true) : setPlayback2(true);
        recorderPlayer.stopPlayer();
      }
    });
  };

  const stopPlayback = async audioNo => {
    audioNo == 1 ? setPlayback1(false) : setPlayback2(false);
    await recorderPlayer.stopPlayer();
    recorderPlayer.removePlayBackListener();
  };

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

  const [tempData, setTempData] = useState({});

  const loadVoiceData = async () => {
    const data = await AsyncStorage.getItem('voiceData');
    console.log('================ load voice data ====================');
    console.log(data);
    console.log('====================================');
    await setTempData(data);
  };

  useEffect(() => {
    loadVoiceData();
  }, []);

  // const handleCreateProfile = async () => {
  //   const profileResp = await createTextIndependentVerificationProfile();
  //   setTempData(profileResp);
  //   console.log('========== handleCreateProfile ===========');
  //   console.log(profileResp);
  //   console.log('====================================');
  // };

  const handleEnrollProfile = async () => {
    console.log('=========== tempData ==========');
    console.log(tempData?.data);
    console.log('====================================');

    const assetPath = 'girl_voice_2.mp3';
    const audioData = await RNFetchBlob.fs.readFile(
      RNFetchBlob.fs.asset(assetPath),
      'base64',
    );
    // const blob = Buffer.from(audioData, 'base64');

    const enrollResp = await enrollTextIndependentProfileAudioForVerification(
      audioData,
      tempData?.data?.profileId,
    );

    console.log('========== enrollResp ==========');
    console.log(enrollResp);
    console.log('====================================');
  };

  return (
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

      <Text style={styles.timer}>{recording ? recordTime : '00:00:00'}</Text>

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

      {/* <View style={{flexDirection: 'row'}}>
        <TouchableOpacity
          onPress={handleCreateProfile}
          style={{backgroundColor: 'green', padding: 10, marginRight: 10}}>
          <Text>Create Audio</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleEnrollProfile}
          style={{backgroundColor: 'blue', padding: 10, marginRight: 10}}>
          <Text>Enroll Audio</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={getProfileDataById}
          style={{backgroundColor: 'blue', padding: 10}}>
          <Text>get Voice Data</Text>
        </TouchableOpacity>
      </View> */}

      {/* <View
        style={{
          flexDirection: 'row',
          height: '10%',
          alignItems: 'center',
        }}>
        {audioPath1 && !recording && (
          <TouchableOpacity
            onPress={playback1 ? () => stopPlayback(1) : () => startPlayback(1)}
            style={styles.playButton}>
            <FontAwesome5
              name={playback1 ? 'pause' : 'play'}
              color={'black'}
              size={30}
            />
            <Text style={{color: 'red'}}> A1 </Text>
          </TouchableOpacity>
        )}
        {audioPath2 && !recording && (
          <TouchableOpacity
            onPress={playback2 ? () => stopPlayback(2) : () => startPlayback(2)}
            style={styles.playButton}>
            <FontAwesome5
              name={playback2 ? 'pause' : 'play'}
              color={'black'}
              size={30}
            />
            <Text style={{color: 'red'}}> A2 </Text>
          </TouchableOpacity>
        )}
      </View> */}

      {/* <TouchableOpacity
        onPress={enrollAudio}
        style={{backgroundColor: 'lightblue', padding: 10}}>
        <Text style={{color: '#152529', fontWeight: 'bold'}}>
          Enroll Audio Profile
        </Text>
      </TouchableOpacity> */}

      {/* <Text style={styles.infoText}>
        {mode === 'enroll'
          ? `Remaining Attempts : ${attempts}`
          : `Verification Result: ${verificationResult}`}
      </Text> */}
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

      <TouchableOpacity
        onPress={deleteVoiceProfile}
        style={styles.deleteAudioBtn}>
        <Text style={{color: Colors.white, fontWeight: 'bold'}}>
          Delete Audio Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
