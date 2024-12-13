import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../firebase';

const SettingScreen = () => {
    const navigation = useNavigation();

    const handleLogout = async () => {
        try {
            await auth.signOut();
            
            Alert.alert('Success', 'Logged out successfully');
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to logout');
            console.error(error);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
            >
                <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    logoutButton: {
        backgroundColor: '#FF3B30',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default SettingScreen;