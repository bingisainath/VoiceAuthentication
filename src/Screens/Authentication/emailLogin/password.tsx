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

import {Colors} from '../../../theme/Colors';
import {setVoiceData} from '../../../redux/userSlice';

export default function PasswordForm({navigation, route}) {
  const [click, setClick] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileExists, setProfileExits] = useState(false);

  const dispatch = useDispatch();

  const getVoiceData = async () => {
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
    setLoading(true);
    await auth()
      .signInWithEmailAndPassword(route?.params?.email, password)
      .then(() => {
        console.log('User account created & signed in!');
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
      const voiceData = await AsyncStorage.getItem('voiceData');

      if (voiceData) {
        navigation.navigate('LoginAudioScreen', {voiceData: voiceData});
      } else {
        // Show alert if no voice data is found in AsyncStorage
        Alert.alert('No Voice Data', 'No voice profile data found.');
      }
    } catch (error) {
      console.error('Error handling login with voice:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      // behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={60}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <SafeAreaView style={styles.container}>
          {/* <Image source={logo} style={styles.image} resizeMode="contain" /> */}
          <Text style={styles.title}>Login</Text>
          <View style={styles.emailContainer}>
            <Text style={styles.emailText}>sai@gmail.com</Text>
          </View>
          <View style={styles.inputView}>
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
            <View style={styles.switch}>
              <Switch
                value={click}
                onValueChange={setClick}
                trackColor={{true: 'green', false: 'gray'}}
              />
              <Text style={styles.rememberText}>Remember Me</Text>
            </View>
            <View>
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
    paddingTop: 70,
    backgroundColor: '#152529',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingVertical: 40,
    color: '#80cde0',
    marginBottom: 20,
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
    gap: 25,
    width: '100%',
    paddingHorizontal: 40,
    marginBottom: 5,
  },
  input: {
    height: 50,
    paddingHorizontal: 20,
    borderColor: '#80cde0',
    borderWidth: 1,
    borderRadius: 7,
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
  forgetText: {
    fontSize: 11,
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
