import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import LoginIn from './src/Auth/loginIn';
import SignUp from './src/Auth/signUp';
import DashBoard from './src/dashBoard';
import ForgotPassword from './src/Auth/forgotPassword';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="LoginIn"
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: '#fff',
              ...(Platform.OS === 'android' && {
                // paddingTop: '15%', // Add padding for Android
              }),
              ...(Platform.OS === 'web' && {
                minHeight: '100vh',
                width: '100%',
                maxWidth: '100%',
                alignSelf: 'center',
                overflow: 'hidden'
              })
            }
          }}
        >
          <Stack.Screen name="Login" component={LoginIn} />
          <Stack.Screen name="SignUp" component={SignUp} />
          <Stack.Screen name="forgotPassword" component={ForgotPassword} />
          <Stack.Screen 
            name="Dashboard" 
            component={DashBoard}
            options={{
              gestureEnabled: false,
              headerLeft: null,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}