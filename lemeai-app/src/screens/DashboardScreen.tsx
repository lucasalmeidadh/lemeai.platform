import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';

export default function DashboardScreen() {
    const { colors } = useAppTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Dashboard</Text>
            </View>
            <View style={styles.content}>
                <Text style={{ color: colors.textSecondary }}>Em construção: Indicadores e Métricas</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
        paddingTop: 50,
        backgroundColor: 'transparent',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
