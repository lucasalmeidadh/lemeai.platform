import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../contexts/ThemeContext';

import ChatScreen from '../screens/ChatScreen';
import PipelineScreen from '../screens/PipelineScreen';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator({ onLogout }: { onLogout: () => void }) {
    const { colors } = useAppTheme();
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.brandTeal,
                tabBarInactiveTintColor: colors.textTertiary,
                tabBarStyle: {
                    backgroundColor: colors.bgSecondary,
                    borderTopColor: colors.borderColor,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    height: (Platform.OS === 'ios' ? 88 : 60) + insets.bottom,
                    paddingBottom: (Platform.OS === 'ios' ? 28 : 10) + insets.bottom,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
                },
            }}
        >
            <Tab.Screen
                name="Chats"
                children={() => <ChatScreen onLogout={onLogout} />}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <FontAwesome5 name="comments" size={size} color={color} solid />
                    ),
                }}
            />
            <Tab.Screen
                name="Funil"
                component={PipelineScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <FontAwesome5 name="filter" size={size} color={color} solid />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}
