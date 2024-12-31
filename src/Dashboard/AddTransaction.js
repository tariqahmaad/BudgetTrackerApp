import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Animated,
    Dimensions,
    Easing,
    StatusBar,
    Alert,
    Platform,
    Vibration,
} from 'react-native';
import {
    useTheme,
    Button,
    TouchableRipple,
    PaperProvider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    collection,
    addDoc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const windowHeight = Dimensions.get('window').height;
const windowWidth = Dimensions.get('window').width;

const TransactionPage = ({ navigation }) => {
    const theme = useTheme();
    const [amount, setAmount] = useState('');
    const [transactionType, setTransactionType] = useState('expense'); // 'expense' or 'income'
    const [loading, setLoading] = useState(false);
    const amountAnimation = useRef(new Animated.Value(1)).current;

    // Using the same primary color as the Dashboard's buttons
    const primaryColor = '#1976d2'; // You can also get this from the theme if you have it defined there

    // Simplified amount animation effect
    useEffect(() => {
        if (!amount) return;

        const animation = Animated.sequence([
            Animated.timing(amountAnimation, {
                toValue: 1.1,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(amountAnimation, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]);

        animation.start();

        return () => animation.stop();
    }, [amount]);

    const formatAmount = (value) => {
        // Remove any non-digit and non-decimal characters
        value = value.replace(/[^\d.]/g, '');
        
        // Ensure only one decimal point
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        
        // Limit to 2 decimal places
        if (parts.length === 2 && parts[1].length > 2) {
            value = parts[0] + '.' + parts[1].substring(0, 2);
        }

        return value;
    };

    const handleNumberPress = (number) => {
        if (Platform.OS === 'ios') {
            Vibration.vibrate(1);
        }

        let newAmount = amount + number;

        // Don't allow multiple decimal points
        if (number === '.' && amount.includes('.')) return;

        // Format the amount
        newAmount = formatAmount(newAmount);

        // Don't update if the result would be invalid
        if (newAmount === '') return;

        setAmount(newAmount);
    };

    const handleBackspacePress = () => {
        setAmount(prev => prev.slice(0, -1));
    };

    // Modify handleConfirmTransaction to handle navigation more gracefully
    const handleConfirmTransaction = async () => {
        if (!amount || loading) return;

        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            const now = new Date();
            const timestamp = Timestamp.fromDate(now);
            const numericAmount = parseFloat(parseFloat(amount).toFixed(2));
            
            const transactionData = {
                amount: numericAmount,
                type: transactionType,
                date: timestamp, // This ensures proper date storage
                description: `${transactionType === 'income' ? 'Income' : 'Expense'} Transaction`,
                userId: user.uid,
                createdAt: serverTimestamp(),
            };

            const transactionsRef = collection(db, 'users', user.uid, 'transactions');
            await addDoc(transactionsRef, transactionData);

            setAmount('');
            setLoading(false);
            navigation.goBack();
        } catch (error) {
            console.error('Transaction error:', error);
            setLoading(false);
            Alert.alert('Error', 'Failed to add transaction. Please try again.');
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>Add Transaction</Text>
                <Animated.Text 
                    style={[
                        styles.amountDisplay,
                        {
                            transform: [{ scale: amountAnimation }],
                        },
                    ]}
                >
                    {transactionType === 'income' ? '+' : '-'}₺ {amount || '0.00'}
                </Animated.Text>
                <View style={styles.transactionTypeContainer}>
                    <Button
                        mode={transactionType === 'expense' ? 'contained' : 'outlined'}
                        onPress={() => setTransactionType('expense')}
                        style={[styles.typeButton, { borderColor: primaryColor }]}
                        labelStyle={[
                            styles.typeButtonText,
                            transactionType === 'expense' && { color: theme.colors.surface },
                        ]}
                        buttonColor={transactionType === 'expense' ? primaryColor : undefined}
                    >
                        Expense
                    </Button>
                    <Button
                        mode={transactionType === 'income' ? 'contained' : 'outlined'}
                        onPress={() => setTransactionType('income')}
                        style={[styles.typeButton, { borderColor: primaryColor }]}
                        labelStyle={[
                            styles.typeButtonText,
                            transactionType === 'income' && { color: theme.colors.surface },
                        ]}
                        buttonColor={transactionType === 'income' ? primaryColor : undefined}
                    >
                        Income
                    </Button>
                </View>
            </View>
        </View>
    );

    return (
        <PaperProvider theme={theme}>
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="light-content" />
                {renderHeader()}

                <View style={styles.keypadContainer}>
                    <View style={styles.keypadWrapper}>
                        <View style={styles.keypad}>
                            {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['.', '0', '⌫']].map((row, rowIndex) => (
                                <View key={rowIndex} style={styles.row}>
                                    {row.map((key) => (
                                        <TouchableRipple
                                            key={key}
                                            onPress={() => key === '⌫' ? handleBackspacePress() : handleNumberPress(key)}
                                            style={[
                                                styles.key,
                                                key === '⌫' && styles.backspaceKey,
                                                { backgroundColor: theme.colors.surface },
                                            ]}
                                            borderless={true}
                                        >
                                            <Text
                                                style={[
                                                    styles.keyText,
                                                    key === '⌫' && styles.backspaceText,
                                                    { color: theme.colors.onSurface },
                                                ]}
                                            >
                                                {key}
                                            </Text>
                                        </TouchableRipple>
                                    ))}
                                </View>
                            ))}
                        </View>
                        <View style={styles.confirmButtonContainer}>
                            <Button
                                mode="contained"
                                onPress={handleConfirmTransaction}
                                style={[styles.confirmButton]}
                                labelStyle={[styles.confirmText, { color: theme.colors.surface }]}
                                disabled={!amount || loading}
                                buttonColor={primaryColor}
                            >
                                {loading ? 'Processing...' : 'Confirm'}
                            </Button>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </PaperProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    header: {
        backgroundColor: '#1976d2', // Primary color from your Dashboard
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingTop: 20,
        paddingBottom: 30,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
    headerContent: {
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff', // White text for contrast
        marginBottom: 10,
    },
    amountDisplay: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#fff', // White text for contrast
        marginBottom: 20,
    },
    transactionTypeContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        backgroundColor: 'rgba(255,255,255,0.2)', // Lighter shade for contrast
    },
    typeButton: {
        flex: 1,
        borderRadius: 8,
        margin: 4,
    },
    typeButtonText: {
        fontWeight: '600',
        color: '#1976d2', // Primary color for text
    },
    keypadContainer: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    keypadWrapper: {
        flex: 1,
        maxHeight: windowHeight * 0.55,
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    keypad: {
        flex: 1,
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8, // Reduced margin between rows
    },
    key: {
        width: windowWidth * 0.27, // Slightly larger keys
        height: windowWidth * 0.16, // Maintain aspect ratio
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.62,
        margin: 3, // Small margin to prevent keys from touching
    },
    backspaceKey: {
        backgroundColor: '#fff5f5', // Lighter red background
    },
    keyText: {
        fontSize: 28, // Larger text
        fontWeight: '500',
        color: '#424242', // Darker text for better contrast
    },
    backspaceText: {
        color: '#ef5350', // Slightly softer red
        fontSize: 24,
    },
    confirmButtonContainer: {
        width: '100%',
        paddingTop: 20,
        paddingBottom: 10,
    },
    confirmButton: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        marginBottom: 10,
    },
    confirmText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default TransactionPage;