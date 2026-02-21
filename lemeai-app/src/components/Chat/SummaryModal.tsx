import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAppTheme } from '../../contexts/ThemeContext';

interface SummaryModalProps {
    visible: boolean;
    onClose: () => void;
    summary: string;
}

const SummaryModal: React.FC<SummaryModalProps> = ({ visible, onClose, summary }) => {
    const { colors } = useAppTheme();

    if (!visible) return null;

    const reorderSummary = (text: string) => {
        if (!text) return '';

        let status = '';
        let intent = '';
        let remaining = text;

        const statusRegex = /(?:##\s*|\*\*|)?Status Atual:(?:\*\*|)?([\s\S]*?)(?=(?:##\s*|\*\*|)?(?:Intenção do Cliente|Resumo da Conversa|Resumo gerado pelo sistema)|$)/i;
        const statusMatch = remaining.match(statusRegex);
        if (statusMatch) {
            status = statusMatch[1].trim();
            remaining = remaining.replace(statusMatch[0], '');
        }

        const intentRegex = /(?:##\s*|\*\*|)?Intenção do Cliente:(?:\*\*|)?([\s\S]*?)(?=(?:##\s*|\*\*|)?(?:Status Atual|Resumo da Conversa|Resumo gerado pelo sistema)|$)/i;
        const intentMatch = remaining.match(intentRegex);
        if (intentMatch) {
            intent = intentMatch[1].trim();
            remaining = remaining.replace(intentMatch[0], '');
        }

        let summaryContent = remaining.trim();

        const removeHeaders = (content: string): string => {
            const newContent = content
                .replace(/^(?:##\s*|\*\*|)?Resumo gerado pelo sistema(?::)?(?:\*\*|)?\s*/i, '')
                .replace(/^(?:##\s*|\*\*|)?Resumo da Conversa(?::)?(?:\*\*|)?\s*/i, '')
                .trim();

            if (newContent !== content) {
                return removeHeaders(newContent);
            }
            return content;
        };

        summaryContent = removeHeaders(summaryContent);

        const sections = [];

        if (status) {
            sections.push(`## Status Atual\n${status}`);
        }
        if (intent) {
            sections.push(`## Intenção do Cliente\n${intent}`);
        }
        if (summaryContent) {
            sections.push(`## Resumo da Conversa\n${summaryContent}`);
        }

        if (sections.length > 0) {
            return sections.join('\n\n');
        }

        return text;
    };

    const processedSummary = reorderSummary(summary);

    const renderMarkdown = (text: string) => {
        if (!text) return null;

        const lines = text.split('\n');
        const elements: React.ReactNode[] = [];

        lines.forEach((line, index) => {
            if (line.trim().length === 0) return;

            // Headers
            if (line.startsWith('## ')) {
                elements.push(
                    <Text key={`h2-${index}`} style={[styles.heading, { color: colors.textPrimary }]}>
                        {line.replace('## ', '')}
                    </Text>
                );
            }
            // List Items
            else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
                const itemContent = line.replace(/^[\*\-]\s/, '');
                const parts = itemContent.split(/(\*\*.*?\*\*)/g);

                elements.push(
                    <View key={`li-${index}`} style={styles.listItem}>
                        <Text style={[styles.bullet, { color: colors.textPrimary }]}>•</Text>
                        <Text style={[styles.paragraph, { color: colors.textSecondary, flex: 1 }]}>
                            {parts.map((part, i) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                    return <Text key={i} style={{ fontWeight: 'bold', color: colors.textPrimary }}>{part.slice(2, -2)}</Text>;
                                }
                                return part;
                            })}
                        </Text>
                    </View>
                );
            }
            // Normal Paragraphs
            else {
                const parts = line.split(/(\*\*.*?\*\*)/g);
                elements.push(
                    <Text key={`p-${index}`} style={[styles.paragraph, { color: colors.textSecondary }]}>
                        {parts.map((part, i) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return <Text key={i} style={{ fontWeight: 'bold', color: colors.textPrimary }}>{part.slice(2, -2)}</Text>;
                            }
                            return part;
                        })}
                    </Text>
                );
            }
        });

        return elements;
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity style={[styles.modalContent, { backgroundColor: colors.bgSecondary }]} activeOpacity={1}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.borderColor }]}>
                        <View style={styles.headerTitleContainer}>
                            <FontAwesome5 name="magic" size={16} color={colors.brandTeal} style={{ marginRight: 8 }} />
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Resumo da Conversa</Text>
                        </View>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <FontAwesome5 name="times" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                        {renderMarkdown(processedSummary)}
                    </ScrollView>

                    <View style={[styles.modalFooter, { borderTopColor: colors.borderColor }]}>
                        <TouchableOpacity style={[styles.closeFooterBtn, { backgroundColor: colors.bgTertiary }]} onPress={onClose}>
                            <Text style={[styles.closeFooterBtnText, { color: colors.textPrimary }]}>Fechar</Text>
                        </TouchableOpacity>
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
        maxHeight: '85%',
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
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        padding: 20,
    },
    heading: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    paragraph: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 8,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6,
        paddingLeft: 4,
    },
    bullet: {
        fontSize: 16,
        marginRight: 8,
        lineHeight: 22,
    },
    modalFooter: {
        padding: 16,
        borderTopWidth: 1,
        alignItems: 'flex-end',
    },
    closeFooterBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    closeFooterBtnText: {
        fontSize: 14,
        fontWeight: '600',
    }
});

export default SummaryModal;
