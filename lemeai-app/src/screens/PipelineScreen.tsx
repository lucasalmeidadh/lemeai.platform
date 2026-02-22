import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Dimensions, RefreshControl, Alert, LayoutAnimation, UIManager, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '../services/api';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}
import { FontAwesome5 } from '@expo/vector-icons';
import { useAppTheme } from '../contexts/ThemeContext';
import { OpportunityService, Opportunity } from '../services/OpportunityService';
import ContactDetailsModal from '../components/Chat/ContactDetailsModal';
import SummaryModal from '../components/Chat/SummaryModal';
import TransferModal from '../components/Chat/TransferModal';
import ProfileModal from '../components/Chat/ProfileModal';
import { ChatService } from '../services/ChatService';
import { Contact, CurrentUser } from '../types/chat';

const API_URL = 'https://api.gbcode.com.br';

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

interface PipelineScreenProps {
    onLogout?: () => void;
}

export default function PipelineScreen({ onLogout }: PipelineScreenProps) {
    const { colors, theme, toggleTheme } = useAppTheme();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Summary modal state
    const [isSummaryModalVisible, setIsSummaryModalVisible] = useState(false);
    const [summaryContent, setSummaryContent] = useState('');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

    // Transfer modal state
    const [isTransferModalVisible, setIsTransferModalVisible] = useState(false);

    const [expandedSections, setExpandedSections] = useState<number[]>([COLUMNS[0].id]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [isProfileVisible, setIsProfileVisible] = useState(false);

    const fetchCurrentUser = useCallback(async () => {
        try {
            const response = await apiFetch(`${API_URL}/api/Auth/me`);
            if (response.ok) {
                const result = await response.json();
                if (result.sucesso && result.dados) {
                    const userId = result.dados.id || result.dados.userId || 0;
                    setCurrentUser({ id: userId, name: result.dados.userName || result.dados.nome });
                } else if (result.id) {
                    const userId = Number(result.id) || 0;
                    setCurrentUser({ id: userId, name: result.userName || result.nome });
                }
            }
        } catch (err) {
            console.error("Erro ao buscar currentUser:", err);
        }
    }, []);

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
        fetchCurrentUser();
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

    const toggleSection = (id: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedSections(prev =>
            prev.includes(id) ? prev.filter(colId => colId !== id) : [...prev, id]
        );
    };

    const handleCardPress = (opp: Opportunity) => {
        setSelectedOpp(opp);
        setIsModalVisible(true);
    };

    const handleGenerateSummary = async () => {
        if (!selectedOpp || isGeneratingSummary) return;

        setIsGeneratingSummary(true);
        setIsModalVisible(false);

        try {
            const response = await ChatService.getConversationSummary(selectedOpp.idConversa);
            if (response.sucesso) {
                setSummaryContent(response.dados);
                setIsSummaryModalVisible(true);
            } else {
                Alert.alert('Erro', response.mensagem || 'Erro ao gerar resumo.');
            }
        } catch (error) {
            console.error('Erro ao gerar resumo:', error);
            Alert.alert('Erro', 'Erro ao conectar com o serviço de IA.');
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleViewExistingSummary = (content: string) => {
        setSummaryContent(content);
        setIsSummaryModalVisible(true);
    };

    const handleTransferConversation = async (user: any) => {
        if (!selectedOpp) return;

        try {
            await ChatService.transferirConversa(selectedOpp.idConversa, user.id);
            Alert.alert('Sucesso', 'Conversa transferida com sucesso!');
            setIsTransferModalVisible(false);
            setIsModalVisible(false);
            setSelectedOpp(null);
            fetchOpportunities(true);
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Erro ao transferir conversa.');
        }
    };

    const renderCard = ({ item }: { item: Opportunity }) => {
        const initials = item.nomeContato ? item.nomeContato.charAt(0).toUpperCase() : '?';

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: colors.bgPrimary, borderColor: colors.borderColor }]}
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
        let columnOpps = opportunities.filter(opp => opp.idStauts === column.id);

        if (searchTerm.trim() !== '') {
            const query = searchTerm.toLowerCase();
            columnOpps = columnOpps.filter(opp =>
                (opp.nomeContato && opp.nomeContato.toLowerCase().includes(query)) ||
                (opp.nomeUsuarioResponsavel && opp.nomeUsuarioResponsavel.toLowerCase().includes(query))
            );
        }

        const totalValue = columnOpps.reduce((sum, opp) => sum + (opp.valor || 0), 0);
        const isExpanded = expandedSections.includes(column.id);

        return (
            <View style={[styles.accordionSection, { backgroundColor: colors.bgSecondary, borderColor: colors.borderColor }]}>
                <TouchableOpacity
                    style={[styles.accordionHeader, { borderLeftColor: column.color }]}
                    onPress={() => toggleSection(column.id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.accordionTitleRow}>
                        <Text style={[styles.columnTitle, { color: colors.textPrimary }]}>{column.title}</Text>
                        <View style={[styles.badge, { backgroundColor: colors.bgTertiary }]}>
                            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{columnOpps.length}</Text>
                        </View>
                    </View>

                    <View style={styles.accordionHeaderRight}>
                        <Text style={[styles.columnTotalText, { color: colors.textSecondary }]}>
                            {formatCurrency(totalValue)}
                        </Text>
                        <View style={{ width: 24, alignItems: 'center', marginLeft: 8 }}>
                            <FontAwesome5
                                name={isExpanded ? "chevron-up" : "chevron-down"}
                                size={14}
                                color={colors.textTertiary}
                            />
                        </View>
                    </View>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={[styles.accordionContent, { backgroundColor: colors.bgSecondary }]}>
                        {isLoading && !isRefreshing ? (
                            <View style={styles.centerContentSmall}>
                                <ActivityIndicator size="small" color={colors.brandTeal} />
                            </View>
                        ) : columnOpps.length === 0 ? (
                            <View style={styles.emptyContainerSmall}>
                                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>Nenhuma oportunidade.</Text>
                            </View>
                        ) : (
                            columnOpps.map(opp => <React.Fragment key={opp.idConversa}>{renderCard({ item: opp })}</React.Fragment>)
                        )}
                    </View>
                )}
            </View>
        );
    };

    const getInitials = (name: string) => {
        if (!name) return 'US';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const userInitials = currentUser?.name || currentUser?.nome ? getInitials(currentUser.name || currentUser.nome || '') : 'US';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bgSecondary }]} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <View style={styles.titleContainer}>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>Funil de Vendas</Text>
                    </View>
                    <View style={styles.headerRightControls}>
                        <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme}>
                            <FontAwesome5
                                name={theme === 'dark' ? 'sun' : 'moon'}
                                size={20}
                                color={colors.textSecondary}
                                solid={theme === 'dark'}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.userAvatarContainer} onPress={() => setIsProfileVisible(true)}>
                            <View style={[styles.userAvatar, { backgroundColor: colors.brandTeal }]}>
                                <Text style={styles.userAvatarText}>{userInitials}</Text>
                                <View style={[styles.onlineIndicator, { borderColor: colors.bgSecondary }]} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.filterContainer}>
                <View style={[styles.searchInputContainer, { backgroundColor: colors.bgPrimary, borderColor: colors.borderColor }]}>
                    <FontAwesome5 name="search" size={14} color={colors.textTertiary} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.textPrimary }]}
                        placeholder="Buscar oportunidade..."
                        placeholderTextColor={colors.textTertiary}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                        autoComplete="off"
                        importantForAutofill="no"
                        autoCorrect={false}
                    />
                    {searchTerm.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearSearchBtn}>
                            <FontAwesome5 name="times-circle" size={16} color={colors.textTertiary} />
                        </TouchableOpacity>
                    )}
                </View>
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
                    <FlatList
                        data={COLUMNS}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderColumn}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.accordionList}
                        refreshControl={
                            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.brandTeal]} />
                        }
                    />
                </>
            )}

            <ProfileModal
                visible={isProfileVisible}
                onClose={() => setIsProfileVisible(false)}
                onLogout={onLogout || (() => { })}
                userName={currentUser?.name || currentUser?.nome}
            />

            {selectedOpp && (
                <>
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
                        onUpdate={() => fetchOpportunities(true)}
                        onOpenSummary={handleGenerateSummary}
                        onViewExistingSummary={handleViewExistingSummary}
                        onOpenTransfer={() => {
                            setIsModalVisible(false);
                            setIsTransferModalVisible(true);
                        }}
                    />

                    <SummaryModal
                        visible={isSummaryModalVisible}
                        onClose={() => setIsSummaryModalVisible(false)}
                        summary={summaryContent}
                    />

                    <TransferModal
                        visible={isTransferModalVisible}
                        onClose={() => setIsTransferModalVisible(false)}
                        onTransfer={handleTransferConversation}
                    />
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    headerRightControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    themeToggleBtn: {
        padding: 8,
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
    filterContainer: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    clearSearchBtn: {
        padding: 8,
    },
    accordionList: {
        padding: 16,
        paddingTop: 8,
        paddingBottom: 100, // Extra padding for the floating tab bar
    },
    accordionSection: {
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    accordionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderLeftWidth: 4,
    },
    accordionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    accordionHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    columnTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
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
    accordionContent: {
        padding: 16,
        paddingTop: 8,
    },
    centerContentSmall: {
        padding: 20,
        alignItems: 'center',
    },
    emptyContainerSmall: {
        padding: 20,
        alignItems: 'center',
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
