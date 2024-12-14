import React, { useState, useRef, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Alert,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    ActivityIndicator,
    Image
} from 'react-native';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const emailIcon = require('../../assets/images/emailIcon.png');

const ForgotPassword = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
        }).start();
    }, []);

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        try {
            setLoading(true);
            await sendPasswordResetEmail(auth, email);
            Alert.alert(
                'Success',
                'Password reset email sent. Please check your inbox.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                        <Text style={styles.title}>Reset Password</Text>
                        <Text style={styles.subtitle}>Enter your email to reset your password</Text>

                        <View style={styles.formWrapper}>
                            <View style={styles.inputContainer}>
                                <Image source={emailIcon} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.button, loading && styles.disabledButton]}
                                onPress={handleResetPassword}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Reset Password</Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity 
                            style={styles.backToLogin} 
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text style={styles.backToLoginText}>Back to Login</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

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
    formWrapper: {
        borderWidth: 2,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 20,
        backgroundColor: '#fff',
        marginBottom: 20,
        width: '100%',
        ...(Platform.OS === 'web' && {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        })
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
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 1,
    },
    disabledButton: {
        opacity: 0.7,
    },
    backToLogin: {
        marginTop: 20,
    },
    backToLoginText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    }
});

export default ForgotPassword;