import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {useToast} from 'react-native-toast-notifications';

import {Colors} from '../../../theme/Colors';

export default function EmailForm({navigation}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const toast = useToast();

  const validateEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Standard email regex
    return emailRegex.test(email);
  };

  const SignIn = async () => {
    if (!validateEmail(email)) {
      showToast('Please enter a valid email address', 'danger');
      return;
    }
    setLoading(true);
    navigation.navigate('PasswordForm', {email: email});
    setLoading(false);
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
          <View style={styles.inputView}>
            <FontAwesome5
              name={'user-alt'}
              size={25}
              color={'#80cde0'}
              style={styles.userIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="EMAIL"
              value={email}
              onChangeText={setEmail}
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
              <TouchableOpacity style={styles.button} onPress={SignIn}>
                <Text style={styles.buttonText}>Continue</Text>
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
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 50,
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
  button: {
    backgroundColor: '#80cde0',
    height: 45,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  buttonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonView: {
    width: '100%',
    paddingHorizontal: 50,
    marginBottom: 100,
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
