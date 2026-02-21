import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { apiFetch } from '../../services/api';
import { useAppTheme } from '../../contexts/ThemeContext';

interface InternalUser {
    id: number;
    name: string;
    avatar: string;
    online: boolean;
}

interface TransferModalProps {
    visible: boolean;
    onClose: () => void;
    onTransfer: (user: InternalUser) => void;
    currentUserId?: number;
}

const API_URL = 'https://api.gbcode.com.br';

const TransferModal: React.FC<TransferModalProps> = ({ visible, onClose, onTransfer, currentUserId }) => {
    const { colors } = useAppTheme();
    const [users, setUsers] = useState<InternalUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible) return;

        const fetchUsers = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await apiFetch(`${API_URL}/api/Chat/Conversas/BuscarUsuariosTranferencia`);

                if (!response.ok) {
                    throw new Error('Falha ao carregar usuários');
                }

                const data = await response.json();

                if (data.sucesso) {
                    const mappedUsers: InternalUser[] = data.dados.map((u: any) => ({
                        id: u.userId,
                        name: u.userName,
                        avatar: u.userName.charAt(0).toUpperCase() + (u.userName.split(' ')[1]?.[0]?.toUpperCase() || ''),
                        online: !u.userDeleted
                    }));
                    const filtered = mappedUsers.filter((u: any) => !u.userDeleted);
                    setUsers(filtered);
                } else {
                    throw new Error(data.mensagem || 'Erro desconhecido');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [visible]);

    const visibleUsers = currentUserId ? users.filter(u => u.id !== currentUserId) : users;

    const renderUser = ({ item }: { item: InternalUser }) => (
        <View style={[styles.userItem, { borderBottomColor: colors.borderColor }]}>
            <View style={styles.userInfo}>
                <View style={[styles.avatar, { backgroundColor: colors.brandTealLight }]}>
                    <Text style={[styles.avatarText, { color: colors.brandTeal }]}>{item.avatar}</Text>
                </View>
                <View style={styles.userDetails}>
                    <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.userStatus, { color: item.online ? '#10b981' : colors.textTertiary }]}>
                        {item.online ? '• Ativo' : '• Inativo'}
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                style={[styles.transferButton, { backgroundColor: colors.bgTertiary }]}
                onPress={() => onTransfer(item)}
            >
                <Text style={[styles.transferButtonText, { color: colors.brandTeal }]}>Transferir</Text>
                <FontAwesome5 name="exchange-alt" size={12} color={colors.brandTeal} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity style={[styles.modalContent, { backgroundColor: colors.bgSecondary }]} activeOpacity={1}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.borderColor }]}>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Transferir Conversa</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <FontAwesome5 name="times" size={16} color={colors.textTertiary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalBody}>
                        {isLoading ? (
                            <View style={styles.centerContent}>
                                <ActivityIndicator size="large" color={colors.brandTeal} />
                                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando usuários...</Text>
                            </View>
                        ) : error ? (
                            <View style={styles.centerContent}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : visibleUsers.length === 0 ? (
                            <View style={styles.centerContent}>
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum usuário disponível.</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={visibleUsers}
                                keyExtractor={item => item.id.toString()}
                                renderItem={renderUser}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.listContainer}
                            />
                        )}
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxHeight: '80%',
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        flexGrow: 1,
        minHeight: 200,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    errorText: {
        color: '#dc3545',
        fontSize: 14,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
    },
    listContainer: {
        paddingBottom: 16,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    userStatus: {
        fontSize: 12,
        fontWeight: '500',
    },
    transferButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 12,
    },
    transferButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
});

export default TransferModal;
