import React, { useState } from 'react';
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
    const [isInConversation, setIsInConversation] = useState(false);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.brandTeal,
                tabBarInactiveTintColor: colors.textTertiary,
                tabBarShowLabel: false,
                tabBarItemStyle: {
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                tabBarStyle: isInConversation
                    ? { display: 'none' as const }
                    : {
                        position: 'absolute',
                        bottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : 20,
                        left: 40,
                        right: 40,
                        backgroundColor: colors.bgSecondary,
                        borderTopWidth: 0,
                        borderRadius: 30,
                        elevation: 10,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 10,
                        height: 60,
                        paddingBottom: 0,
                        paddingTop: 0,
                    },
            }}
        >
            <Tab.Screen
                name="Chats"
                children={() => <ChatScreen onLogout={onLogout} onConversationStateChange={setIsInConversation} />}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <FontAwesome5 name="comments" size={size} color={color} solid />
                    ),
                }}
            />
            <Tab.Screen
                name="Funil"
                children={() => <PipelineScreen onLogout={onLogout} />}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <FontAwesome5 name="filter" size={size} color={color} solid />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}
