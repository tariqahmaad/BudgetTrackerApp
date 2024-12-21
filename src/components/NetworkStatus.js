import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const NetworkStatus = () => {
    const [isConnected, setIsConnected] = useState(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected);
        });

        return () => unsubscribe();
    }, []);

    if (isConnected) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.text}>No Internet Connection</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f44336',
        padding: 10,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 999,
    },
    text: {
        color: 'white',
        textAlign: 'center',
        fontSize: 14,
    },
});

export default NetworkStatus;
