import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/colors';

type Props = { message: string | null; onDismiss: () => void };

export default function FeedbackToast({ message, onDismiss }: Props) {
    useEffect(() => {
        if (!message) return;
        const timeout = setTimeout(onDismiss, 1800);
        return () => clearTimeout(timeout);
    }, [message, onDismiss]);

    if (!message) return null;

    return (
        <View pointerEvents="none" style={styles.container}>
            <Text style={styles.message}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 64,
        alignSelf: 'center',
        backgroundColor: COLORS.surface.secondary,
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 11,
        zIndex: 10,
        elevation: 8,
    },
    message: { color: COLORS.text.main, fontSize: 14, fontWeight: '600' },
});
