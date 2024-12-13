import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginIn from './src/Auth/loginIn';
import SignUp from './src/Auth/signUp';
import DashBoard from './src/dashBoard';
import ForgotPassword from './src/Auth/forgotPassword';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
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
  );
}