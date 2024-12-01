import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  Pressable,
  SafeAreaView,
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
import {Colors} from '../../theme/Colors';

export default function SignUpForm({navigation}) {
  const [click, setClick] = useState(false);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // const SignUp = async () => {
  //   await auth()
  //     .createUserWithEmailAndPassword(email, password)
  //     .then(() => {
  //       console.log('User account created & signed in!');
  //       navigation.replace('Home');
  //     })
  //     .catch(error => {
  //       if (error.code === 'auth/email-already-in-use') {
  //         console.log('That email address is already in use!');
  //       }

  //       if (error.code === 'auth/invalid-email') {
  //         console.log('That email address is invalid!');
  //       }

  //       console.error(error);
  //       navigation.replace('LoginForm');
  //     });
  // };

  const SignUp = async () => {
    setLoading(true);
    try {
      // Create user with email and password
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );

      // console.log(" userCredential : ",userCredential);
      

      // Get user ID
      const userId = userCredential.user.uid;

      // console.log(" userCredential : ",userId);

      // Store user data in Firestore
      await firestore()
        .collection('Users') // Firestore collection name
        .doc(userId) // Document with userId as identifier
        .set({
          email: email,
          userName: userName,
          createdAt: firestore.FieldValue.serverTimestamp(), // Add server timestamp
          voiceProfileIds: [],
        });

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
    <SafeAreaView style={styles.container}>
      {/* <Image source={logo} style={styles.image} resizeMode="contain" /> */}
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
        {/* <TouchableOpacity style={styles.button} onPress={SignUp}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity> */}
      </View>

      {/* <Text style={styles.footerText}>
        <Text style={styles.signup}> login</Text>
      </Text> */}

      <TouchableOpacity
        style={styles.footerText}
        onPress={() => {
          navigation.navigate('LoginForm');
        }}>
        <Text style={{color: 'gray', fontSize: 13}}>Old user?{'   '}</Text>
        <Text style={styles.signup}>Login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 30,
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
    // textAlign: 'center',
    position: 'absolute',
    flexDirection: 'row',
    // color: 'gray',
    marginTop: 10,
    bottom: 40,
  },
  signup: {
    color: '#80cde0',
    fontSize: 13,
  },
});
