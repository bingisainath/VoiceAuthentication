import React, {useState} from 'react';
import {Provider} from 'react-redux';
import 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import {ToastProvider} from 'react-native-toast-notifications';

import Navigation from './src/navigation';
import {store} from './src/redux/store';

const App = () => {
  return (
    <Provider store={store}>
      <ToastProvider>
        <NavigationContainer>
          <Navigation />
        </NavigationContainer>
      </ToastProvider>
    </Provider>
  );
};

export default App;
