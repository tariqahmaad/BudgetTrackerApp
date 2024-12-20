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
    Animated,
} from 'react-native';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import BottomTabBar from '../components/BottomTabBar';
import { useTab } from '../components/TabContext';
// import MainLayout from '../components/MainLayout';

const ProfileScreen = ({ navigation }) => {
    const [userData, setUserData] = useState(null);
    const { activeTab, setActiveTab } = useTab();
    const [tabAnimations] = useState({
        home: new Animated.Value(1),
        add: new Animated.Value(1),
        track: new Animated.Value(1),
        profile: new Animated.Value(1)
    });

    useEffect(() => {
        fetchUserProfile();
    }, []);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setActiveTab('profile');
            // Reset animations for other tabs
            Object.keys(tabAnimations).forEach(key => {
                if (key !== 'profile') {
                    Animated.spring(tabAnimations[key], {
                        toValue: 0,
                        useNativeDriver: true
                    }).start();
                }
            });
        });

        return unsubscribe;
    }, [navigation]);

    const fetchUserProfile = async () => {
        try {
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Logout",
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            navigation.replace('Login');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to logout');
                        }
                    }
                }
            ]
        );
    };

    const animateTab = (tabName) => {
        // Reset all tabs
        Object.keys(tabAnimations).forEach(key => {
            Animated.spring(tabAnimations[key], {
                toValue: 1,
                useNativeDriver: true
            }).start();
        });

        // Animate selected tab
        Animated.sequence([
            Animated.spring(tabAnimations[tabName], {
                toValue: 0.8,
                useNativeDriver: true,
                duration: 100
            }),
            Animated.spring(tabAnimations[tabName], {
                toValue: 1,
                useNativeDriver: true,
                bounciness: 12
            })
        ]).start();
    };

    const handleTabPress = (tabName) => {
        setActiveTab(tabName);
        if (tabName === 'home') {
            navigation.navigate('MainApp', { screen: 'Dashboard' });
        }
    };

    return (
        <MainLayout navigation={navigation}>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Profile Header */}
                    <View style={styles.profileHeader}>
                        <Image
                            source={userData?.profileImage ? { uri: userData.profileImage } : require('../../assets/login/userIcon.png')}
                            style={styles.profileImage}
                        />
                        <Text style={styles.userName}>{userData?.name || 'User'}</Text>
                        <Text style={styles.userEmail}>{userData?.email || 'email@example.com'}</Text>
                    </View>

                    {/* Profile Options */}
                    <View style={styles.section}>
                        <TouchableOpacity style={styles.optionItem}>
                            <Image source={require('../../assets/dashboard/Profile.png')} style={styles.optionIcon} />
                            <Text style={styles.optionText}>Edit Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionItem}>
                            {/* <Image source={require('../../assets/dashboard/notification.png')} style={styles.optionIcon} /> */}
                            <Text style={styles.optionText}>Notifications</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionItem}>
                            {/* <Image source={require('../../assets/dashboard/settings.png')} style={styles.optionIcon} /> */}
                            <Text style={styles.optionText}>Settings</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionItem} onPress={handleLogout}>
                            <Image source={require('../../assets/dashboard/logout.png')} style={[styles.optionIcon, styles.logoutIcon]} />
                            <Text style={[styles.optionText, styles.logoutText]}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </MainLayout>
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
});

export default ProfileScreen;
