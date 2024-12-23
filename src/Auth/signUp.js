import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, ScrollView, Animated, Dimensions, Image, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db, auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// Consolidated image imports
const userIcon = require('../../assets/login/userIcon.png');
const emailIcon = require('../../assets/login/emailIcon.png');
const passwordIcon = require('../../assets/login/passwordIcon.png');
const phoneIcon = require('../../assets/login/phoneIcon.png');

const screenWidth = Dimensions.get('window').width;
const SCREEN_PADDING = 40;
const CONTENT_WIDTH = screenWidth - SCREEN_PADDING;
const isWeb = Platform.OS === 'web';
const containerWidth = screenWidth < 600 ? screenWidth : 480;

export default function SignUp() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [currentStep, setCurrentStep] = useState(1);
    const [stepErrors, setStepErrors] = useState({});
    const slideAnimation = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef(null);
    const navigation = useNavigation();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
        }).start();
    }, [fadeAnim]);

    // Improved password validation with clearer strength feedback
    const validatePassword = (password) => {
        const hasLowerCase = /[a-z]/.test(password);
        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#\$%\^&\*]/.test(password);
        const isLongEnough = password.length >= 8;

        let strength = '';
        if (isLongEnough && hasLowerCase && hasUpperCase && hasNumber && hasSpecialChar) {
            strength = 'strong';
        } else if (password.length >= 6 && hasLowerCase && hasUpperCase && hasNumber) {
            strength = 'medium';
        } else {
            strength = 'weak';
        }

        setPasswordStrength(strength);
    };

    const handlePasswordChange = (text) => {
        setPassword(text);
        validatePassword(text);
        setStepErrors(prev => ({ ...prev, password: '' }));
    };

    // Consolidated form validation
    const validateForm = () => {
        const errors = {};
        if (!name.trim()) errors.name = 'Name is required';
        if (!email.trim()) errors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email is invalid';
        if (!password.trim()) errors.password = 'Password is required';
        else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
        if (phoneNumber && !/^\+?[\d\s-]{8,}$/.test(phoneNumber)) {
            errors.phoneNumber = 'Invalid phone number format';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };


    // Streamlined step validation
    const validateStep = (step) => {
        const errors = {};

        switch (step) {
            case 1:
                if (!name.trim()) errors.name = 'Name is required';
                if (!email.trim()) errors.email = 'Email is required';
                else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email is invalid';
                break;
            case 2:
                if (!password.trim()) errors.password = 'Password is required';
                else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
                if (phoneNumber && !/^\+?[\d\s-]{8,}$/.test(phoneNumber)) {
                    errors.phoneNumber = 'Invalid phone number format';
                }
                break;
        }

        setStepErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Extracted progress bar rendering
    const renderProgressBar = () => (
        <View style={styles.progressBar}>
            {[1, 2, 3].map(step => (
                <View
                    key={step}
                    style={[
                        styles.progressDot,
                        currentStep >= step && styles.progressDotActive
                    ]}
                />
            ))}
        </View>
    );

    // Extracted step content rendering
    const renderStepContent = () => (
        <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false}
            style={[styles.stepsContainer, { width: containerWidth }]}
            contentContainerStyle={{ width: containerWidth * 3 }}
        >
            {/* Step 1: Basic Information */}
            <View style={styles.stepWrapper}>
                <Text style={styles.stepTitle}>Basic Information</Text>
                <View style={styles.inputContainer}>
                    <Image source={userIcon} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, stepErrors.name && styles.inputError]}
                        placeholder="Full Name"
                        value={name}
                        onChangeText={(text) => {
                            setName(text);
                            setStepErrors(prev => ({ ...prev, name: '' }));
                        }}
                    />
                </View>
                {stepErrors.name && <Text style={styles.errorText}>{stepErrors.name}</Text>}

                <View style={styles.inputContainer}>
                    <Image source={emailIcon} style={styles.inputIcon} />
                    <TextInput
                        style={[styles.input, stepErrors.email && styles.inputError]}
                        placeholder="Email Address"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            setStepErrors(prev => ({ ...prev, email: '' }));
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>
                {stepErrors.email && <Text style={styles.errorText}>{stepErrors.email}</Text>}
            </View>

            {/* Step 2: Security Details */}
            <View style={styles.stepWrapper}>
                <Text style={styles.stepTitle}>Security Details</Text>
                <View style={styles.formGroup}>
                    <View style={styles.inputContainer}>
                        <Image source={passwordIcon} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, stepErrors.password && styles.inputError]}
                            placeholder="Password"
                            value={password}
                            onChangeText={handlePasswordChange}
                            secureTextEntry
                        />
                    </View>
                    {stepErrors.password && <Text style={styles.errorText}>{stepErrors.password}</Text>}
                    {passwordStrength !== '' && (
                        <View style={styles.passwordStrengthContainer}>
                            <Text style={[
                                styles.passwordText,
                                styles[`${passwordStrength}Password`]
                            ]}>
                                Password Strength: {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
                            </Text>
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <Image source={phoneIcon} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, stepErrors.phoneNumber && styles.inputError]}
                            placeholder="Phone Number"
                            value={phoneNumber}
                            onChangeText={(text) => {
                                setPhoneNumber(text);
                                setStepErrors(prev => ({ ...prev, phoneNumber: '' }));
                            }}
                            keyboardType="phone-pad"
                        />
                    </View>
                    {stepErrors.phoneNumber && <Text style={styles.errorText}>{stepErrors.phoneNumber}</Text>}
                </View>
            </View>

            {/* Step 3: Additional Details */}
            <View style={styles.stepWrapper}>
                <Text style={styles.stepTitle}>Additional Details</Text>
                <View style={styles.formGroup}>
                    <View style={[styles.inputContainer, styles.addressContainer]}>
                        <TextInput
                            style={[styles.input, styles.multilineInput]}
                            placeholder="Address (Optional)"
                            value={address}
                            onChangeText={setAddress}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>
                </View>
            </View>
        </ScrollView>
    );

    // Enhanced step navigation functions
    const animateToNextStep = () => {
        if (!validateStep(currentStep)) {
            return;
        }

        if (currentStep < 3) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            scrollViewRef.current?.scrollTo({
                x: containerWidth * (nextStep - 1),
                animated: true
            });
        } else {
            handleSignUp();
        }
    };

    const animateToPreviousStep = () => {
        if (currentStep > 1) {
            const prevStep = currentStep - 1;
            setCurrentStep(prevStep);
            scrollViewRef.current?.scrollTo({
                x: containerWidth * (prevStep - 1),
                animated: true
            });
        }
    };

    // Improved sign-up handler with more informative error messages
    const handleSignUp = async () => {
        let hasErrors = false;

        // Validate each step
        for (let i = 1; i <= 3; i++) {
            if (!validateStep(i)) {
                setCurrentStep(i); // Move to the step with errors
                hasErrors = true;
                break; // Stop validation after finding the first error
            }
        }

        // If there are errors, stop the signup process
        if (hasErrors) {
            return;
        }

        // If all steps are valid, proceed with form validation
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                name: name,
                email: email,
                address: address || null,
                phoneNumber: phoneNumber || null,
                role: "user",
                createdAt: new Date(),
                lastLogin: new Date(),
            });

            const successCallback = () => {
                // Reset form state
                setName('');
                setEmail('');
                setPassword('');
                setPhoneNumber('');
                setAddress('');
                setFormErrors({});
                setStepErrors({});
                setCurrentStep(1);

                // Navigate to Login screen
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            };

            // Use platform-specific alerts
            if (Platform.OS === 'web') {
                window.alert('Account created successfully!');
                successCallback();
            } else {
                Alert.alert('Success', 'Account created successfully!', [{ text: 'OK', onPress: successCallback }]);
            }
        } catch (error) {
            console.error('Signup error:', error);
            const errorMessage = getFirebaseErrorMessage(error.code);

            if (Platform.OS === 'web') {
                window.alert(errorMessage);
            } else {
                Alert.alert('Signup Error', errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };


    // Extracted Firebase error message mapping
    const getFirebaseErrorMessage = (errorCode) => {
        switch (errorCode) {
            case 'auth/email-already-in-use':
                return 'This email is already registered. Please use a different email or try logging in.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/operation-not-allowed':
                return 'Email/password sign up is not enabled. Please contact support.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters long.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your internet connection.';
            case 'auth/too-many-requests':
                return 'Too many attempts. Please try again later.';
            default:
                return `Sign up failed: ${errorCode || 'Unknown error occurred'}`;
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    scrollEnabled={false}
                >
                    <Animated.View
                        style={[styles.container, { opacity: fadeAnim }]}
                        removeClippedSubviews={false}
                    >
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Please fill in the form to continue</Text>

                        <View style={styles.formContainer}>
                            {renderProgressBar()}
                            {renderStepContent()}
                        </View>

                        <View style={styles.buttonContainer}>
                            {currentStep > 1 && (
                                <TouchableOpacity
                                    style={[styles.button, styles.backButton]}
                                    onPress={animateToPreviousStep}
                                >
                                    <Text style={styles.buttonText}>BACK</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={[
                                    styles.button,
                                    loading && styles.disabledButton,
                                    currentStep > 1 && styles.nextButton
                                ]}
                                onPress={currentStep < 3 ? animateToNextStep : handleSignUp}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>
                                        {currentStep < 3 ? 'NEXT' : 'SIGN UP'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Login</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// STYLING MUST NOT BE CHANGED
const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#fff',
        ...(Platform.OS === 'android' && {
            paddingTop: 35
        }),
        ...(Platform.OS === 'web' && {
            maxWidth: containerWidth,
            alignSelf: 'center',
            width: '100%',
            height: '100vh',
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
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingTop: screenWidth < 600 ? 30 : 50,
        width: '100%',
        maxWidth: screenWidth < 600 ? '100%' : 600,

    },
    title: {
        fontSize: screenWidth < 600 ? 28 : 36,
        fontWeight: 'bold',
        marginBottom: screenWidth < 600 ? 10 : 20,
        textAlign: 'center',
        color: '#1a1a1a',
        marginTop: screenWidth < 600 ? 70 : "50%",
    },
    subtitle: {
        fontSize: screenWidth < 600 ? 16 : 18,
        color: '#666',
        textAlign: 'center',
        marginBottom: screenWidth < 600 ? 30 : 40,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginVertical: 8,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        height: screenWidth < 600 ? 55 : 60,
        width: screenWidth < 600 ? '100%' : '100%',
        maxWidth: 500,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    inputIcon: {
        width: 20,
        height: 20,
        marginRight: 10,
        resizeMode: 'contain'
    },
    input: {
        flex: 1,
        fontSize: screenWidth < 600 ? 16 : 16,
    },
    button: {
        backgroundColor: '#007AFF',
        height: screenWidth < 600 ? 50 : 56,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: screenWidth < 600 ? 16 : 18,
        fontWeight: '600',
        letterSpacing: 1,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    loginText: {
        color: '#333',
    },
    loginLink: {
        color: '#007AFF',
        fontWeight: 'bold',
    },
    passwordStrengthContainer: {
        width: '100%',
        paddingHorizontal: 5,
        marginBottom: 5,
    },
    weakPassword: {
        color: '#ff3b30',
        fontSize: 12,
    },
    mediumPassword: {
        color: '#ff9500',
        fontSize: 12,
    },
    strongPassword: {
        color: '#34c759',
        fontSize: 12,
    },
    passwordText: {
        fontSize: 12,
        fontWeight: '500',
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
    progressBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    progressDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 5,
    },
    progressDotActive: {
        backgroundColor: '#007AFF',
    },
    stepTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    errorText: {
        color: '#ff3b30',
        fontSize: 12,
        marginTop: 5,
        fontStyle: 'italic',
    },
    sliderContainer: {
        width: '100%',
        overflow: 'hidden',
    },
    stepsContainer: {
        width: containerWidth,
    },
    stepWrapper: {
        width: containerWidth,
        paddingHorizontal: screenWidth < 600 ? 20 : 40,
        alignItems: 'center',
    },
    addressContainer: {
        height: screenWidth < 600 ? 120 : 150,
        width: screenWidth < 600 ? '95%' : '90%',
        maxWidth: 500,
    },
    multilineInput: {
        height: 100,
        paddingTop: 15,
        paddingBottom: 15,
    },
    formContainer: {
        width: '100%',
        maxWidth: containerWidth,
        alignSelf: 'center',
        overflow: 'hidden',
    },
    formGroup: {
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        maxWidth: 400,
        gap: 10,
        marginTop: 20,
        paddingHorizontal: 20,
    },
    backButton: {
        backgroundColor: '#6c757d',
    },
    nextButton: {
        flex: 1,
    },
    inputError: {
        borderColor: '#ff3b30',
        borderWidth: 1,
    },
});
