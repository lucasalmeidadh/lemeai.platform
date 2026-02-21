import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAppTheme } from '../../contexts/ThemeContext';
import { DetailsService } from '../../services/DetailsService';
import { ChatService } from '../../services/ChatService';
import type { Detail } from '../../types/Details';
import type { Contact } from '../../types/chat';

interface ContactDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    contact: Contact;
    onUpdate?: () => void;
    onOpenSummary?: () => void;
    onViewExistingSummary?: (content: string) => void;
    onOpenTransfer?: () => void;
}

const ContactDetailsModal: React.FC<ContactDetailsModalProps> = ({ visible, onClose, contact, onUpdate, onOpenSummary, onViewExistingSummary, onOpenTransfer }) => {
    const { colors } = useAppTheme();
    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

    const [status, setStatus] = useState(contact.statusId ? String(contact.statusId) : '2');
    const [dealValue, setDealValue] = useState(contact.detailsValue ? String(contact.detailsValue) : '');
    const [newNote, setNewNote] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const [observations, setObservations] = useState<Detail[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);

    const formatCurrencyDisplay = (value: string) => {
        const onlyDigits = value.replace(/\D/g, '');
        if (!onlyDigits) return '';
        const numberValue = Number(onlyDigits) / 100;
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(numberValue);
    };

    const handleValueChange = (text: string) => {
        setDealValue(formatCurrencyDisplay(text));
        setIsDirty(true);
    };

    useEffect(() => {
        if (visible && contact) {
            setStatus(contact.statusId ? String(contact.statusId) : '2');
            setDealValue(contact.detailsValue ? formatCurrencyDisplay(String(contact.detailsValue)) : '');
            setNewNote('');
            setIsDirty(false);
            if (activeTab === 'history') {
                fetchObservations();
            }
        }
    }, [visible, contact, activeTab]);

    const fetchObservations = useCallback(async () => {
        if (!contact) return;
        setIsLoadingHistory(true);
        setHistoryError(null);

        try {
            const data = await DetailsService.getDetailsByConversationId(contact.id);
            setObservations(data);
        } catch (err: any) {
            setHistoryError(err.message);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [contact]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            let valor = 0;
            const onlyDigits = dealValue.replace(/\D/g, '');
            if (onlyDigits) {
                valor = Number(onlyDigits) / 100;
            }

            const previousValue = contact.detailsValue || 0;
            let descriptionToSend = newNote;

            if (valor !== previousValue) {
                const formattedPrevious = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(previousValue);
                const formattedNew = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
                const autoNote = `Alteração de valor: De ${formattedPrevious} para ${formattedNew}`;

                if (descriptionToSend.trim()) {
                    descriptionToSend += `\n\n${autoNote}`;
                } else {
                    descriptionToSend = autoNote;
                }
            }

            await DetailsService.addDetail({
                idConversa: contact.id,
                descricao: descriptionToSend,
                statusNegociacaoId: parseInt(status),
                valor: valor
            });

            setNewNote('');
            setIsDirty(false);

            if (activeTab === 'history') {
                fetchObservations();
            }

            if (onUpdate) {
                onUpdate();
            }

            Alert.alert('Sucesso', 'Alterações salvas com sucesso!');
        } catch (error: any) {
            Alert.alert('Erro', `Erro ao salvar observação: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    const renderDetailsTab = () => (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <View style={styles.contactSummary}>
                <View style={[styles.avatar, { backgroundColor: colors.brandTealLight }]}>
                    <Text style={[styles.avatarText, { color: colors.brandTeal }]}>{contact.initials}</Text>
                </View>
                <Text style={[styles.contactName, { color: colors.textPrimary }]}>{contact.name}</Text>
                <View style={styles.phoneRow}>
                    <FontAwesome5 name="phone-alt" size={12} color={colors.textSecondary} />
                    <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>{contact.phone || 'Sem telefone'}</Text>
                </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.bgTertiary }]}>
                <View style={styles.formGroup}>
                    <View style={styles.labelRow}>
                        <FontAwesome5 name="tag" size={14} color={colors.brandTeal} />
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Status da Negociação</Text>
                    </View>
                    {/* Simplified picker for React Native, typically we'd use @react-native-picker/picker but doing simple buttons for now or basic generic picker */}
                    <View style={styles.statusGroup}>
                        {[
                            { id: '1', label: 'Atendimento IA' },
                            { id: '2', label: 'Não Iniciado' },
                            { id: '5', label: 'Em Negociação' },
                            { id: '4', label: 'Proposta Enviada' },
                            { id: '3', label: 'Venda Fechada' },
                            { id: '6', label: 'Venda Perdida' },
                        ].map(s => (
                            <TouchableOpacity
                                key={s.id}
                                style={[
                                    styles.statusChip,
                                    status === s.id ? { backgroundColor: colors.brandTeal } : { backgroundColor: colors.bgSecondary, borderColor: colors.borderColor, borderWidth: 1 }
                                ]}
                                onPress={() => { setStatus(s.id); setIsDirty(true); }}
                            >
                                <Text style={[
                                    styles.statusChipText,
                                    status === s.id ? { color: '#ffffff' } : { color: colors.textSecondary }
                                ]}>{s.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <View style={styles.labelRow}>
                        <FontAwesome5 name="dollar-sign" size={14} color={colors.brandTeal} />
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Valor</Text>
                    </View>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.borderColor }]}
                        value={dealValue}
                        onChangeText={handleValueChange}
                        placeholder="R$ 0,00"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.bgTertiary }]}>
                <View style={[styles.formGroup, { marginBottom: 0 }]}>
                    <View style={styles.labelRow}>
                        <FontAwesome5 name="sticky-note" size={14} color={colors.brandTeal} />
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Adicionar Observação</Text>
                    </View>
                    <TextInput
                        style={[styles.textArea, { backgroundColor: colors.bgSecondary, color: colors.textPrimary, borderColor: colors.borderColor }]}
                        value={newNote}
                        onChangeText={(text) => { setNewNote(text); setIsDirty(true); }}
                        placeholder="Digite sua anotação aqui..."
                        placeholderTextColor={colors.textTertiary}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>
            </View>

            <View style={{ height: 20 }} />
        </ScrollView>
    );

    const renderHistoryTab = () => (
        <View style={styles.tabContent}>
            {isLoadingHistory ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={colors.brandTeal} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Carregando histórico...</Text>
                </View>
            ) : historyError ? (
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>Erro: {historyError}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchObservations}>
                        <Text style={styles.retryButtonText}>Tentar novamente</Text>
                    </TouchableOpacity>
                </View>
            ) : observations.length === 0 ? (
                <View style={styles.centerContent}>
                    <FontAwesome5 name="history" size={32} color={colors.textTertiary} style={{ marginBottom: 12 }} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhuma observação encontrada.</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                    {observations
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map(obs => {
                            const isSummary = obs.content.startsWith('Resumo gerado pelo sistema');
                            return (
                                <View key={obs.id} style={[styles.historyItem, { backgroundColor: colors.bgTertiary }]}>
                                    <View style={[styles.historyIcon, { backgroundColor: isSummary ? '#e0e7ff' : '#fef3c7' }]}>
                                        <FontAwesome5 name={isSummary ? 'file-alt' : 'sticky-note'} size={14} color={isSummary ? '#4f46e5' : '#d97706'} />
                                    </View>
                                    <View style={styles.historyContent}>
                                        {isSummary ? (
                                            <TouchableOpacity
                                                style={[styles.viewSummaryBtn, { backgroundColor: colors.brandTealLight }]}
                                                onPress={() => onViewExistingSummary && onViewExistingSummary(obs.content)}
                                            >
                                                <Text style={[styles.viewSummaryBtnText, { color: colors.brandTeal }]}>Ver resumo da conversa</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <Text style={[styles.historyText, { color: colors.textPrimary }]}>{obs.content}</Text>
                                        )}
                                        <Text style={[styles.historyMeta, { color: colors.textTertiary }]}>
                                            {obs.usuario?.name || obs.usuario?.nome || `Usuário ${obs.userId}`} • {formatDateTime(obs.createdAt)}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    <View style={{ height: 20 }} />
                </ScrollView>
            )}
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.modalContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={[styles.modalContent, { backgroundColor: colors.bgSecondary }]}>
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.borderColor }]}>
                        <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.bgTertiary }]} onPress={onClose}>
                            <FontAwesome5 name="arrow-left" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Detalhes do Contato</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Quick Actions */}
                    <View style={[styles.quickActions, { borderBottomColor: colors.borderColor }]}>
                        <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: colors.brandTealLight }]} onPress={onOpenSummary}>
                            <FontAwesome5 name="magic" size={14} color={colors.brandTeal} style={{ marginRight: 8 }} />
                            <Text style={[styles.quickActionText, { color: colors.brandTeal }]}>Resumir com IA</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.quickActionButton, { backgroundColor: colors.bgTertiary }]} onPress={onOpenTransfer}>
                            <FontAwesome5 name="exchange-alt" size={14} color={colors.textPrimary} style={{ marginRight: 8 }} />
                            <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Transferir</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View style={[styles.tabBar, { borderBottomColor: colors.borderColor }]}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'details' && [styles.activeTab, { borderBottomColor: colors.brandTeal }]]}
                            onPress={() => setActiveTab('details')}
                        >
                            <Text style={[styles.tabText, { color: activeTab === 'details' ? colors.brandTeal : colors.textSecondary }]}>Detalhes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'history' && [styles.activeTab, { borderBottomColor: colors.brandTeal }]]}
                            onPress={() => setActiveTab('history')}
                        >
                            <Text style={[styles.tabText, { color: activeTab === 'history' ? colors.brandTeal : colors.textSecondary }]}>Histórico</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Body */}
                    {activeTab === 'details' ? renderDetailsTab() : renderHistoryTab()}

                    {/* Footer (Save Button for Details) */}
                    {activeTab === 'details' && (
                        <View style={[styles.footer, { borderTopColor: colors.borderColor, backgroundColor: colors.bgSecondary }]}>
                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: colors.brandTeal }, (!isDirty || isSaving) && styles.disabledButton]}
                                onPress={handleSave}
                                disabled={!isDirty || isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <FontAwesome5 name="save" size={16} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={styles.saveButtonText}>{isDirty ? 'Salvar Alterações' : 'Salvo'}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '90%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    quickActions: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
        borderBottomWidth: 1,
    },
    quickActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
    },
    quickActionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
    },
    tabContent: {
        flex: 1,
        padding: 16,
    },
    contactSummary: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 8,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    contactName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contactPhone: {
        fontSize: 14,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    formGroup: {
        marginBottom: 20,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
    statusGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    statusChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusChipText: {
        fontSize: 13,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        minHeight: 100,
    },
    footer: {
        padding: 16,
        paddingBottom: 24,
        borderTopWidth: 1,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.5,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
    },
    errorText: {
        color: '#dc3545',
        fontSize: 15,
        marginBottom: 16,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#dc3545',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 15,
    },
    historyItem: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    historyIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    historyContent: {
        flex: 1,
    },
    historyText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    historyMeta: {
        fontSize: 12,
    },
    viewSummaryBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    viewSummaryBtnText: {
        fontSize: 13,
        fontWeight: '600',
    }
});

export default ContactDetailsModal;
