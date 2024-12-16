import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TextInput,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
    PanResponder,
    Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import StyledButton from '../components/theme/styledButton';
import { theme } from '../components/theme/theme';

export default function DashboardScreen() {
    const navigation = useNavigation();
    const [user, setUser] = useState(null);
    const [remainingBudget, setRemainingBudget] = useState(0);
    const [isAddTransactionModalVisible, setAddTransactionModalVisible] = useState(false);
    const [newTransactionAmount, setNewTransactionAmount] = useState('');
    const [newTransactionCategory, setNewTransactionCategory] = useState('');
    const [askPayData, setAskPayData] = useState([]);
    const [isAskPayModalVisible, setIsAskPayModalVisible] = useState(false);
    const [newPersonName, setNewPersonName] = useState('');
    const [newPersonAmount, setNewPersonAmount] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isAddBudgetModalVisible, setIsAddBudgetModalVisible] = useState(false);
    const [newBudgetAmount, setNewBudgetAmount] = useState('');
    const [activeTab, setActiveTab] = useState('Dashboard'); // Active tab state
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [modalAnimation] = useState(new Animated.Value(0));

    const categories = [
        { id: 'food', icon: 'food', label: 'Food' },
        { id: 'transport', icon: 'car', label: 'Transport' },
        { id: 'shopping', icon: 'shopping', label: 'Shopping' },
        { id: 'bills', icon: 'file-document', label: 'Bills' },
        { id: 'entertainment', icon: 'movie', label: 'Entertainment' },
        { id: 'other', icon: 'dots-horizontal', label: 'Other' },
    ];

    useEffect(() => {
        const initializeAuthAndData = async () => {
            if (!auth) {
                console.warn('Auth object is not initialized yet.');
                setIsLoading(false);
                return;
            }

            const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
                try {
                    if (authUser) {
                        console.log('User authenticated:', authUser.uid);
                        setUser(authUser);

                        // Fetch user data
                        const userDocRef = doc(db, 'users', authUser.uid);
                        const userDocSnap = await getDoc(userDocRef);
                        if (userDocSnap.exists()) {
                            const userData = userDocSnap.data();
                            setRemainingBudget(userData.budget || 0);
                        }

                        // Set up transaction listener
                        const transactionsQuery = query(
                            collection(db, 'transactions'),
                            where('userId', '==', authUser.uid),
                            orderBy('createdAt', 'desc')
                        );

                        const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
                            const fetchedTransactions = snapshot.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            }));
                            // setTransactions(fetchedTransactions);
                            let totalSpent = 0;
                            fetchedTransactions.forEach(transaction => {
                                totalSpent += transaction.amount;
                            });
                            setRemainingBudget(prevBudget => prevBudget - totalSpent);
                        });

                        // Set up askPay listener
                        const askPayQuery = query(
                            collection(db, 'askPay'),
                            where('userId', '==', authUser.uid)
                        );

                        const unsubscribeAskPay = onSnapshot(askPayQuery, (snapshot) => {
                            const fetchedAskPayData = snapshot.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            }));
                            setAskPayData(fetchedAskPayData);
                        });

                        return () => {
                            unsubscribeTransactions();
                            unsubscribeAskPay();
                        };
                    } else {
                        console.log('No authenticated user');
                        setUser(null);
                        navigation.replace('Login');
                    }
                } catch (error) {
                    console.error('Error setting up data:', error);
                } finally {
                    setIsLoading(false);
                }
            });

            return () => unsubscribe();
        };

        initializeAuthAndData();
    }, [navigation]);

    const handleAddTransaction = async () => {
        if (!newTransactionAmount || !newTransactionCategory) {
            // Use platform-specific alerts
            if (Platform.OS === 'web') {
                window.alert('Please enter amount and category.');
            } else {
                Alert.alert('Error', 'Please enter amount and category.');
            }
            return;
        }

        try {
            const amount = parseFloat(newTransactionAmount);

            await addDoc(collection(db, 'transactions'), {
                userId: user.uid,
                amount: amount,
                category: newTransactionCategory,
                createdAt: new Date(),
            });

            setRemainingBudget(prevBudget => prevBudget - amount);
            setNewTransactionAmount('');
            setNewTransactionCategory('');
            setAddTransactionModalVisible(false);
        } catch (error) {
            console.error("Error adding transaction: ", error);
            if (Platform.OS === 'web') {
                window.alert('Failed to add transaction.');
            } else {
                Alert.alert('Error', 'Failed to add transaction.');
            }
        }
    };

    const handleAddPerson = async () => {
        if (!newPersonName || !newPersonAmount) {
            alert('Please enter name and amount.');
            return;
        }

        try {
            const amount = parseFloat(newPersonAmount);

            await addDoc(collection(db, 'askPay'), {
                userId: user.uid,
                name: newPersonName,
                amount: amount,
                createdAt: new Date(),
            });

            setNewPersonName('');
            setNewPersonAmount('');
            setIsAskPayModalVisible(false);
        } catch (error) {
            console.error("Error adding person: ", error);
            alert('Failed to add person.');
        }
    };

    const handleAddBudget = async () => {
        if (!newBudgetAmount) {
            if (Platform.OS === 'web') {
                window.alert('Please enter an amount.');
            } else {
                Alert.alert('Error', 'Please enter an amount.');
            }
            return;
        }

        try {
            const amount = parseFloat(newBudgetAmount);
            if (isNaN(amount) || amount <= 0) {
                if (Platform.OS === 'web') {
                    window.alert('Please enter a valid budget amount.');
                } else {
                    Alert.alert('Error', 'Please enter a valid budget amount.');
                }
                return;
            }

            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                await updateDoc(userDocRef, {
                    budget: amount
                });

                setRemainingBudget(amount);
                setNewBudgetAmount('');
                setIsAddBudgetModalVisible(false);
            }
        } catch (error) {
            console.error("Error adding budget: ", error);
            if (Platform.OS === 'web') {
                window.alert('Failed to add budget.');
            } else {
                Alert.alert('Error', 'Failed to add budget.');
            }
        }
    };


    const renderAskPayItem = ({ item }) => (
        <View style={styles.askPayItem}>
            <Text style={styles.askPayName}>{item.name}</Text>
            <Text style={styles.askPayAmount}>${parseFloat(item.amount).toFixed(2)}</Text>
        </View>
    );

    const openAddTransactionModal = () => setAddTransactionModalVisible(true);
    const closeAddTransactionModal = () => {
        setNewTransactionAmount('');
        setNewTransactionCategory('');
        setAddTransactionModalVisible(false);
    };

    const openAskPayModal = () => setIsAskPayModalVisible(true);
    const closeAskPayModal = () => {
        setNewPersonName('');
        setNewPersonAmount('');
        setIsAskPayModalVisible(false);
    };

    const openAddBudgetModal = () => setIsAddBudgetModalVisible(true);
    const closeAddBudgetModal = () => {
        setNewBudgetAmount('');
        setIsAddBudgetModalVisible(false);
    };

    // Function to handle tab changes
    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        // TODO: Implement navigation or content switching based on the active tab
        // Example:
        // if (tabName === 'Profile') {
        //     navigation.navigate('Profile'); 
        // } else if (tabName === 'Add Trans') {
        //     openAddTransactionModal();
        // } else if (tabName === 'Ask/Pay') {
        //     openAskPayModal();
        // }
    };

    const handleKeypadPress = (value) => {
        setNewTransactionAmount(current => {
            if (value === 'C') return '';
            if (value === '.' && current.includes('.')) return current;
            if (value === '⌫') return current.slice(0, -1);
            if (value === '.' && current === '') return '0.';
            return current + value;
        });
    };

    const getBudgetProgress = () => {
        const spent = remainingBudget > 0 ? remainingBudget : 0;
        const total = parseFloat(newBudgetAmount) || 100;
        return (spent / total) * 100;
    };

    const renderBudgetProgress = () => (
        <View style={styles.budgetProgressContainer}>
            <View style={styles.progressBar}>
                <Animated.View
                    style={[
                        styles.progressFill,
                        { width: `${getBudgetProgress()}%` }
                    ]}
                />
            </View>
            <Text style={styles.progressText}>
                {`${getBudgetProgress().toFixed(1)}% remaining`}
            </Text>
        </View>
    );

    const renderCategorySelector = () => (
        <View style={styles.categoryGrid}>
            {categories.map(category => (
                <TouchableOpacity
                    key={category.id}
                    style={[
                        styles.categoryItem,
                        selectedCategory?.id === category.id && styles.selectedCategory
                    ]}
                    onPress={() => {
                        setSelectedCategory(category);
                        setNewTransactionCategory(category.label);
                    }}
                >
                    <MaterialCommunityIcons
                        name={category.icon}
                        size={24}
                        color={selectedCategory?.id === category.id ?
                            theme.colors.white : theme.colors.text}
                    />
                    <Text style={[
                        styles.categoryLabel,
                        selectedCategory?.id === category.id && styles.selectedCategoryText
                    ]}>
                        {category.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    if (isLoading) {
        return (
            <View style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollContent}>
                <View style={styles.topContainer}>
                    <View style={styles.profileSection}>
                        {/* TODO: Add profile picture component */}
                        <TouchableOpacity style={styles.profilePicPlaceholder}>
                            <Text style={styles.profilePicText}>Pic</Text>
                        </TouchableOpacity>
                        <Text style={styles.userName}>{user?.email || 'User'}</Text>
                        <TouchableOpacity onPress={openAddBudgetModal}>
                            <Text style={styles.addBudgetLink}>Add Budget</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { /* TODO: Implement change password */ }}>
                            <Text style={styles.changePasswordLink}>Change Password</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.budgetSection}>
                        <Text style={styles.remainingBudgetText}>Remaining Budget</Text>
                        <View style={styles.remainingBudgetContainer}>
                            <Text style={styles.remainingBudgetValue}>${remainingBudget.toFixed(2)}</Text>
                        </View>
                        {renderBudgetProgress()}
                        {/* Keypad */}
                        <View style={styles.keypad}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', '0', '⌫'].map((value) => (
                                <TouchableOpacity
                                    key={value}
                                    style={styles.keypadButton}
                                    onPress={() => handleKeypadPress(value)}
                                >
                                    <Text style={styles.keypadButtonText}>{value}</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={styles.keypadButton}
                                onPress={() => handleKeypadPress('C')}
                            >
                                <Text style={styles.keypadButtonText}>C</Text>
                            </TouchableOpacity>
                        </View>
                        <StyledButton
                            title="Add Transaction"
                            onPress={openAddTransactionModal}
                            buttonStyle={styles.addTransactionButton}
                        />
                    </View>

                    <View style={styles.askPaySection}>
                        <Text style={styles.askPayTitle}>Ask/Pay</Text>
                        <ScrollView style={styles.askPayList}>
                            {askPayData.map((item) => (
                                <View key={item.id} style={styles.askPayItem}>
                                    <Text style={styles.askPayName}>{item.name}</Text>
                                    <Text style={styles.askPayAmount}>
                                        ${parseFloat(item.amount).toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>

                        <TouchableOpacity onPress={openAskPayModal} style={styles.addPeopleButton}>
                            <AntDesign name="plus" size={24} color={theme.colors.white} />
                            <Text style={styles.addPeopleButtonText}>Add People</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Fixed Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity
                    style={[styles.navButton, activeTab === 'Dashboard' && styles.activeNavButton]}
                    onPress={() => handleTabChange('Dashboard')}
                >
                    <Ionicons name="home-outline" size={24} color={activeTab === 'Dashboard' ? theme.colors.primary : theme.colors.text} />
                    <Text style={[styles.navButtonText, activeTab === 'Dashboard' && styles.activeNavButtonText]}>
                        Dashboard
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.navButton, activeTab === 'Add Trans' && styles.activeNavButton]}
                    onPress={() => handleTabChange('Add Trans')}
                >
                    <AntDesign name="pluscircleo" size={24} color={activeTab === 'Add Trans' ? theme.colors.primary : theme.colors.text} />
                    <Text style={[styles.navButtonText, activeTab === 'Add Trans' && styles.activeNavButtonText]}>
                        Add Trans
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.navButton, activeTab === 'Ask/Pay' && styles.activeNavButton]}
                    onPress={() => handleTabChange('Ask/Pay')}
                >
                    <Ionicons name="people-outline" size={24} color={activeTab === 'Ask/Pay' ? theme.colors.primary : theme.colors.text} />
                    <Text style={[styles.navButtonText, activeTab === 'Ask/Pay' && styles.activeNavButtonText]}>
                        Ask/Pay
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.navButton, activeTab === 'Profile' && styles.activeNavButton]}
                    onPress={() => handleTabChange('Profile')}
                >
                    <AntDesign name="user" size={24} color={activeTab === 'Profile' ? theme.colors.primary : theme.colors.text} />
                    <Text style={[styles.navButtonText, activeTab === 'Profile' && styles.activeNavButtonText]}>
                        Profile
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Add Transaction Modal */}
            <Modal
                visible={isAddTransactionModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeAddTransactionModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Amount"
                            value={newTransactionAmount}
                            onChangeText={setNewTransactionAmount}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Category (e.g., Bread)"
                            value={newTransactionCategory}
                            onChangeText={setNewTransactionCategory}
                        />
                        {renderCategorySelector()}
                        <StyledButton title="Add" onPress={handleAddTransaction} />
                        <TouchableOpacity onPress={closeAddTransactionModal} style={styles.closeModalButton}>
                            <AntDesign name="closecircleo" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Ask/Pay Modal */}
            <Modal
                visible={isAskPayModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeAskPayModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Person's Name"
                            value={newPersonName}
                            onChangeText={setNewPersonName}
                        />
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Amount"
                            value={newPersonAmount}
                            onChangeText={setNewPersonAmount}
                            keyboardType="numeric"
                        />
                        <StyledButton title="Add" onPress={handleAddPerson} />
                        <TouchableOpacity onPress={closeAskPayModal} style={styles.closeModalButton}>
                            <AntDesign name="closecircleo" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Add Budget Modal */}
            <Modal
                visible={isAddBudgetModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeAddBudgetModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter Budget Amount"
                            value={newBudgetAmount}
                            onChangeText={setNewBudgetAmount}
                            keyboardType="numeric"
                        />
                        <StyledButton title="Add Budget" onPress={handleAddBudget} />
                        <TouchableOpacity onPress={closeAddBudgetModal} style={styles.closeModalButton}>
                            <AntDesign name="closecircleo" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        flex: 1,
        padding: 20,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: theme.colors.primary,
        fontSize: theme.fonts.size.md,
    },
    topContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    profileSection: {
        flex: 1,
        marginRight: 10,
        alignItems: 'center',
    },
    profilePicPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.gray,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profilePicText: {
        fontSize: 18,
        color: theme.colors.white,
    },
    userName: {
        marginTop: 5,
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    addBudgetLink: {
        marginTop: 5,
        color: theme.colors.primary,
        fontSize: theme.fonts.size.sm,
    },
    changePasswordLink: {
        marginTop: 5,
        color: theme.colors.primary,
        fontSize: theme.fonts.size.sm,
    },
    budgetSection: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
        borderRadius: 10,
        padding: 10,
    },
    remainingBudgetText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    remainingBudgetContainer: {
        backgroundColor: 'white',
        borderRadius: 5,
        padding: 5,
        marginTop: 5,
        width: '100%',
    },
    remainingBudgetValue: {
        fontSize: 16,
        color: theme.colors.text,
        textAlign: 'center',
    },
    addTransactionButton: {
        marginTop: 10,
        backgroundColor: theme.colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
        width: "100%",
    },
    askPaySection: {
        flex: 1,
        marginLeft: 10,
    },
    askPayTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    askPayList: {
        maxHeight: 150,
        marginTop: 5,
    },
    askPayItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 5,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray,
    },
    askPayName: {
        fontSize: 16,
        color: theme.colors.text,
    },
    askPayAmount: {
        fontSize: 16,
        color: theme.colors.text,
    },
    addPeopleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    addPeopleButtonText: {
        color: theme.colors.white,
        marginLeft: 5,
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray,
        paddingVertical: 10,
        backgroundColor: theme.colors.white,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    navButton: {
        alignItems: 'center',
    },
    navButtonText: {
        fontSize: 12,
        color: theme.colors.text,
    },
    activeNavButton: {
        backgroundColor: theme.colors.lightPrimary,
        borderRadius: 10,
        padding: 5,
    },
    activeNavButtonText: {
        color: theme.colors.primary,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: theme.colors.white,
        padding: 20,
        borderRadius: 10,
        width: '80%',
        alignItems: 'center',
        transform: [{ scale: 0.95 }],
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalInput: {
        width: '100%',
        padding: 10,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: theme.colors.gray,
        borderRadius: 5,
    },
    closeModalButton: {
        marginTop: 15,
    },
    keypad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    keypadButton: {
        width: '30%',
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        marginVertical: 5,
        backgroundColor: theme.colors.white,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    keypadButtonText: {
        fontSize: 18,
        color: 'black',
    },
    budgetProgressContainer: {
        marginTop: 10,
        width: '100%',
    },
    progressBar: {
        height: 8,
        backgroundColor: theme.colors.gray,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary,
        borderRadius: 4,
    },
    progressText: {
        textAlign: 'center',
        marginTop: 5,
        fontSize: 12,
        color: theme.colors.text,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    categoryItem: {
        width: '30%',
        alignItems: 'center',
        padding: 10,
        marginBottom: 10,
        borderRadius: 8,
        backgroundColor: theme.colors.lightGray,
    },
    selectedCategory: {
        backgroundColor: theme.colors.primary,
    },
    categoryLabel: {
        marginTop: 5,
        fontSize: 12,
        color: theme.colors.text,
    },
    selectedCategoryText: {
        color: theme.colors.white,
    },
});