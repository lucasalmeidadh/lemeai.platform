import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAppTheme } from '../contexts/ThemeContext';
import { OpportunityService, Opportunity } from '../services/OpportunityService';
import ContactDetailsModal from '../components/Chat/ContactDetailsModal';
import { Contact } from '../types/chat';

const { width } = Dimensions.get('window');

// Status IDs baseados no backend
const COLUMNS = [
    { id: 1, title: 'Atendimento IA', color: '#8b5cf6' },
    { id: 2, title: 'Não Iniciado', color: '#64748b' },
    { id: 5, title: 'Em Negociação', color: '#f59e0b' },
    { id: 4, title: 'Proposta Enviada', color: '#3b82f6' },
    { id: 3, title: 'Venda Fechada', color: '#10b981' },
    { id: 6, title: 'Venda Perdida', color: '#ef4444' },
];

export default function PipelineScreen() {
    const { colors } = useAppTheme();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const flatListRef = useRef<FlatList>(null);
    const paginationRef = useRef<FlatList>(null);
    const [activeColumnIndex, setActiveColumnIndex] = useState(0);
    const isManualScroll = useRef(false);

    const fetchOpportunities = async (isRefetch = false) => {
        if (!isRefetch) setIsLoading(true);
        setError(null);
        try {
            const data = await OpportunityService.getAllOpportunities();
            setOpportunities(data);
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar funil de vendas');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOpportunities();
    }, []);

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchOpportunities(true);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const handleScroll = (event: any) => {
        if (isManualScroll.current) return;

        const xOffset = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(xOffset / width);
        if (newIndex !== activeColumnIndex && newIndex >= 0 && newIndex < COLUMNS.length) {
            setActiveColumnIndex(newIndex);
            try {
                paginationRef.current?.scrollToIndex({ index: newIndex, animated: true, viewPosition: 0.5 });
            } catch (e) {
                // Ignore scroll errors on unmounted/unmeasured lists
            }
        }
    };

    const handleTabPress = (index: number) => {
        isManualScroll.current = true;
        setActiveColumnIndex(index);

        try {
            flatListRef.current?.scrollToIndex({ index, animated: true });
            paginationRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
        } catch (e) {
            // Ignore
        }

        // Release lock shortly after animation
        setTimeout(() => {
            isManualScroll.current = false;
        }, 500);
    };

    const handleCardPress = (opp: Opportunity) => {
        setSelectedOpp(opp);
        setIsModalVisible(true);
    };

    const renderCard = ({ item }: { item: Opportunity }) => {
        const initials = item.nomeContato ? item.nomeContato.charAt(0).toUpperCase() : '?';

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.bgSecondary, borderColor: colors.borderColor }]}
                onPress={() => handleCardPress(item)}
            >
                <View style={[styles.cardHeader, { borderBottomColor: colors.borderColor }]}>
                    <View style={styles.cardInfo}>
                        <View style={[styles.avatar, { backgroundColor: colors.brandTealLight }]}>
                            <Text style={[styles.avatarText, { color: colors.brandTeal }]}>{initials}</Text>
                        </View>
                        <Text style={[styles.contactName, { color: colors.textPrimary }]} numberOfLines={1}>
                            {item.nomeContato || 'Desconhecido'}
                        </Text>
                    </View>
                </View>
                <View style={styles.cardBody}>
                    <View style={styles.cardRow}>
                        <FontAwesome5 name="dollar-sign" size={12} color={colors.brandTeal} style={{ width: 16 }} />
                        <Text style={[styles.cardValue, { color: colors.textSecondary }]}>{formatCurrency(item.valor || 0)}</Text>
                    </View>
                    <View style={styles.cardRow}>
                        <FontAwesome5 name="user" size={12} color={colors.textTertiary} style={{ width: 16 }} />
                        <Text style={[styles.cardUser, { color: colors.textTertiary }]} numberOfLines={1}>
                            {item.nomeUsuarioResponsavel || 'Sem responsável'}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderColumn = ({ item: column }: { item: typeof COLUMNS[0] }) => {
        const columnOpps = opportunities.filter(opp => opp.idStauts === column.id);
        const totalValue = columnOpps.reduce((sum, opp) => sum + (opp.valor || 0), 0);

        return (
            <View style={[styles.column, { backgroundColor: colors.bgTertiary, width: width }]}>
                <View style={[styles.columnHeader, { borderTopColor: column.color }]}>
                    <View style={styles.columnTitleRow}>
                        <View style={[styles.columnDot, { backgroundColor: column.color }]} />
                        <Text style={[styles.columnTitle, { color: colors.textPrimary }]}>{column.title}</Text>
                        <View style={[styles.badge, { backgroundColor: colors.bgSecondary }]}>
                            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{columnOpps.length}</Text>
                        </View>
                    </View>
                    <Text style={[styles.columnTotalText, { color: colors.textSecondary }]}>
                        {formatCurrency(totalValue)}
                    </Text>
                </View>

                {isLoading && !isRefreshing ? (
                    <View style={styles.centerContent}>
                        <ActivityIndicator size="large" color={colors.brandTeal} />
                    </View>
                ) : (
                    <FlatList
                        data={columnOpps}
                        keyExtractor={(item) => item.idConversa.toString()}
                        renderItem={renderCard}
                        contentContainerStyle={styles.cardList}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.brandTeal]} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <FontAwesome5 name="inbox" size={32} color={colors.borderColor} style={{ marginBottom: 16 }} />
                                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Nenhuma oportunidade.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Funil de Vendas</Text>
            </View>

            {error ? (
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.brandTeal }]} onPress={() => fetchOpportunities()}>
                        <Text style={styles.retryText}>Tentar Novamente</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* Header Paginador / Indicador de Coluna Ativa */}
                    <View style={styles.paginationHeader}>
                        <FlatList
                            ref={paginationRef}
                            data={COLUMNS}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={i => i.id.toString()}
                            renderItem={({ item, index }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.paginationTab,
                                        index === activeColumnIndex && { borderBottomColor: item.color, borderBottomWidth: 2 }
                                    ]}
                                    onPress={() => handleTabPress(index)}
                                >
                                    <Text style={[
                                        styles.paginationTabText,
                                        { color: index === activeColumnIndex ? colors.textPrimary : colors.textTertiary },
                                        index === activeColumnIndex && { fontWeight: 'bold' }
                                    ]}>{item.title}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>

                    <FlatList
                        ref={flatListRef}
                        data={COLUMNS}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderColumn}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        getItemLayout={(data, index) => (
                            { length: width, offset: width * index, index }
                        )}
                    />
                </>
            )}

            {selectedOpp && (
                <ContactDetailsModal
                    visible={isModalVisible}
                    onClose={() => setIsModalVisible(false)}
                    contact={{
                        id: selectedOpp.idConversa,
                        name: selectedOpp.nomeContato,
                        phone: selectedOpp.numeroWhatsapp,
                        initials: selectedOpp.nomeContato ? selectedOpp.nomeContato.charAt(0).toUpperCase() : '?',
                        statusId: selectedOpp.idStauts,
                        detailsValue: selectedOpp.valor,
                        // Dummy fields needed for Contact interface
                        unreadCount: 0,
                        unread: 0,
                        message: '',
                        lastMessage: '',
                        time: '',
                        isOnline: false,
                        avatar: '',
                        platform: 'whatsapp',
                    } as unknown as Contact}
                    onUpdate={() => fetchOpportunities(true)} // Refetch pipeline on update
                />
            )}
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
    paginationHeader: {
        height: 40,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    paginationTab: {
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    paginationTabText: {
        fontSize: 14,
    },
    column: {
        flex: 1,
        height: '100%',
    },
    columnHeader: {
        padding: 16,
        borderTopWidth: 3,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    columnTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    columnDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    columnTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    columnTotalText: {
        fontSize: 14,
        fontWeight: '600',
    },
    cardList: {
        padding: 16,
        paddingBottom: 40, // Space for bottom tabs
    },
    card: {
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardHeader: {
        padding: 12,
        borderBottomWidth: 1,
    },
    cardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    contactName: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
    cardBody: {
        padding: 12,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 14,
        fontWeight: '500',
    },
    cardUser: {
        fontSize: 12,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 15,
    },
    errorText: {
        color: '#ef4444',
        marginBottom: 16,
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});
