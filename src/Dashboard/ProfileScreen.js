import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
    Alert,
    StatusBar,
} from 'react-native';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { TextInput } from 'react-native';

const ProfileScreen = ({ navigation }) => {
    const [userData, setUserData] = useState(null);
    const [isEditingTarget, setIsEditingTarget] = useState(false);
    const [targetAmount, setTargetAmount] = useState('');

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData(data);
                    setTargetAmount(data.targetBalance?.toString() || '1250');
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleUpdateTarget = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    targetBalance: Number(targetAmount)
                });
                setIsEditingTarget(false);
                Alert.alert('Success', 'Target balance updated successfully!');
            }
        } catch (error) {
            console.error('Error updating target:', error);
            Alert.alert('Error', 'Failed to update target balance');
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            // Remove any manual navigation - let auth state handle it
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert('Error', 'Failed to logout. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.profileHeader}>
                    <Image
                        source={userData?.profileImage ? { uri: userData.profileImage } : require('../../assets/login/userIcon.png')}
                        style={styles.profileImage}
                    />
                    <Text style={styles.userName}>{userData?.name || 'User'}</Text>
                    <Text style={styles.userEmail}>{userData?.email || auth.currentUser?.email || 'email@example.com'}</Text>
                </View>

                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.optionItem}
                        onPress={() => setIsEditingTarget(!isEditingTarget)}
                    >
                        <Text style={styles.optionText}>Target Balance: ₺{targetAmount}</Text>
                    </TouchableOpacity>

                    {isEditingTarget && (
                        <View style={styles.targetInputContainer}>
                            <TextInput
                                style={styles.targetInput}
                                value={targetAmount}
                                onChangeText={setTargetAmount}
                                keyboardType="numeric"
                                placeholder="Enter target amount"
                            />
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleUpdateTarget}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity style={styles.optionItem}>
                        <Image source={require('../../assets/dashboard/Profile.png')} style={styles.optionIcon} />
                        <Text style={styles.optionText}>Edit Profile</Text>
                    </TouchableOpacity>


                    <TouchableOpacity style={styles.optionItem}>
                        <Image source={require('../../assets/dashboard/setting.png')} style={styles.optionIcon} />
                        <Text style={styles.optionText}>Settings</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.optionItem} onPress={handleLogout}>
                        <Image source={require('../../assets/dashboard/logout.png')} style={[styles.optionIcon, styles.logoutIcon]} />
                        <Text style={[styles.optionText, styles.logoutText]}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 80,
    },
    profileHeader: {
        alignItems: 'center',
        marginVertical: 20,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
        borderWidth: 3,
        borderColor: '#4CAF50',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    optionIcon: {
        width: 24,
        height: 24,
        marginRight: 15,
        tintColor: '#4CAF50',
    },
    optionText: {
        fontSize: 16,
        color: '#333',
    },
    logoutIcon: {
        tintColor: '#ff4444',
    },
    logoutText: {
        color: '#ff4444',
    },
    targetInputContainer: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    targetInput: {
        borderWidth: 1,
        borderColor: '#4CAF50',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ProfileScreen;
