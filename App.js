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
          initialRouteName="Login"
          screenOptions={{
            headerShown: Platform.OS === 'web' ? false : true,
            contentStyle: {
              backgroundColor: '#fff',
              flex: 1
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
              headerShown: false,
              gestureEnabled: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}