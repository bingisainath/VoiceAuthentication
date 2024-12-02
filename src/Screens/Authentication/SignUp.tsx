import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {Colors} from '../../theme/Colors';
import {encryptPassword} from '../../helpers/helperFunctions';
import { checkInternet } from '../../helpers/checkInternet';
import { useToast } from 'react-native-toast-notifications';

export default function SignUpForm({navigation}) {
  const [click, setClick] = useState(false);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const toast = useToast();

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

  const SignUp = async () => {

    const isConnected = await checkInternet();
    if (!isConnected) {
      showToast('Please Connect to internet!', 'danger');
      navigation.navigate('EmailForm');
      return;
    }

    setLoading(true);
    try {
      // Create user with email and password
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );

      // Get user ID
      const userId = userCredential.user.uid;

      const encryptedPass = await encryptPassword(password); // encrypting the password

      // Prepare user data
      const userData = {
        userId: userId,
        email: email,
        password: encryptedPass.message, // Storing encrypted password in fireStore
        username: userName,
        createdAt: firestore.FieldValue.serverTimestamp(), // Automatically set server time
        voiceProfileId: null, // Optional, can be null initially
        voiceRegisterOrNot: false, // Default to false if not provided
      };

      // Save user data in Firestore
      await firestore()
        .collection('users') // 'users' is the collection name
        .doc(email) // Using email as the document ID
        .set(userData);

      console.log('User account created and data saved in Firestore!');
      setLoading(false);
      // Navigate to Home page after registration
      navigation.replace('Home');
    } catch (error) {
      setLoading(false);
      console.error('Error during sign-up:', error);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('That email address is already in use!');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('That email address is invalid!');
      } else {
        Alert.alert('Error during sign-up. Try again.');
      }
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      // behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <SafeAreaView style={styles.container}>
          <Image
            source={require('../../assets/images/logo2.png')}
            style={styles.image}
            resizeMode="contain"
          />
          <Text style={styles.title}>Register</Text>
          <View style={styles.inputView}>
            <TextInput
              style={styles.input}
              placeholder="USERNAME"
              value={userName}
              onChangeText={setUserName}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="EMAIL"
              value={email}
              onChangeText={setEmail}
              autoCorrect={false}
              autoCapitalize="none"
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

          <View style={styles.buttonView}>
            {loading ? (
              <View style={styles.button}>
                <ActivityIndicator size={25} color={Colors.black} />
              </View>
            ) : (
              <TouchableOpacity style={styles.button} onPress={SignUp}>
                <Text style={styles.buttonText}>REGISTER</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.footerText}
            onPress={() => {
              navigation.navigate('EmailForm');
            }}>
            <Text style={{color: 'gray', fontSize: 13}}>Old user?{'   '}</Text>
            <Text style={styles.login}>Login</Text>
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
  image: {
    alignSelf: 'center',
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
    marginTop: 20,
    marginBottom: 70,
  },
  optionsText: {
    textAlign: 'center',
    paddingVertical: 10,
    color: 'gray',
    fontSize: 13,
    marginBottom: 6,
  },
  mediaIcons: {
    // flexDirection: 'row',
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
    flexDirection: 'row',
    marginTop: 10,
    bottom: 40,
  },
  login: {
    color: '#80cde0',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
