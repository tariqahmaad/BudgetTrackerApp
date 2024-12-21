import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import 'react-native-gesture-handler';
import LoginIn from './src/Auth/loginIn';
import SignUp from './src/Auth/signUp';
import DashBoard from './src/Dashboard/dashBoard';
import ForgotPassword from './src/Auth/forgotPassword';
import AddTransaction from './src/Dashboard/AddTransaction';
import ProfileScreen from './src/Dashboard/ProfileScreen';
import TrackDebt from './src/Dashboard/TrackDebt';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <PaperProvider theme={MD3LightTheme}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
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
            <Stack.Screen name="AddTransaction" component={AddTransaction} />
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
            <Stack.Screen name="TrackDebt" component={TrackDebt} />
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
    </PaperProvider>
  );
}