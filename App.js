import { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View } from 'react-native';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/firebase';
import 'react-native-gesture-handler';
import LoginIn from './src/Auth/loginIn';
import SignUp from './src/Auth/signUp';
import DashBoard from './src/Dashboard/dashBoard';
import ForgotPassword from './src/Auth/forgotPassword';
import AddTransaction from './src/Dashboard/AddTransaction';
import ProfileScreen from './src/Dashboard/ProfileScreen';
import TrackDebt from './src/Dashboard/TrackDebt';
import Logout from './src/Auth/logOut';
import Navbar from './src/components/Navbar';  // Fix the import path

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Create TabNavigator for authenticated screens
const TabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={props => <Navbar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="DashBoard" component={DashBoard} />
      <Tab.Screen name="AddTransaction" component={AddTransaction} />
      <Tab.Screen name="TrackDebt" component={TrackDebt} />
      <Tab.Screen name="ProfileScreen" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return null; // Or a loading screen component
  }

  return (
    <PaperProvider theme={MD3LightTheme}>
      <SafeAreaProvider>
        <NavigationContainer independent={true}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'none', // Disable animations for smoother transitions
              contentStyle: {
                backgroundColor: '#fff',
                ...(Platform.OS === 'android' && {}),
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
            {!isAuthenticated ? (
              // Non-authenticated stack
              <>
                <Stack.Screen 
                  name="Login" 
                  component={LoginIn}
                  options={{ animationEnabled: false }}
                />
                <Stack.Screen name="SignUp" component={SignUp} />
                <Stack.Screen name="forgotPassword" component={ForgotPassword} />
              </>
            ) : (
              // Authenticated stack - now using TabNavigator
              <Stack.Screen 
                name="AuthenticatedRoot" 
                component={TabNavigator}
                options={{ animationEnabled: false }}
              />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}