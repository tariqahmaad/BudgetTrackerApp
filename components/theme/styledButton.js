import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from './theme';

const StyledButton = ({ title, onPress, buttonStyle, textStyle }) => {
    return (
        <TouchableOpacity style={[styles.button, buttonStyle]} onPress={onPress}>
            <Text style={[styles.text, textStyle]}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: theme.colors.primary,
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: theme.colors.white,
        fontWeight: 'bold',
    },
});

export default StyledButton;