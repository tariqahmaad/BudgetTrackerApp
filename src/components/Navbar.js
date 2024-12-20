import React from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';

const Navbar = ({ navigation }) => {
    return (
        <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
                <Image source={require('../../assets/dashboard/home.png')} style={styles.navIcon} />
                <Text style={styles.navLabel}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Add')}>
                <Image source={require('../../assets/dashboard/add.png')} style={styles.navIcon} />
                <Text style={styles.navLabel}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('TrackDebt')}>
                <Image source={require('../../assets/dashboard/trackDebt.png')} style={styles.navIcon} />
                <Text style={styles.navLabel}>Track Debt</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
                <Image source={require('../../assets/dashboard/Profile.png')} style={styles.navIcon} />
                <Text style={styles.navLabel}>Profile</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#333',
        paddingVertical: 10,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        zIndex: 100, // Ensure the Navbar is above other content
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
});

export default Navbar;