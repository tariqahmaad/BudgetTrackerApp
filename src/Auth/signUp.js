import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, ScrollView, Animated, Dimensions, Image, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const userIcon = require('../../assets/images/userIcon.png');
const emailIcon = require('../../assets/images/emailIcon.png');
const passwordIcon = require('../../assets/images/passwordIcon.png');
const phoneIcon = require('../../assets/images/phoneIcon.png');

export default function SignUp() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState('');

    const navigation = useNavigation();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
        }).start();
    }, []);

    const validatePassword = (password) => {
        const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
        const mediumRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{6,})");
        
        if (strongRegex.test(password)) {
            setPasswordStrength('strong');
        } else if (mediumRegex.test(password)) {
            setPasswordStrength('medium');
        } else {
            setPasswordStrength('weak');
        }
    };

    const handlePasswordChange = (text) => {
        setPassword(text);
        validatePassword(text);
    };

    const handleSignUp = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            if (!auth) {
                throw new Error('Firebase auth is not initialized');
            }

            // Create user with Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store additional user data in Firestore
            const userRef = collection(db, 'users');
            await addDoc(userRef, {
                uid: user.uid,
                address: null,
                createdAt: new Date(),
                email: email,
                lastLogin: new Date(),
                name: name,
                phoneNumber: phoneNumber || null,
                role: "user"
            });

            Alert.alert('Success', 'Account created successfully!', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
        } catch (error) {
            let errorMessage = 'Failed to create account';
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Email already exists';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters';
            }
            Alert.alert('Error', errorMessage);
            console.error('Signup error:', error);
        } finally {
            setLoading(false);
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
                >
                    <Animated.View 
                        style={[styles.container, { opacity: fadeAnim }]}
                        removeClippedSubviews={false}
                    >
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Please fill in the form to continue</Text>

                        <View style={styles.inputContainer}>
                            <Image source={userIcon} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Name"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Image source={emailIcon} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Image source={passwordIcon} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                value={password}
                                onChangeText={handlePasswordChange}
                                secureTextEntry
                            />
                        </View>

                        {password && (
                            <View style={styles.passwordStrength}>
                                <Text style={styles[`${passwordStrength}Password`]}>
                                    Password Strength: {passwordStrength}
                                </Text>
                            </View>
                        )}

                        <View style={styles.inputContainer}>
                            <Image source={phoneIcon} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Phone Number"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.disabledButton]}
                            onPress={handleSignUp}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>SIGN UP</Text>
                            )}
                        </TouchableOpacity>

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

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#fff'
    },
    keyboardView: {
        flex: 1
    },
    scrollContent: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 30,
        backgroundColor: '#fff'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: '#1a1a1a',
        marginTop: 40,
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
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
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
    passwordStrength: {
        marginBottom: 10,
        paddingHorizontal: 15,
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
    disabledButton: {
        opacity: 0.7,
    },
});