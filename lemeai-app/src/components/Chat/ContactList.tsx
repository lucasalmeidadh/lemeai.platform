import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Contact, CurrentUser } from '../../types/chat';
import ProfileModal from './ProfileModal';
import { useAppTheme } from '../../contexts/ThemeContext';

interface ContactListProps {
    contacts: Contact[];
    activeContactId: number;
    onSelectContact: (id: number) => void;
    currentUser: CurrentUser | null;
    onLogout?: () => void;
}

const ContactList: React.FC<ContactListProps> = ({ contacts, activeContactId, onSelectContact, currentUser, onLogout }) => {
    const { colors } = useAppTheme();
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isProfileVisible, setIsProfileVisible] = useState(false);
    const searchInputRef = useRef<TextInput>(null);

    const handleOpenProfile = () => {
        searchInputRef.current?.blur();
        setSearchQuery('');
        setIsProfileVisible(true);
    };

    const handleCloseProfile = () => {
        setIsProfileVisible(false);
        setTimeout(() => setSearchQuery(''), 100);
    };

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

    const getMediaPreview = (message: string): { icon: string; label: string } | null => {
        const lower = message?.toLowerCase().trim() || '';
        if (lower === '[audio]' || lower === '[áudio]' || lower === 'áudio' || lower === 'audio') {
            return { icon: 'microphone', label: 'Mensagem de voz' };
        }
        if (lower === '[imagem]' || lower === '[image]' || lower === 'imagem' || lower === 'image') {
            return { icon: 'camera', label: 'Foto' };
        }
        if (lower === '[video]' || lower === '[vídeo]' || lower === 'vídeo' || lower === 'video') {
            return { icon: 'video', label: 'Vídeo' };
        }
        if (lower === '[documento]' || lower === '[document]' || lower === '[arquivo]') {
            return { icon: 'file-alt', label: 'Documento' };
        }
        return null;
    };

    const renderItem = ({ item }: { item: Contact }) => {
        const isActive = item.id === activeContactId;
        const media = getMediaPreview(item.lastMessage);
        return (
            <TouchableOpacity
                style={[styles.contactItem, { backgroundColor: colors.bgSecondary }, isActive && { backgroundColor: colors.brandTealLight }]}
                onPress={() => onSelectContact(item.id)}
            >
                <View style={styles.avatarContainer}>
                    <View style={[styles.avatar, { backgroundColor: colors.bgTertiary }]}>
                        <Text style={[styles.avatarText, { color: colors.textSecondary }]}>{item.initials}</Text>
                    </View>
                    {item.unread > 0 && (
                        <View style={[styles.unreadBadge, { borderColor: colors.bgSecondary }]}>
                            <Text style={styles.unreadText}>{item.unread}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.contactInfo}>
                    <View style={styles.contactHeaderRow}>
                        <Text style={[styles.contactName, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                        <Text style={[styles.contactTime, { color: colors.textTertiary }]}>{item.time}</Text>
                    </View>
                    {media ? (
                        <View style={styles.mediaPreview}>
                            <FontAwesome5 name={media.icon} size={12} color={colors.brandTeal} style={{ marginRight: 5 }} />
                            <Text style={[styles.mediaPreviewText, { color: colors.brandTeal }]}>{media.label}</Text>
                        </View>
                    ) : (
                        <Text style={[styles.contactMessage, { color: colors.textSecondary }]} numberOfLines={1}>{item.lastMessage}</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
            <View style={[styles.header, { borderBottomColor: colors.borderColorSoft }]}>
                <View style={styles.headerTopRow}>
                    <View style={styles.titleContainer}>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>Chat</Text>
                        {totalUnread > 0 && (
                            <View style={[styles.totalUnreadBadge, { backgroundColor: colors.brandTeal }]}>
                                <Text style={styles.totalUnreadText}>{totalUnread} Nova{totalUnread > 1 ? 's' : ''}</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity style={styles.userAvatarContainer} onPress={handleOpenProfile}>
                        <View style={[styles.userAvatar, { backgroundColor: colors.brandTeal }]}>
                            <Text style={styles.userAvatarText}>{userInitials}</Text>
                            <View style={[styles.onlineIndicator, { borderColor: colors.bgSecondary }]} />
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <TextInput
                        ref={searchInputRef}
                        style={[styles.searchInput, { backgroundColor: colors.bgPrimary, borderColor: colors.borderColorSoft, color: colors.textPrimary }]}
                        placeholder="Buscar conversas..."
                        placeholderTextColor={colors.textTertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoComplete="off"
                        importantForAutofill="no"
                        autoCorrect={false}
                    />
                </View>

                <View style={styles.filterTabs}>
                    <TouchableOpacity
                        style={[styles.filterButton, { backgroundColor: colors.bgSecondary, borderColor: colors.borderColor }, activeFilter === 'all' && { backgroundColor: colors.brandTeal, borderColor: colors.brandTeal }]}
                        onPress={() => setActiveFilter('all')}
                    >
                        <Text style={[styles.filterText, { color: colors.textSecondary }, activeFilter === 'all' && styles.activeFilterText]}>Todas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, { backgroundColor: colors.bgSecondary, borderColor: colors.borderColor }, activeFilter === 'unread' && { backgroundColor: colors.brandTeal, borderColor: colors.brandTeal }]}
                        onPress={() => setActiveFilter('unread')}
                    >
                        <Text style={[styles.filterText, { color: colors.textSecondary }, activeFilter === 'unread' && styles.activeFilterText]}>Não Lidas</Text>
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

            <ProfileModal
                visible={isProfileVisible}
                onClose={handleCloseProfile}
                onLogout={onLogout || (() => { })}
                userName={currentUser?.name || currentUser?.nome}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
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
        marginRight: 8,
    },
    totalUnreadBadge: {
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
    userAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
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
    },
    searchContainer: {
        marginBottom: 16,
    },
    searchInput: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
    },
    filterTabs: {
        flexDirection: 'row',
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    filterText: {
        fontSize: 14,
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
        borderRadius: 12,
        marginBottom: 8,
    },
    avatarContainer: {
        marginRight: 12,
        position: 'relative',
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: '600',
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
        flex: 1,
        marginRight: 8,
    },
    contactTime: {
        fontSize: 12,
    },
    contactMessage: {
        fontSize: 14,
    },
    mediaPreview: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mediaPreviewText: {
        fontSize: 14,
        fontWeight: '500',
    },
});

export default ContactList;
