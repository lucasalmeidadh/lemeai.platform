import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { AuthService } from '../services/AuthService';
import { CurrentUser } from '../types/chat';

interface DashboardScreenProps {
    user: CurrentUser;
    onLogout: () => void;
}

export default function DashboardScreen({ user, onLogout }: DashboardScreenProps) {
    const handleLogout = async () => {
        await AuthService.logout();
        onLogout();
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.dashboardContainer}>
                <Text style={styles.welcomeText}>Bem-vindo, {user.name || user.nome}!</Text>
                <Text style={styles.subText}>Você está conectado ao LemeAI Mobile.</Text>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Sair</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    dashboardContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    subText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 32,
        textAlign: 'center',
    },
    logoutButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        backgroundColor: '#dc3545',
        borderRadius: 8,
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
