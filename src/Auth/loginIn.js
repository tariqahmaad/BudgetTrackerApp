import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    Text,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Image,
    Animated,
    Dimensions,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const emailIcon = Platform.OS === 'web'
    ? require('../../assets/images/emailIcon.png')
    : require('../../assets/images/emailIcon.png');
const passwordIcon = Platform.OS === 'web'
    ? require('../../assets/images/passwordIcon.png')
    : require('../../assets/images/passwordIcon.png');
const googleIcon = Platform.OS === 'web'
    ? require('../../assets/images/googleIcon.png')
    : require('../../assets/images/googleIcon.png');
const facebookIcon = Platform.OS === 'web'
    ? require('../../assets/images/facebookIcon.png')
    : require('../../assets/images/facebookIcon.png');

export default function LoginIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [emailError, setEmailError] = useState('');
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const navigation = useNavigation();

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500, // Changed from 1000 to 500
            useNativeDriver: true
        }).start();
    }, []);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailError('Please enter a valid email address');
            return false;
        }
        setEmailError('');
        return true;
    };

    const handleLogin = async () => {
        // First, check if email and password are provided
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        // Then, validate the email format
        if (!validateEmail(email)) return;

        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (user) {
                // Store user credentials if remember me is checked
                if (rememberMe) {
                    await AsyncStorage.setItem('userEmail', email);
                } else {
                    await AsyncStorage.removeItem('userEmail');
                }

                // Clear any existing errors
                setEmailError('');

                // Reset fields
                setEmail('');
                setPassword('');

                // Navigate to Dashboard
                navigation.replace('Dashboard'); // Using replace instead of navigate
            } else {
                Alert.alert('Error', 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage;

            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email format';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No account exists with this email';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your internet connection';
                    break;
                default:
                    errorMessage = 'Login failed. Please try again.';
            }

            Alert.alert('Login Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        navigation.navigate('forgotPassword');
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={[
                    styles.keyboardView,
                    Platform.OS === 'web' && {
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }
                ]}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        Platform.OS === 'web' && {
                            flex: 1,
                            justifyContent: 'center'
                        }
                    ]}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View
                        style={[styles.container, { opacity: fadeAnim }]}
                        removeClippedSubviews={false}
                    >
                        {/* Logo section - uncomment when you have the logo
                        <Image
                            source={require('../../assets/images/logo.png')}
                            style={styles.logo}
                        /> 
                        */}
                        <Text style={styles.title}>Welcome Back!</Text>
                        <Text style={styles.subtitle}>Please sign in to continue</Text>

                        <View style={styles.formWrapper}>
                            <View style={styles.inputContainer}>
                                <Image source={emailIcon} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, emailError && styles.inputError]}
                                    placeholder="Email"
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        if (emailError) validateEmail(text); // Revalidate on change if there was an error
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    onBlur={() => validateEmail(email)} // Validate when focus leaves the field
                                />
                            </View>
                            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                            <View style={styles.inputContainer}>
                                <Image source={passwordIcon} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            <View style={styles.rememberMeContainer}>
                                <TouchableOpacity
                                    style={styles.checkbox}
                                    onPress={() => setRememberMe(!rememberMe)}
                                >
                                    <Text>{rememberMe ? '☑' : '☐'}</Text>
                                </TouchableOpacity>
                                <Text>Remember me</Text>
                            </View>

                            <TouchableOpacity
                                style={styles.forgotPassword}
                                onPress={handleForgotPassword}
                            >
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, loading && styles.disabledButton]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>LOGIN</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.socialButtons}>
                            <TouchableOpacity style={styles.socialButton}>
                                <Image source={googleIcon} style={styles.socialIcon} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <Image source={facebookIcon} style={styles.socialIcon} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.signupContainer}>
                            <Text style={styles.signupText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                                <Text style={styles.signupLink}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#fff',
        ...(Platform.OS === 'web' && {
            maxWidth: 480,
            alignSelf: 'center',
            width: '100%',
            height: '100vh'
        })
    },
    keyboardView: {
        flex: 1
    },
    scrollContent: {
        flexGrow: 1,
        ...(Platform.OS === 'web' && {
            display: 'flex',
            minHeight: '100vh'
        })
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 30,
        backgroundColor: '#fff',
        ...(Platform.OS === 'web' && {
            justifyContent: 'center',
            width: 500,
            maxWidth: '100%',
            alignItems: 'center'
        })
    },
    logo: {
        width: 120,
        height: 120,
        alignSelf: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: '#1a1a1a',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        marginBottom: 15,
        paddingHorizontal: 15,
        backgroundColor: '#f8f8f8',
    },
    inputIcon: {
        width: 20,
        height: 20,
        marginRight: 10,
        resizeMode: 'contain'
    },
    input: {
        flex: 1,
        height: 55,
        fontSize: 16,
    },
    inputError: {
        borderColor: '#ff3b30',
    },
    errorText: {
        color: '#ff3b30',
        fontSize: 12,
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#007AFF',
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 1,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e0e0e0',
    },
    dividerText: {
        marginHorizontal: 15,
        color: '#666',
    },
    socialButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
    },
    socialButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f8f8f8',
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    socialIcon: {
        width: 24,
        height: 24,
        resizeMode: 'contain'
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    signupText: {
        color: '#333',
    },
    signupLink: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    checkbox: {
        marginRight: 8,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    forgotPasswordText: {
        color: '#007AFF',
    },
    disabledButton: {
        opacity: 0.7,
    },
    formWrapper: {
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 20,
        backgroundColor: '#fff',
        marginBottom: 20,
        ...(Platform.OS === 'web' && {
            width: '100%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        })
    },
});