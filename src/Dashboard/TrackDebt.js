import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Modal,
    Alert,
    Keyboard,
    RefreshControl,
    ScrollView,
    LayoutAnimation,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
    collection,
    getDocs,
    addDoc,
    doc,
    deleteDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
    PaperProvider,
    TextInput,
    Button,
    List,
    Divider,
    ActivityIndicator,
    useTheme,
    Chip,
    FAB,
    Portal,
    Searchbar,
    SegmentedButtons,
    MD3Colors,
    Snackbar,
    Avatar
} from 'react-native-paper';
import Navbar from '../components/Navbar';

const TrackDebt = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const [friends, setFriends] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newFriendName, setNewFriendName] = useState('');
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [debtAmount, setDebtAmount] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [debtDescription, setDebtDescription] = useState('');
    const [paymentDescription, setPaymentDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [filterType, setFilterType] = useState('all');
    const [activeTab, setActiveTab] = useState('add');
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const theme = useTheme();
    const dynamicStyles = getThemedStyles({
        ...theme.colors,
        primary: '#1976d2', // Match Dashboard's primary color
    });
    const styles = { ...staticStyles, ...dynamicStyles };

    useEffect(() => {
        const fetchFriendsAndTransactions = async () => {
            setLoading(true);
            await fetchFriends();
            const selectedFriendId = route.params?.selectedFriendId;
            if (selectedFriendId) {
                const friend = friends.find(f => f.id === selectedFriendId);
                if (friend) {
                    setSelectedFriend(friend);
                    const transactions = await fetchTransactionsForFriend(friend.id);
                    setSelectedFriend({ ...friend, transactions });
                }
            }
            setLoading(false);
        };
        fetchFriendsAndTransactions();
    }, [route.params?.selectedFriendId]);

    useEffect(() => {
        const loadTransactions = async () => {
            if (selectedFriend) {
                setLoading(true);
                try {
                    const transactions = await fetchTransactionsForFriend(selectedFriend.id);
                    // Sort transactions by date in descending order
                    transactions.sort((a, b) => b.date - a.date);
                    setSelectedFriend(prev => ({
                        ...prev,
                        transactions
                    }));
                } catch (error) {
                    console.error('Error loading transactions:', error);
                    Alert.alert('Error', 'Failed to load transactions');
                }
                setLoading(false);
            }
        };
        loadTransactions();
    }, [selectedFriend?.id]);

    const fetchFriends = async () => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            const friendsRef = collection(db, 'users', user.uid, 'friends');
            const querySnapshot = await getDocs(friendsRef);
            const friendsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                transactions: [],
            }));
            const friendsWithTransactions = await Promise.all(
                friendsData.map(async friend => {
                    const transactions = await fetchTransactionsForFriend(friend.id);
                    return { ...friend, transactions };
                })
            );
            setFriends(friendsWithTransactions);
        } catch (error) {
            console.error('Error fetching friends:', error);
            Alert.alert('Error', 'Failed to fetch friends.');
        }
    };

    const fetchTransactionsForFriend = async friendId => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            const transactionsRef = collection(
                db,
                'users',
                user.uid,
                'friends',
                friendId,
                'transactions'
            );
            const querySnapshot = await getDocs(transactionsRef);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                let transactionDate;
                if (data.date && typeof data.date.toDate === 'function') {
                    transactionDate = data.date.toDate();
                } else if (data.date) {
                    transactionDate = new Date(data.date);
                } else {
                    transactionDate = new Date(); // Default to current date if missing
                    console.warn(`Transaction ${doc.id} is missing a valid date. Defaulting to current date.`);
                }
                return {
                    id: doc.id,
                    ...data,
                    date: transactionDate,
                };
            });
        } catch (error) {
            console.error('Error fetching transactions:', error);
            Alert.alert('Error', 'Failed to fetch transactions.');
            return [];
        }
    };

    const handleAddFriend = async () => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            if (!newFriendName.trim()) {
                Alert.alert('Error', 'Please enter a friend\'s name.');
                return;
            }
            const friendsRef = collection(db, 'users', user.uid, 'friends');
            await addDoc(friendsRef, { name: newFriendName });
            setNewFriendName('');
            setIsModalVisible(false);
            await fetchFriends();
            showSnackbar('Friend added successfully');
        } catch (error) {
            console.error('Error adding friend:', error);
            Alert.alert('Error', 'Failed to add friend.');
        }
    };

    const handleAddTransaction = useCallback(async (type) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            if (!selectedFriend) {
                Alert.alert('Error', 'No friend selected.');
                return;
            }
            const amount = type === 'debt' ? parseFloat(debtAmount) : parseFloat(paymentAmount);
            if (isNaN(amount) || amount <= 0) {
                Alert.alert('Error', 'Please enter a valid amount.');
                return;
            }
            const friendRef = doc(db, 'users', user.uid, 'friends', selectedFriend.id);
            const transactionsRef = collection(friendRef, 'transactions');
            await addDoc(transactionsRef, {
                type,
                amount,
                date: new Date(), // Ensure date is always set
                description: type === 'debt' ? debtDescription : paymentDescription // Add description to transaction
            });
            setDebtAmount('');
            setPaymentAmount('');
            setDebtDescription(''); // Clear description
            setPaymentDescription(''); // Clear description
            Keyboard.dismiss();
            showSnackbar(`${type === 'debt' ? 'Amount I paid' : 'Amount they paid'} added successfully`);
            // Refetch transactions to update the state
            const transactions = await fetchTransactionsForFriend(selectedFriend.id);
            setSelectedFriend(prev => ({
                ...prev,
                transactions,
            }));
            setFriends(prevFriends =>
                prevFriends.map(f =>
                    f.id === selectedFriend.id
                        ? { ...f, transactions }
                        : f
                )
            );
        } catch (error) {
            console.error(`Error adding ${type}:`, error);
            Alert.alert('Error', `Failed to add ${type}. Please try again.`);
        }
    }, [debtAmount, paymentAmount, debtDescription, paymentDescription, selectedFriend]);

    const handleDeleteTransaction = async (transactionId) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            if (!selectedFriend) return;

            const transactionRef = doc(
                db,
                'users',
                user.uid,
                'friends',
                selectedFriend.id,
                'transactions',
                transactionId
            );

            await deleteDoc(transactionRef);

            // Update local state
            setSelectedFriend(prev => ({
                ...prev,
                transactions: prev.transactions.filter(t => t.id !== transactionId),
            }));

            setFriends(prevFriends =>
                prevFriends.map(f =>
                    f.id === selectedFriend.id
                        ? { ...f, transactions: f.transactions.filter(t => t.id !== transactionId) }
                        : f
                )
            );

            showSnackbar('Transaction deleted successfully');
        } catch (error) {
            console.error('Error deleting transaction:', error);
            Alert.alert('Error', 'Failed to delete transaction.');
        }
    };

    const handleDeleteFriend = async (friendId) => {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            Alert.alert(
                'Delete Friend',
                'Are you sure you want to delete this friend? All associated transactions will be deleted.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                const friendRef = doc(db, 'users', user.uid, 'friends', friendId);
                                await deleteDoc(friendRef);
                                setFriends(prevFriends => prevFriends.filter(f => f.id !== friendId));
                                showSnackbar('Friend deleted successfully');
                            } catch (error) {
                                console.error('Error deleting friend:', error);
                                Alert.alert('Error', 'Failed to delete friend.');
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error in handleDeleteFriend:', error);
            Alert.alert('Error', 'Failed to delete friend.');
        }
    };

    const calculateTotalDebt = (friend) => {
        return friend.transactions.reduce((total, transaction) => {
            if (transaction.type === 'debt') {
                return total + transaction.amount;
            } else if (transaction.type === 'payment') {
                return total - transaction.amount;
            }
            return total;
        }, 0);
    };

    const openTransactionModal = (friend) => {
        setSelectedFriend(friend);
        setIsTransactionModalVisible(true);
    };

    const closeTransactionModal = () => {
        setSelectedFriend(null);
        setIsTransactionModalVisible(false);
    };

    const filteredFriends = useMemo(() => {
        return friends
            .filter(friend =>
                friend.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                (filterType === 'all' ||
                    (filterType === 'debt' && calculateTotalDebt(friend) > 0) ||
                    (filterType === 'payment' && calculateTotalDebt(friend) < 0))
            )
            .sort((a, b) => {
                switch (sortBy) {
                    case 'amount':
                        return calculateTotalDebt(b) - calculateTotalDebt(a);
                    case 'recent':
                        return b.transactions[0]?.date - a.transactions[0]?.date;
                    default:
                        return a.name.localeCompare(b.name);
                }
            });
    }, [friends, searchQuery, sortBy, filterType]);

    const renderAddFriendModal = () => (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={() => setIsModalVisible(false)}>
            <View style={styles.addFriendModalOverlay}>
                <View style={styles.addFriendModalContent}>
                    <Text style={styles.addFriendModalTitle}>Add New Friend</Text>
                    <TextInput
                        mode="outlined"
                        label="Enter friend's name"
                        value={newFriendName}
                        onChangeText={setNewFriendName}
                        style={styles.addFriendModalInput}
                    />
                    <View style={styles.addFriendModalButtons}>
                        <Button
                            mode="contained"
                            onPress={handleAddFriend}
                            style={styles.addFriendModalButton}
                        >
                            Add
                        </Button>
                        <Button
                            mode="outlined"
                            onPress={() => setIsModalVisible(false)}
                            style={styles.addFriendModalButton}
                        >
                            Cancel
                        </Button>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderFriendItem = ({ item }) => {
        const totalDebt = calculateTotalDebt(item);
        return (
            <TouchableOpacity
                style={[styles.friendCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => openTransactionModal(item)}
            >
                <View style={styles.friendCardContent}>
                    <View style={styles.friendLeftContent}>
                        <Avatar.Icon size={40} icon="account" style={{ marginRight: 16 }} />
                        <View style={styles.friendInfo}>
                            <Text style={[styles.friendName, { color: theme.colors.onSurface }]}>
                                {item.name}
                            </Text>
                            <Text style={[
                                styles.totalDebt,
                                totalDebt >= 0 ? styles.positiveDebt : styles.negativeDebt
                            ]}>
                                ₺{Math.abs(totalDebt).toFixed(2)}
                            </Text>
                            <Text style={[styles.debtLabel, { color: theme.colors.onSurfaceVariant }]}>
                                {totalDebt >= 0 ? 'To receive' : 'To pay'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.friendRightContent}>
                        <TouchableOpacity
                            onPress={() => handleDeleteFriend(item.id)}
                            style={styles.deleteButton}
                        >
                            <List.Icon icon="delete" color={theme.colors.error} />
                        </TouchableOpacity>
                    </View>
                </View>
                {item.transactions.length > 0 && (
                    <View style={styles.recentActivity}>
                        <Text style={[styles.recentActivityTitle, { color: theme.colors.secondary }]}>
                            Recent Activity
                        </Text>
                        {item.transactions.slice(0, 2).map((transaction, index) => {
                            const date = transaction.date instanceof Date
                                ? transaction.date
                                : new Date(transaction.date);
                            return (
                                <Text key={index} style={[styles.recentTransactionText, { color: theme.colors.onSurfaceVariant }]}>
                                    {transaction.type === 'debt' ? '➕' : '➖'} ₺{transaction.amount.toFixed(2)}
                                    {' • '}
                                    {date.toLocaleDateString()}
                                </Text>
                            );
                        })}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderTransactionModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isTransactionModalVisible && selectedFriend !== null}
            onRequestClose={closeTransactionModal}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContainer}>
                <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                    {selectedFriend && (
                        <>
                            <View style={styles.transactionModalHeader}>
                                <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
                                    {selectedFriend.name}
                                </Text>
                                <Chip icon="currency-usd">
                                    {calculateTotalDebt(selectedFriend) >= 0
                                        ? `To receive: ₺${calculateTotalDebt(selectedFriend).toFixed(2)}`
                                        : `To pay: ₺${Math.abs(calculateTotalDebt(selectedFriend)).toFixed(2)}`
                                    }
                                </Chip>
                            </View>
                            <SegmentedButtons
                                value={activeTab}
                                onValueChange={setActiveTab}
                                buttons={[
                                    { value: 'add', label: 'Add', icon: 'plus' },
                                    { value: 'history', label: 'History', icon: 'history' }
                                ]}
                                style={{ marginBottom: 16 }}
                            />
                            {activeTab === 'add' ? (
                                <ScrollView
                                    contentContainerStyle={styles.addTransactionContainer}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    <TextInput
                                        mode="outlined"
                                        label="Enter amount I paid"
                                        value={debtAmount}
                                        onChangeText={setDebtAmount}
                                        keyboardType="numeric"
                                        style={styles.input}
                                    />
                                    <TextInput
                                        mode="outlined"
                                        label="Description (optional)"
                                        value={debtDescription}
                                        onChangeText={setDebtDescription}
                                        placeholder="What was this payment for?"
                                        style={styles.input}
                                    />
                                    <Button
                                        mode="contained"
                                        onPress={() => handleAddTransaction('debt')}
                                        style={styles.addTransactionButton}
                                    >
                                        Add Amount I Paid
                                    </Button>

                                    <TextInput
                                        mode="outlined"
                                        label="Enter amount they paid"
                                        value={paymentAmount}
                                        onChangeText={setPaymentAmount}
                                        keyboardType="numeric"
                                        style={styles.input}
                                    />
                                    <TextInput
                                        mode="outlined"
                                        label="Description (optional)"
                                        value={paymentDescription}
                                        onChangeText={setPaymentDescription}
                                        placeholder="What was this payment for?"
                                        style={styles.input}
                                    />
                                    <Button
                                        mode="contained"
                                        onPress={() => handleAddTransaction('payment')}
                                        style={styles.addTransactionButton}
                                    >
                                        Add Amount They Paid
                                    </Button>
                                </ScrollView>
                            ) : (
                                <ScrollView style={styles.transactionHistoryScroll}>
                                    {selectedFriend.transactions && selectedFriend.transactions.length > 0 ? (
                                        [...selectedFriend.transactions]
                                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                                            .map((transaction, index) => (
                                                <View key={transaction.id} style={styles.transactionHistoryItem}>
                                                    <View style={styles.transactionHistoryHeader}>
                                                        <View style={styles.transactionAmountContainer}>
                                                            <Text style={[
                                                                styles.transactionAmount,
                                                                { color: transaction.type === 'debt' ? theme.colors.error : theme.colors.primary }
                                                            ]}>
                                                                {transaction.type === 'debt' ? '+' : '-'} ₺{transaction.amount.toFixed(2)}
                                                            </Text>
                                                            <Text style={styles.transactionType}>
                                                                {transaction.type === 'debt' ? 'You paid' : 'They paid'}
                                                            </Text>
                                                        </View>
                                                        <TouchableOpacity
                                                            onPress={() => handleDeleteTransaction(transaction.id)}
                                                            style={styles.deleteTransactionButton}
                                                        >
                                                            <List.Icon icon="delete" color={theme.colors.error} size={20} />
                                                        </TouchableOpacity>
                                                    </View>
                                                    <Text style={styles.transactionDate}>
                                                        {new Date(transaction.date).toLocaleString()}
                                                    </Text>
                                                    {transaction.description && (
                                                        <Text style={styles.transactionDescription}>
                                                            {transaction.description}
                                                        </Text>
                                                    )}
                                                    {index !== selectedFriend.transactions.length - 1 && <Divider style={styles.transactionDivider} />}
                                                </View>
                                            ))
                                    ) : (
                                        <View style={styles.emptyTransactionContainer}>
                                            <Text style={styles.noTransactionsText}>No transactions yet</Text>
                                        </View>
                                    )}
                                </ScrollView>
                            )}
                            <Button
                                mode="outlined"
                                onPress={closeTransactionModal}
                                style={styles.closeModalButton}
                            >
                                Close
                            </Button>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true);
        await fetchFriends();
        setRefreshing(false);
    }, []);

    const showSnackbar = (message) => {
        setSnackbarMessage(message);
        setSnackbarVisible(true);
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View>
                <Text style={styles.headerTitle}>Track Debt</Text>
                <Text style={styles.headerSubtitle}>Manage your shared expenses</Text>
            </View>
            <TouchableOpacity
                style={styles.addFriendButton}
                onPress={() => setIsModalVisible(true)}
            >
                <List.Icon icon="account-plus" color="#fff" />
            </TouchableOpacity>
        </View>
    );

    return (
        <PaperProvider theme={theme}>
            <SafeAreaView style={styles.container} edges={['right', 'top', 'left']}>
                {renderHeader()}
                <Searchbar
                    placeholder="Search friends"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchBar}
                    inputStyle={styles.searchBarInput}
                />
                <View style={styles.filterContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <Chip
                            selected={filterType === 'all'}
                            onPress={() => setFilterType('all')}
                            style={styles.filterChip}
                        >
                            All
                        </Chip>
                        <Chip
                            selected={filterType === 'debt'}
                            onPress={() => setFilterType('debt')}
                            style={styles.filterChip}
                        >
                            To Receive
                        </Chip>
                        <Chip
                            selected={filterType === 'payment'}
                            onPress={() => setFilterType('payment')}
                            style={styles.filterChip}
                        >
                            To Pay
                        </Chip>
                    </ScrollView>
                </View>

                {loading ? (
                    <ActivityIndicator animating={true} style={styles.loadingIndicator} />
                ) : (
                    <FlatList
                        data={filteredFriends}
                        renderItem={renderFriendItem}
                        keyExtractor={item => item.id}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#1976d2']}
                            />
                        }
                        ListEmptyComponent={<Text style={styles.noFriendsText}>No friends added yet.</Text>}
                        ItemSeparatorComponent={() => <Divider style={styles.divider} />}
                    />
                )}
                {renderTransactionModal()}
                {renderAddFriendModal()}
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={3000}
                >
                    {snackbarMessage}
                </Snackbar>
                <Navbar />
            </SafeAreaView>
        </PaperProvider>
    );
};

export default TrackDebt;

const staticStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1976d2',
        padding: 24,
        paddingBottom: 30,
        paddingTop: 50,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    searchBar: {
        margin: 16,
        marginTop: -15,
        borderRadius: 12,
        elevation: 4,
        backgroundColor: '#fff',
    },
    searchBarInput: {
        fontSize: 16,
    },
    filterContainer: {
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    filterChip: {
        marginRight: 8,
        backgroundColor: '#fff',
    },
    friendCard: {
        margin: 8,
        marginHorizontal: 16,
        borderRadius: 16,
        elevation: 2,
        backgroundColor: '#fff',
    },
    friendCardContent: {
        padding: 16,
    },
    friendLeftContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    friendName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    totalDebt: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 4,
    },
    positiveDebt: {
        color: '#2e7d32',
    },
    negativeDebt: {
        color: '#d32f2f',
    },
    recentActivity: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
        marginTop: 12,
    },
    recentActivityTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 5,
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
        borderRadius: 16,
        padding: 20,
        elevation: 5,
    },
    modalInput: {
        marginBottom: 10,
    },
    modalButton: {
        marginTop: 16,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    noFriendsText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#666',
    },
    transactionsContainer: {
        padding: 20,
    },
    input: {
        marginBottom: 16,
    },
    transactionHistoryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    transactionItem: {
        paddingVertical: 5,
    },
    transactionDate: {
        fontSize: 12,
        color: '#666',
    },
    totalDebt: {
        fontSize: 14,
    },
    positiveDebt: {
        color: 'green',
    },
    negativeDebt: {
        color: 'red',
    },
    divider: {
        marginVertical: 5,
    },
    loadingIndicator: {
        marginTop: 20,
    },
    buttonLabel: {
        fontWeight: 'bold',
    },
    modalButtonLabel: {
        fontWeight: 'bold',
    },
    transactionModalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '90%',
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    closeModalButton: {
        marginTop: 20,
        borderRadius: 5,
    },
    noTransactionsText: {
        textAlign: 'center',
        marginVertical: 20,
        fontSize: 16,
        color: '#666',
    },
    swipeActions: {
        flexDirection: 'row',
    },
    swipeAction: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        height: '100%',
    },
    swipeActionText: {
        color: 'white',
        fontWeight: 'bold',
    },
    filterContainer: {
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    filterChip: {
        marginRight: 8,
    },
    searchBar: {
        elevation: 0,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    inputContainer: {
        marginBottom: 16,
    },
    transactionItem: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
    },
    friendLeftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    friendRightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deleteButton: {
        padding: 8,
    },
    modalScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 16,
    },
    transactionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    transactionDate: {
        fontSize: 12,
    },
    transactionDescription: {
        fontSize: 14,
        marginTop: 4,
    },
    transactionListContainer: {
        flex: 1,
        maxHeight: '70%',
    },
    transactionList: {
        flex: 1,
    },
    transactionListContent: {
        paddingVertical: 8,
    },
    emptyTransactionContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
    },
    deleteTransactionButton: {
        justifyContent: 'center',
    },
    transactionHistoryScroll: {
        maxHeight: '70%',
    },
    transactionHistoryItem: {
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.02)',
        borderRadius: 8,
        marginBottom: 8,
    },
    transactionHistoryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    transactionAmountContainer: {
        flexDirection: 'column',
    },
    transactionType: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    transactionDivider: {
        marginVertical: 8,
    },
    addFriendModalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    addFriendModalContent: {
        backgroundColor: 'white',
        width: '80%',
        padding: 20,
        borderRadius: 12,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    addFriendModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    addFriendModalInput: {
        marginBottom: 16,
    },
    addFriendModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    addFriendModalButton: {
        flex: 1,
    },
});

const getThemedStyles = (colors) => ({
    friendCard: {
        backgroundColor: colors.surface,
        margin: 16,
        padding: 16,
        borderRadius: 12,
        elevation: 2,
    },
    recentActivity: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.surfaceVariant,
    },
    friendCardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    friendInfo: {
        flex: 1,
    },
    recentActivityTitle: {
        fontSize: 12,
        color: colors.secondary,
        marginBottom: 4,
    },
    recentTransactionText: {
        fontSize: 12,
        color: colors.onSurfaceVariant,
        marginVertical: 2,
    },
    transactionModal: {
        backgroundColor: colors.surface,
        margin: 16,
        padding: 20,
        borderRadius: 16,
        maxHeight: '80%',
    },
    transactionModalHeader: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    debtLabel: {
        color: colors.onSurfaceVariant,
    },
    totalDebt: {
        fontSize: 14,
    },
    positiveDebt: {
        color: 'green',
    },
    negativeDebt: {
        color: 'red',
    },
    addTransactionContainer: {
        gap: 12,
    },
    input: {
        marginBottom: 8,
    },
    addTransactionButton: {
        marginBottom: 16,
    },
});