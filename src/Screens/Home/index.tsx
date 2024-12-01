
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import {useDispatch} from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import FontIcon from 'react-native-vector-icons/FontAwesome6';
import {useToast} from 'react-native-toast-notifications';

import {Colors} from '../../theme/Colors';
import {setUser, logout} from '../../redux/userSlice';

const Home = ({navigation}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isUserRegistered, setIsUserRegistered] = useState(false);

  console.log('===========  userData  ============');
  console.log(userData);
  console.log('====================================');

  const dispatch = useDispatch();
  const toast = useToast();

  const showToast = (message: string, type: string) => {
    toast.show(message, {
      type: type, //'normal | success | warning | danger | custom'
      placement: 'bottom',
      duration: 4000,
      offset: 30,
      // animationType: 'slide-in',
      animationType: 'zoom-in',
    });
  };

  const getVoiceData = async () => {
    const userDoc = await firestore()
      .collection('users')
      .doc(userData?.email) // Document ID
      .get();

    // Check if the Voice Profile exists
    if (userDoc?.voiceRegisterOrNot) {
      setIsUserRegistered(true);
    } else {
      console.log('No user data found!');
    }
  };

  const registerAudio = async () => {
    const VoiceData = await AsyncStorage.getItem('voiceData');
    if (VoiceData) {
      Alert.alert(
        'Warning',
        'You already have a voice profile registered. Do you want to update it?',
        [
          {
            text: 'Cancel',
            onPress: () => console.log('Cancel Pressed'),
            style: 'cancel',
          },
          {
            text: 'Yes, Update',
            onPress: () => navigation.navigate('RegisterAudioScreen'),
          },
        ],
        {cancelable: true},
      );
    } else {
      navigation.navigate('RegisterAudioScreen');
    }
  };

  const handleUserRegistered = async () => {
    const userData = await AsyncStorage.getItem('voiceData');
    if (userData) {
      setIsUserRegistered(true);
    }
  };

  useEffect(() => {
    setLoading(true);
    const currentUser = auth().currentUser;
    if (currentUser) {
      try {
        const unsubscribe = auth().onAuthStateChanged(user => {
          setLoading(false);
          if (user?.email) {
            dispatch(setUser(user));
            setUserData(user);
            setIsAuthenticated(true);
            handleUserRegistered();
          } else {
            setUserData(null);
            dispatch(setUser(null));
            setIsAuthenticated(false);
            navigation.replace('EmailForm');
          }
        });
        return () => unsubscribe();
      } catch (e) {
        console.log('Unable to get user');
        setUserData(null);
        dispatch(setUser(null));
        setIsAuthenticated(false);
        navigation.replace('EmailForm');
      }
    } else {
      setUserData(null);
      dispatch(setUser(null));
      setIsAuthenticated(false);
      navigation.replace('EmailForm');
    }
  }, []);

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

  return (
    <View style={styles.backgroundContainer}>
      {loading ? (
        <ActivityIndicator size={'large'} color={Colors.primary} />
      ) : (
        <View style={styles.overlay}>
          {/* Top Section: Welcome Text */}
          <View style={styles.topSection}>
            <Text style={styles.welcomeHeader}>
              Welcome to Voice Authentication
            </Text>
            <Text style={styles.headerText}>
              Secure your account with voice recognition technology.
            </Text>
            {/* <TouchableOpacity
              onPress={handleGetData}
              style={{backgroundColor: 'red', padding: 10}}>
              <Text>get Voice Data</Text>
            </TouchableOpacity> */}
          </View>

          {!isUserRegistered ? (
            <>
              {/* Middle Section: Registration Prompt */}
              <View style={styles.registrationPrompt}>
                <FontIcon
                  name="microphone-lines"
                  size={95}
                  color={Colors.background}
                />
                <Text style={styles.registrationText}>
                  You haven't registered your voice yet. Please register your
                  voice profile to enable authentication.
                </Text>
              </View>
              <View style={styles.buttonSection}>
                <TouchableOpacity
                  onPress={registerAudio}
                  style={styles.registerAudioBtn}>
                  <Icon
                    name="microphone"
                    size={30}
                    color="#FFFFFF"
                    style={styles.iconStyle}
                  />
                  <Text style={styles.buttonText}>Register Your Voice</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleLogout}
                  style={styles.logoutBtn}>
                  <Icon
                    name="logout"
                    size={25}
                    color="#FFFFFF"
                    style={styles.iconStyle}
                  />
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
              {/* Bottom Section: Note */}
              <View style={styles.bottomSection}>
                <Text style={styles.infoText}>
                  Note: Registering your voice will enable voice-based login and
                  security features.
                </Text>
              </View>
            </>
          ) : (
            <>
              {/* Middle Section: Registered User Information */}
              <View style={styles.registeredInfo}>
                <Text style={styles.registrationText}>
                  You have successfully registered your voice profile.
                </Text>
              </View>
              <View style={styles.buttonSection}>
                <TouchableOpacity
                  onPress={registerAudio}
                  style={styles.registerAudioBtn}>
                  <Icon
                    name="microphone"
                    size={30}
                    color="#FFFFFF"
                    style={styles.iconStyle}
                  />
                  <Text style={styles.buttonText}>Update Voice Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleLogout}
                  style={styles.logoutBtn}>
                  <Icon
                    name="logout"
                    size={25}
                    color="#FFFFFF"
                    style={styles.iconStyle}
                  />
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  overlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  topSection: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  welcomeHeader: {
    fontSize: 35,
    color: Colors.primary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerText: {
    fontSize: 16,
    color: '#A9A9A9',
    marginVertical: 10,
    textAlign: 'center',
  },
  registrationPrompt: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  registrationText: {
    fontSize: 17,
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 15,
    marginHorizontal: 30,
  },
  buttonSection: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  registerAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E88E5',
    paddingHorizontal: 30,
    paddingVertical: 15,
    margin: 10,
    borderRadius: 30,
    elevation: 15,
    shadowColor: '#1E88E5',
  },
  iconStyle: {
    marginRight: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5252',
    paddingHorizontal: 30,
    paddingVertical: 15,
    margin: 10,
    borderRadius: 30,
    elevation: 5,
    shadowColor: 'red',
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  registeredInfo: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  bottomSection: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 30,
  },
  infoText: {
    fontSize: 14,
    color: '#A9A9A9',
    padding: 10,
    textAlign: 'center',
  },
});
