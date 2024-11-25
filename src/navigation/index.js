import LoginForm from '../Screens/Authentication/Login';
import SignUpForm from '../Screens/Authentication/SignUp';
import RegisterAudioScreen from '../components/RegisterAudioPage';
import Home from '../Screens/Home';
import LoginAudioScreen from '../components/LoginAudioPage';

import {createStackNavigator} from '@react-navigation/stack';

const Stack = createStackNavigator();

function Navigation() {
  return (
    <Stack.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName="Home">
      <Stack.Screen name="LoginForm" component={LoginForm} />
      <Stack.Screen name="SignUpForm" component={SignUpForm} />
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="RegisterAudioScreen" component={RegisterAudioScreen} />
      <Stack.Screen name="LoginAudioScreen" component={LoginAudioScreen} />
    </Stack.Navigator>
  );
}

export default Navigation;
