import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import * as Haptics from 'expo-haptics';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const NavbarItem = ({ route, icon, label, currentRoute, onPress }) => {
    const itemScale = useRef(new Animated.Value(1)).current;
    const itemOpacity = useRef(new Animated.Value(0)).current;
    const isActive = currentRoute === route;

    useEffect(() => {
        Animated.timing(itemOpacity, {
            toValue: isActive ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [isActive]);

    const onPressIn = () => {
        Animated.spring(itemScale, {
            toValue: 0.85,
            useNativeDriver: true,
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(itemScale, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const handlePress = () => {
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
    };

    return (
        <AnimatedTouchable
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={handlePress}
            style={[
                styles.navItem,
                {
                    transform: [{ scale: itemScale }],
                },
            ]}
        >
            <Animated.View
                style={[
                    styles.activeBackground,
                    {
                        opacity: itemOpacity,
                    },
                ]}
            />
            <Image 
                source={icon} 
                style={[
                    styles.navIcon,
                    isActive && styles.activeIcon
                ]} 
            />
            <Text style={[
                styles.navLabel,
                isActive && styles.activeLabel
            ]}>{label}</Text>
        </AnimatedTouchable>
    );
};

const Navbar = ({ state, navigation }) => {
    const insets = useSafeAreaInsets();

    const navItems = React.useMemo(() => [
        { route: 'DashBoard', icon: require('../../assets/dashboard/home.png'), label: 'Home' },
        { route: 'AddTransaction', icon: require('../../assets/dashboard/add.png'), label: 'Add' },
        { route: 'TrackDebt', icon: require('../../assets/dashboard/trackDebt.png'), label: 'Track Debt' },
        { route: 'ProfileScreen', icon: require('../../assets/dashboard/Profile.png'), label: 'Profile' },
    ], []);

    const currentRouteName = state.routes[state.index].name;

    return (
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
            {navItems.map((item) => (
                <NavbarItem
                    key={item.route}
                    {...item}
                    currentRoute={currentRouteName}
                    onPress={() => navigation.navigate(item.route)}
                />
            ))}
        </View>
    );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(Navbar);

const styles = StyleSheet.create({
    bottomNav: {
        position: 'absolute',
        bottom: '2%',
        left: '2%',
        right: '2%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(51, 51, 51, 0.95)',
        paddingTop: 10,
        paddingVertical: 12,
        // borderTopLeftRadius: 25,
        // borderTopRightRadius: 25,
        borderRadius: 25,
        shadowColor: '#1976d2',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 20,
        zIndex: 100,
        backdropFilter: 'blur(10px)',
        opacity: 0.7,

    },
    navItem: {
        alignItems: 'center',
        flex: 1,
        paddingVertical: 8,
        borderRadius: 16,
        position: 'relative',
    },
    activeBackground: {
        position: 'absolute',
        top: 0,
        left: '10%',
        right: '10%',
        bottom: 0,
        backgroundColor: 'rgba(0, 115, 255, 0.48)',
        borderRadius: 18,

    },
    navIcon: {
        width: 24,
        height: 24,
        marginBottom: 3,
        tintColor: '#f2f2f2',
        opacity: 0.7,
    },
    activeIcon: {
        tintColor: '#ffffff',
        opacity: 1,
    },
    navLabel: {
        fontSize: 13,
        color: '#f2f2f2',
        fontWeight: '600',
        opacity: 0.7,
    },
    activeLabel: {
        opacity: 1,
        transform: [{scale: 1.05}],
    },
});