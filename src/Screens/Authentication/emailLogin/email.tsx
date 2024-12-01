import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {Colors} from '../../../theme/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EmailForm({navigation}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const SignIn = async () => {
    setLoading(true);
    navigation.navigate('PasswordForm', {email: email});
    setLoading(false);
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
          <View style={styles.inputView}>
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
