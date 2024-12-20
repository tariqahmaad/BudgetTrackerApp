import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
    Alert,
    Dimensions,
    StatusBar,
} from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { ProgressBar } from 'react-native-paper';
import { auth, db } from './firebase';  // Update the path if needed
import LottieView from 'lottie-react-native';
import Navbar from './components/Navbar'; // Assuming you have the Navbar component

const screenWidth = Dimensions.get('window').width;

const Dashboard = () => {
    const navigation = useNavigation();
    const [userName, setUserName] = useState('');
    const [accumulatedBalance, setAccumulatedBalance] = useState(0);
    const [targetBalance, setTargetBalance] = useState(1250);
    const [progress, setProgress] = useState(0);
    const [friends, setFriends] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in
                fetchUserData(user.uid);
                fetchFriends(user.uid);
                fetchRecentActivity(user.uid);
            } else {
                // User is signed out
                navigation.replace('LoginIn');
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchUserData = async (userId) => {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                setUserName(userSnap.data().name || 'User'); // Default to 'User'
            } else {
                setUserName('User'); // Default if user not found
            }

            const transactionsRef = collection(db, 'users', userId, 'transactions');
            const transactionsSnap = await getDocs(transactionsRef);
            let totalBalance = 0;

            transactionsSnap.forEach((doc) => {
                const data = doc.data();
                totalBalance += data.type === 'income' ? data.amount : -data.amount;
            });

            setAccumulatedBalance(totalBalance);
            setProgress(totalBalance / targetBalance);
        } catch (error) {
            console.error("Error fetching user data:", error);
            Alert.alert('Error', 'Failed to fetch user data.');
        }
    };

    const fetchFriends = async (userId) => {
        try {
            const friendsRef = collection(db, 'users', userId, 'friends');
            const friendsSnap = await getDocs(friendsRef);
            const friendsData = [];

            for (const doc of friendsSnap.docs) {
                const friendData = doc.data();
                friendsData.push({
                    id: doc.id,
                    name: friendData.name,
                    image: friendData.image || require('../assets/login/userIcon.png'), // Use your placeholder image
                });
            }

            setFriends(friendsData);
        } catch (error) {
            console.error("Error fetching friends:", error);
            Alert.alert('Error', 'Failed to fetch friends.');
        }
    };

    const fetchRecentActivity = async (userId) => {
        try {
            const transactionsRef = collection(db, 'users', userId, 'transactions');
            const recentTransactionsQuery = query(
                transactionsRef,
                orderBy('date', 'desc'),
                limit(5)
            );
            const transactionsSnap = await getDocs(recentTransactionsQuery);
            const activityData = [];

            transactionsSnap.forEach((doc) => {
                const data = doc.data();
                activityData.push({
                    id: doc.id,
                    description: data.description || 'Transaction',
                    name: userName,
                    amount: data.type === 'income' ? `+${data.amount.toFixed(2)}` : `-${data.amount.toFixed(2)}`,
                    date: data.date,
                });
            });

            setRecentActivity(activityData);
        } catch (error) {
            console.error("Error fetching recent activity:", error);
            Alert.alert('Error', 'Failed to fetch recent activity.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hello {userName},</Text>
                        <Text style={styles.welcome}>Welcome Back!</Text>
                    </View>
                    <TouchableOpacity style={styles.notificationIcon}>
                        <LottieView
                            source={require('../assets/dashboard/notification.json')}
                            autoPlay
                            loop
                            style={styles.lottieIcon}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.goalCard}>
                    <View style={styles.goalHeader}>
                        <View style={styles.goalIconContainer}>
                            {/* <Image source={require('../assets/dashboard/mecca.png')} style={styles.goalIcon} /> */}
                            <Text style={styles.goalTitle}>Tour to Mecca</Text>
                        </View>
                        <Text style={styles.goalDate}>16 January 2023</Text>
                    </View>
                    <Text style={styles.goalLabel}>Accumulated Balance</Text>
                    <Text style={styles.goalAmount}>${accumulatedBalance.toFixed(2)}</Text>
                    <ProgressBar
                        progress={progress}
                        color="#FFFFFF"
                        style={styles.progressBar}
                    />
                    <View style={styles.progressTextContainer}>
                        <Text style={styles.progressText}>
                            {Math.round(progress * 100)}%
                        </Text>
                        <Text style={styles.progressText}>
                            ${accumulatedBalance.toFixed(2)} / ${targetBalance.toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.goalParticipants}>
                        <Image source={require('../assets/login/userIcon.png')} style={styles.participantIcon} />
                        <Image source={require('../assets/login/userIcon.png')} style={styles.participantIcon} />
                        <View style={styles.moreParticipants}>
                            <Text style={styles.moreParticipantsText}>+2</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.friendsSection}>
                    <Text style={styles.sectionTitle}>Your Friends</Text>
                    <TouchableOpacity style={styles.seeAllButton}>
                        <Text style={styles.seeAllButtonText}>See All</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendsList}>
                    {friends.map((friend) => (
                        <TouchableOpacity key={friend.id} style={styles.friendItem}>
                            <Image source={friend.image} style={styles.friendImage} />
                            <Text style={styles.friendName}>{friend.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={styles.sectionTitle}>Recent Activity</Text>
                {recentActivity.map((activity) => (
                    <View key={activity.id} style={styles.activityItem}>
                        <View style={styles.activityIconContainer}>
                            <Image source={activity.icon} style={styles.icon} />
                        </View>
                        <View style={styles.activityDetails}>
                            <Text style={styles.activityDescription}>{activity.description}</Text>
                            <Text style={styles.activityName}>{activity.name}</Text>
                        </View>
                        <Text style={styles.activityAmount}>{activity.amount}</Text>
                    </View>
                ))}
            </ScrollView>

            <Navbar navigation={navigation} />
        </SafeAreaView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8', // Light background
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 80, // Adjust for bottom nav height
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    greeting: {
        fontSize: 18,
        color: '#333', // Dark text for readability
    },
    welcome: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    notificationIcon: {
        padding: 10,
    },
    goalCard: {
        backgroundColor: '#4CAF50', // Green background for the card
        borderRadius: 20,
        padding: 20,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    lottieIcon: {
        width: 30,
        height: 30,
    },
    goalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    goalIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    goalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 10,
    },
    goalDate: {
        fontSize: 14,
        color: '#fff',
    },
    goalLabel: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 5,
    },
    goalAmount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    progressBar: {
        height: 10,
        borderRadius: 5,
        marginBottom: 5,
    },
    progressTextContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    progressText: {
        fontSize: 14,
        color: '#fff',
    },
    goalParticipants: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    participantIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginLeft: -10,
        borderWidth: 2,
        borderColor: '#fff',
    },
    moreParticipants: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginLeft: -10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreParticipantsText: {
        fontSize: 14,
        color: '#333',
    },
    friendsSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    seeAllButton: {
        padding: 10,
    },
    seeAllButtonText: {
        fontSize: 16,
        color: '#4CAF50', // Green color for actions
    },
    friendsList: {
        flexDirection: 'row',
    },
    friendItem: {
        marginRight: 15,
        alignItems: 'center',
    },
    friendImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 5,
    },
    friendName: {
        fontSize: 14,
        color: '#333',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    activityIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    activityDetails: {
        flex: 1,
    },
    activityDescription: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    activityName: {
        fontSize: 14,
        color: '#666',
    },
    activityAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50', // Green for positive amounts
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#333', // Darker background for the bottom nav
        paddingVertical: 10,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    navItem: {
        alignItems: 'center',
        flex: 1,
    },
    navIcon: {
        width: 24,
        height: 24,
        marginBottom: 5,
        tintColor: '#fff',
    },
    navLabel: {
        fontSize: 12,
        color: '#fff',
    },
    icon: {
        width: 24,
        height: 24,
        tintColor: '#fff', // White icon color for visibility
    },
});

export default Dashboard;