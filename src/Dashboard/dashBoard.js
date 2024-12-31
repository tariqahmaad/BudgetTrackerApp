import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
    ScrollView,
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
    Alert,
    Dimensions,
    StatusBar,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where, doc, getDoc, orderBy, limit, onSnapshot,Timestamp } from 'firebase/firestore';
import { ProgressBar, Portal, Modal } from 'react-native-paper';
import { auth, db } from '../firebase';  // Update the path if needed
import LottieView from 'lottie-react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const Dashboard = () => {
    const navigation = useNavigation();
    const [userName, setUserName] = useState('');
    const [accumulatedBalance, setAccumulatedBalance] = useState(0);
    const [targetBalance, setTargetBalance] = useState(1250);
    const [progress, setProgress] = useState(0);
    const [friends, setFriends] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [monthlySpending, setMonthlySpending] = useState({
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        data: [0, 0, 0, 0]
    });
    const [refreshing, setRefreshing] = useState(false);
    const [showAllTransactions, setShowAllTransactions] = useState(false);
    const [allTransactions, setAllTransactions] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                // Add user document listener
                const userDocRef = doc(db, 'users', user.uid);
                const unsubscribeUser = onSnapshot(userDocRef, (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const userData = docSnapshot.data();
                        setTargetBalance(userData.targetBalance || 1250);
                    }
                });

                const transactionsRef = collection(db, 'users', user.uid, 'transactions');
                const unsubscribeTransactions = onSnapshot(transactionsRef, snapshot => {
                    let total = 0;
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        total += data.type === 'income' ? data.amount : -data.amount;
                    });
                    
                    // Update accumulated balance
                    const roundedTotal = Number(total.toFixed(2));
                    setAccumulatedBalance(roundedTotal);
                    
                    // Calculate progress based on accumulated balance and target
                    if (targetBalance <= 0) {
                        setProgress(0);
                    } else {
                        // Ensure we only use positive values and cap at target balance
                        const positiveBalance = Math.max(0, roundedTotal);
                        const rawProgress = positiveBalance / targetBalance;
                        // Ensure progress is between 0 and 1
                        const clampedProgress = Math.min(Math.max(rawProgress, 0), 1);
                        setProgress(clampedProgress);
                    }
                    
                    // Update other data
                    fetchRecentActivity(user.uid);
                    fetchMonthlySpending(user.uid);
                });

                // Fetch other data
                fetchUserData(user.uid);
                fetchFriends(user.uid);

                return () => {
                    unsubscribeUser();
                    unsubscribeTransactions();
                };
            } else {
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
                    image: friendData.image || require('../../assets/login/userIcon.png'), // Use your placeholder image
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
                orderBy('date', 'desc')
            );
            const transactionsSnap = await getDocs(recentTransactionsQuery);
            const activityData = [];

            transactionsSnap.forEach((doc) => {
                const data = doc.data();
                const date = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
                
                activityData.push({
                    id: doc.id,
                    description: data.description || 'Transaction',
                    name: userName,
                    amount: data.type === 'income' ? `+${data.amount.toFixed(2)}` : `-${data.amount.toFixed(2)}`,
                    date: date,
                    type: data.type,
                    timestamp: date.getTime() // Add timestamp for easier sorting
                });
            });

            // Sort by timestamp in descending order
            activityData.sort((a, b) => b.timestamp - a.timestamp);

            setAllTransactions(activityData);
            setRecentActivity(activityData.slice(0, 5));
        } catch (error) {
            console.error("Error fetching recent activity:", error);
            Alert.alert('Error', 'Failed to fetch recent activity.');
        }
    };

    const fetchMonthlySpending = async userId => {
        try {
            const now = new Date();
            const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
            const startTimestamp = Timestamp.fromDate(startOfMonth);

            const transactionsRef = collection(db, 'users', userId, 'transactions');
            const q = query(
                transactionsRef,
                where('type', '==', 'expense'),
                where('date', '>=', startTimestamp),
                orderBy('date', 'asc')
            );

            const querySnapshot = await getDocs(q);
            // Initialize arrays with integers (cents)
            const weeklyTotalsCents = [0, 0, 0, 0];

            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.date && data.amount) {
                    const transactionDate = data.date.toDate();
                    const dayOfMonth = transactionDate.getDate();
                    const weekIndex = Math.min(Math.floor((dayOfMonth - 1) / 7), 3);
                    
                    // Convert amount to cents (integer)
                    const amountInCents = Math.round(parseFloat(data.amount) * 100);
                    
                    if (!isNaN(amountInCents) && weekIndex >= 0 && weekIndex < 4) {
                        weeklyTotalsCents[weekIndex] += amountInCents;
                    }
                }
            });

            // Convert cents back to dollars with 2 decimal places
            const weeklyTotals = weeklyTotalsCents.map(cents => 
                Number((cents / 100).toFixed(2))
            );

            setMonthlySpending({
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                data: weeklyTotals
            });
        } catch (error) {
            console.error('Error fetching monthly spending:', error);
            Alert.alert('Error', 'Failed to fetch monthly spending data.');
        }
    };

        
    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            const user = auth.currentUser;
            if (user) {
                await Promise.all([
                    fetchUserData(user.uid),
                    fetchFriends(user.uid),
                    fetchRecentActivity(user.uid),
                    fetchMonthlySpending(user.uid)
                ]);
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
        setRefreshing(false);
    }, []);

    const renderHeader = () => (
        <View style={styles.header}>
            <View>
                <Text style={styles.greeting}>Hello {userName},</Text>
                <Text style={styles.welcome}>Welcome Back!</Text>
            </View>
            <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.navigate('Notifications')}
            >
                <LottieView
                    source={require('../../assets/dashboard/notification.json')}
                    autoPlay
                    loop
                    style={styles.notificationLottie}
                />
            </TouchableOpacity>
        </View>
    );

    // Add current date formatting
    const getCurrentDate = () => {
        const date = new Date();
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const renderTransactionItem = (activity) => (
        <View key={activity.id} style={styles.activityItem}>
            <View style={[
                styles.activityIconContainer,
                { backgroundColor: activity.amount.includes('+') ? '#e6f7ed' : '#ffe6e6' }
            ]}>
                <Text style={styles.activityEmoji}>
                    {activity.amount.includes('+') ? '↗️' : '↘️'}
                </Text>
            </View>
            <View style={styles.activityDetails}>
                <Text style={styles.activityDescription}>{activity.description}</Text>
                <Text style={styles.activityDate}>
                    {activity.date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </Text>
            </View>
            <Text style={[
                styles.activityAmount,
                { color: activity.amount.includes('+') ? '#2e7d32' : '#d32f2f' }
            ]}>
                {activity.amount}
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />
            <ScrollView 
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: 100 } // Increased padding to account for Navbar
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#1976d2']}
                    />
                }
            >
                {renderHeader()}

                <View style={styles.goalCard}>
                    <View style={styles.goalHeader}>
                        <View style={styles.goalIconContainer}>
                            <Text style={styles.goalTitle}>Savings Goal</Text>
                        </View>
                        <View style={styles.targetDateContainer}>
                            <Text style={styles.goalDate}>{getCurrentDate()}</Text>
                        </View>
                    </View>
                    <View style={styles.balanceContainer}>
                        <Text style={styles.goalLabel}>Accumulated Balance</Text>
                        <Text style={styles.goalAmount}>₺ {accumulatedBalance.toFixed(2)}</Text>
                    </View>
                    <ProgressBar
                        progress={progress}
                        color="#4CAF50" // yellow color for progress
                        style={styles.progressBar}
                    />
                    <View style={styles.progressTextContainer}>
                        <Text style={styles.progressText}>
                            {Math.round(progress * 100)}% Complete
                        </Text>
                        <Text style={styles.targetText}>
                            Target: ₺{targetBalance.toFixed(2)}
                        </Text>
                    </View>
                </View>

                <View style={styles.spendingCard}>
                    <Text style={styles.spendingTitle}>Monthly Spending</Text>
                    <LineChart
                        data={{
                            labels: monthlySpending.labels,
                            datasets: [{
                                data: monthlySpending.data
                            }]
                        }}
                        width={screenWidth - 40}
                        height={120}
                        chartConfig={{
                            backgroundColor: '#1976d2',
                            backgroundGradientFrom: '#1976d2',
                            backgroundGradientTo: '#1976d2',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                            style: {
                                borderRadius: 16
                            },
                            propsForDots: {
                                r: '6',
                                strokeWidth: '2',
                                stroke: '#ffa726'
                            }
                        }}
                        bezier
                        style={{
                            marginVertical: 8,
                            borderRadius: 16
                        }}
                    />
                </View>

                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('AddTransaction')}>
                        <Text style={styles.actionButtonIcon}>💰</Text>
                        <Text style={styles.actionButtonText}>Add Transaction</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Statistics')}>
                        <Text style={styles.actionButtonIcon}>📊</Text>
                        <Text style={styles.actionButtonText}>Statistics</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.friendsSection}>
                    <Text style={styles.sectionTitle}>Your Friends</Text>
                    <TouchableOpacity style={styles.seeAllButton}>
                        <Text style={styles.seeAllButtonText}>See All</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendsList}>
                    {friends.map((friend) => (
                        <TouchableOpacity 
                            key={friend.id} 
                            style={styles.friendItem}
                            onPress={() => navigation.navigate('TrackDebt', { selectedFriendId: friend.id })}
                        >
                            <Image source={friend.image} style={styles.friendImage} />
                            <Text style={styles.friendName}>{friend.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.activityContainer}>
                    <View style={styles.activityHeader}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        <TouchableOpacity onPress={() => setShowAllTransactions(true)}>
                            <Text style={styles.seeAllButtonText}>See All</Text>
                        </TouchableOpacity>
                    </View>
                    {recentActivity.map(renderTransactionItem)}
                </View>
            </ScrollView>

            <Portal>
                <Modal
                    visible={showAllTransactions}
                    onDismiss={() => setShowAllTransactions(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <View style={styles.modalOverlay}>
                        <SafeAreaView style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <View>
                                    <Text style={styles.modalTitle}>Transaction History</Text>
                                    <Text style={styles.modalSubtitle}>All your recent transactions</Text>
                                </View>
                                <TouchableOpacity 
                                    onPress={() => setShowAllTransactions(false)}
                                    style={styles.closeButtonContainer}
                                >
                                    <Text style={styles.closeButton}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView 
                                style={styles.modalScroll}
                                showsVerticalScrollIndicator={false}
                            >
                                {allTransactions.map(renderTransactionItem)}
                            </ScrollView>
                        </SafeAreaView>
                    </View>
                </Modal>
            </Portal>
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
        backgroundColor: '#1976d2',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#1976d2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
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
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
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
    profileButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    goalEmoji: {
        fontSize: 24,
        marginRight: 8,
    },
    balanceContainer: {
        marginVertical: 16,
    },
    targetDateContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    actionButton: {
        flex: 0.48,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    actionButtonIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    activityContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    activityEmoji: {
        fontSize: 20,
    },
    activityDate: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    notificationButton: {
        width: 45,
        height: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationLottie: {
        width: 30,
        height: 30,
    },
    spendingCard: {
        backgroundColor: '#1976d2',
        borderRadius: 24,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#1976d2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    spendingTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
        marginLeft: 8,
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalContainer: {
        margin: 0,
        padding: 20, // Added padding around the modal
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#f8f9fa',
        borderRadius: 35, // Changed to have all corners rounded
        height: '90%',
        width: '100%',
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
        overflow: 'hidden', // Added to ensure content respects border radius
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#ffffff',
        borderRadius: 35, // Match the container radius
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginHorizontal: -15,
        marginBottom: 10, // Added spacing between header and content
    },
    modalScroll: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f9fa',
        borderBottomLeftRadius: 35, // Added bottom radius
        borderBottomRightRadius: 35, // Added bottom radius
    },
});

export default Dashboard;