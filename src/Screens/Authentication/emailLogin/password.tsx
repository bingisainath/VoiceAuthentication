import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  KeyboardAvoidingView,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch} from 'react-redux';
import {useToast} from 'react-native-toast-notifications';

import {Colors} from '../../../theme/Colors';
import {setUser, setVoiceData} from '../../../redux/userSlice';
import {checkInternet} from '../../../helpers/checkInternet';

export default function PasswordForm({navigation, route}) {
  const [click, setClick] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileExists, setProfileExits] = useState(false);

  const dispatch = useDispatch();
  const toast = useToast();

  const getVoiceData = async () => {
    const isConnected = await checkInternet();
    console.log('====================================');
    console.log("checking con", isConnected);
    console.log('====================================');
    if (!isConnected) {
      showToast('Please Connect to internet!', 'danger');
      navigation.navigate('EmailForm');
      return;
    }

    const userDoc = await firestore()
      .collection('users')
      .doc(route?.params?.email) // Document ID
      .get();

    // Check if the Voice Profile exists
    if (userDoc?._data.voiceRegisterOrNot) {
      setProfileExits(true);
      dispatch(setVoiceData(userDoc?._data));
    } else {
      console.log('No user data found!');
    }
  };

  useEffect(() => {
    getVoiceData();
  }, []);

  const SignIn = async () => {
    const isConnected = await checkInternet();
    if (!isConnected) {
      showToast('Please Connect to internet!', 'danger');
      navigation.navigate('EmailForm');
      return;
    }

    if (password == '') {
      showToast('Please enter a valid password', 'danger');
      return;
    }
    setLoading(true);
    await auth()
      .signInWithEmailAndPassword(route?.params?.email, password)
      .then(() => {
        console.log('User signed in successfully!');
        dispatch(setUser(route?.params?.email));
        setLoading(false);
        navigation.replace('Home');
      })
      .catch(error => {
        setLoading(false);
        if (error.code === 'auth/invalid-email') {
          console.log('That email address is invalid!');
        }
        if (error.code === 'auth/invalid-credential') {
          console.log('That email address is invalid!');
          Alert.alert('Invalid Credentials');
        }
        console.error(error);
      });

    setLoading(false);
  };

  const handleLoginWithVoice = async () => {
    try {
      // Fetch the voiceData from AsyncStorage
      // const voiceData = await AsyncStorage.getItem('voiceData');

      if (profileExists) {
        navigation.navigate('LoginAudioScreen');
      } else {
        // Show alert if no voice data is found in AsyncStorage
        Alert.alert('No Voice Data', 'No voice profile data found.');
      }
    } catch (error) {
      console.error('Error handling login with voice:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
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
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      // behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={60}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <SafeAreaView style={styles.container}>
          <Image
            source={require('../../../assets/images/logo2.png')}
            style={styles.image}
            resizeMode="contain"
          />
          <Text style={styles.title}>Login</Text>
          <View style={styles.emailContainer}>
            <Text style={styles.emailText}>{route?.params?.email}</Text>
          </View>
          <View style={styles.inputView}>
            <FontAwesome5
              name={'lock'}
              size={25}
              color={'#80cde0'}
              style={styles.userIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="PASSWORD"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.rememberView}>
            {/* <View style={styles.switch}>
              <Switch
                value={click}
                onValueChange={setClick}
                trackColor={{true: 'green', false: 'gray'}}
              />
              <Text style={styles.rememberText}>Remember Me</Text>
            </View> */}
            <View style={styles.forgetView}>
              <Pressable onPress={() => Alert.alert('Forget Password!')}>
                <Text style={styles.forgetText}>Forgot Password?</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.buttonView}>
            {loading ? (
              <View style={styles.button}>
                <ActivityIndicator size={25} color={Colors.black} />
              </View>
            ) : (
              <TouchableOpacity style={styles.button} onPress={SignIn}>
                <Text style={styles.buttonText}>LOGIN</Text>
              </TouchableOpacity>
            )}
            {profileExists && (
              <Text style={styles.optionsText}>OR LOGIN WITH</Text>
            )}
          </View>
          <View style={styles.mediaIcons}>
            {!profileExists ? (
              <View
                style={{
                  width: '80%',
                }}>
                <Text
                  style={[
                    styles.optionsText,
                    {textAlign: 'center', fontSize: 15},
                  ]}>
                  Please create Voice profile to activate Voice authentication
                </Text>
                <Text
                  style={{textAlign: 'center', fontSize: 13, color: 'gray'}}>
                  Note : You can create profile in Home screen
                </Text>
              </View>
            ) : (
              <TouchableOpacity onPress={handleLoginWithVoice}>
                <FontAwesome5 name="microphone" color={'#80cde0'} size={35} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.footerText}
            onPress={() => {
              navigation.navigate('SignUpForm');
            }}>
            <Text style={{color: 'gray', fontSize: 14}}>
              Don't Have Account?{'   '}
            </Text>
            <Text style={styles.signup}>Sign Up</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50,
    backgroundColor: '#152529',
  },
  image: {
    width: 200, // Adjust width as needed
    height: 200, // Adjust height as needed
    resizeMode: 'contain',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingVertical: 40,
    color: '#80cde0',
    // marginBottom: 10,
  },
  emailContainer: {
    margin: 10,
    marginBottom: 30,
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#80cde0',
  },
  inputView: {
    width: '80%',
    paddingHorizontal: 10,
    borderColor: '#80cde0',
    borderWidth: 1,
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    // paddingVertical: 5,
  },
  userIcon: {
    padding: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 10,
    color: '#fff',
  },
  rememberView: {
    width: '100%',
    paddingHorizontal: 50,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 20,
    marginTop: 10,
  },
  switch: {
    flexDirection: 'row',
    gap: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rememberText: {
    fontSize: 13,
  },
  forgetView: {
    marginLeft: '65%',
  },
  forgetText: {
    fontSize: 12,
    color: '#80cde0',
  },
  button: {
    backgroundColor: '#80cde0',
    height: 45,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonView: {
    width: '100%',
    paddingHorizontal: 50,
  },
  optionsText: {
    textAlign: 'center',
    paddingVertical: 10,
    color: 'gray',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 10,
  },
  mediaIcons: {
    gap: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 23,
  },
  icons: {
    width: 40,
    height: 40,
  },
  footerText: {
    position: 'absolute',
    bottom: 40,
    color: 'gray',
    flexDirection: 'row',
  },
  signup: {
    color: '#80cde0',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
