import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Modal, Pressable } from 'react-native';
import { Contact, CurrentUser } from '../../types/chat';

interface ContactListProps {
    contacts: Contact[];
    activeContactId: number;
    onSelectContact: (id: number) => void;
    currentUser: CurrentUser | null;
    onLogout?: () => void;
}

const ContactList: React.FC<ContactListProps> = ({ contacts, activeContactId, onSelectContact, currentUser, onLogout }) => {
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

    const totalUnread = contacts.reduce((sum, contact) => sum + contact.unread, 0);

    const filteredContacts = contacts.filter(c => {
        if (activeFilter === 'unread' && c.unread === 0) return false;
        if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.phone.includes(searchQuery)) return false;
        return true;
    });

    const getInitials = (name: string) => {
        if (!name) return 'US';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const userInitials = currentUser?.name || currentUser?.nome ? getInitials(currentUser.name || currentUser.nome || '') : 'US';

    const renderItem = ({ item }: { item: Contact }) => {
        const isActive = item.id === activeContactId;
        return (
            <TouchableOpacity
                style={[styles.contactItem, isActive && styles.activeContactItem]}
                onPress={() => onSelectContact(item.id)}
            >
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.initials}</Text>
                    </View>
                    {item.unread > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{item.unread}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.contactInfo}>
                    <View style={styles.contactHeaderRow}>
                        <Text style={styles.contactName} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.contactTime}>{item.time}</Text>
                    </View>
                    <Text style={styles.contactMessage} numberOfLines={1}>{item.lastMessage}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    const handleLogoutConfirm = () => {
        setIsLogoutModalVisible(false);
        if (onLogout) {
            onLogout();
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>Chat</Text>
                        {totalUnread > 0 && (
                            <View style={styles.totalUnreadBadge}>
                                <Text style={styles.totalUnreadText}>{totalUnread} Nova{totalUnread > 1 ? 's' : ''}</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity style={styles.userAvatarContainer} onPress={() => setIsLogoutModalVisible(true)}>
                        <Text style={styles.logoutText}>Sair</Text>
                        <View style={styles.userAvatar}>
                            <Text style={styles.userAvatarText}>{userInitials}</Text>
                            <View style={styles.onlineIndicator} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar conversas..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <View style={styles.filterTabs}>
                    <TouchableOpacity
                        style={[styles.filterButton, activeFilter === 'all' && styles.activeFilterButton]}
                        onPress={() => setActiveFilter('all')}
                    >
                        <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>Todas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, activeFilter === 'unread' && styles.activeFilterButton]}
                        onPress={() => setActiveFilter('unread')}
                    >
                        <Text style={[styles.filterText, activeFilter === 'unread' && styles.activeFilterText]}>Não Lidas</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={filteredContacts}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />

            {/* Logout Confirmation Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isLogoutModalVisible}
                onRequestClose={() => setIsLogoutModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Sair do Aplicativo</Text>
                        <Text style={styles.modalMessage}>Tem certeza que deseja desconectar da sua conta?</Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setIsLogoutModalVisible(false)}
                            >
                                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonConfirm]}
                                onPress={handleLogoutConfirm}
                            >
                                <Text style={styles.modalButtonTextConfirm}>Sim, Sair</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 8,
    },
    totalUnreadBadge: {
        backgroundColor: '#005f73',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    totalUnreadText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    userAvatarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutText: {
        fontSize: 14,
        color: '#dc3545',
        marginRight: 10,
        fontWeight: '600',
    },
    userAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#005f73',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    userAvatarText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#28a745',
        borderWidth: 2,
        borderColor: '#fff',
    },
    searchContainer: {
        marginBottom: 16,
    },
    searchInput: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        color: '#333',
    },
    filterTabs: {
        flexDirection: 'row',
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    activeFilterButton: {
        backgroundColor: '#005f73',
        borderColor: '#005f73',
    },
    filterText: {
        fontSize: 14,
        color: '#495057',
        fontWeight: '500',
    },
    activeFilterText: {
        color: '#fff',
    },
    listContainer: {
        flexGrow: 1,
        paddingHorizontal: 10,
        paddingTop: 10,
    },
    contactItem: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 0,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 8,
    },
    activeContactItem: {
        backgroundColor: '#e0f7ff',
    },
    avatarContainer: {
        marginRight: 12,
        position: 'relative',
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#ced4da',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#495057',
    },
    unreadBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#ee9b00',
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    unreadText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    contactInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    contactHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 8,
    },
    contactTime: {
        fontSize: 12,
        color: '#aaa',
    },
    contactMessage: {
        fontSize: 14,
        color: '#666',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12,
    },
    modalMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonCancel: {
        backgroundColor: '#f1f5f9',
    },
    modalButtonConfirm: {
        backgroundColor: '#dc3545',
    },
    modalButtonTextCancel: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    modalButtonTextConfirm: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    }
});

export default ContactList;
