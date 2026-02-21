import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../../services/api';
import { useAppTheme } from '../../contexts/ThemeContext';

const API_URL = 'https://api.gbcode.com.br';

interface UserData {
    id: number;
    nome: string;
    email: string;
    role: string;
    userName?: string;
}

interface ProfileModalProps {
    visible: boolean;
    onClose: () => void;
    onLogout: () => void;
    userName?: string;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose, onLogout, userName }) => {
    const { colors, theme, toggleTheme } = useAppTheme();
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [formKey, setFormKey] = useState(0);

    useEffect(() => {
        if (visible) {
            loadUserData();
            resetForm();
            setFormKey(prev => prev + 1);
        }
    }, [visible]);

    const loadUserData = async () => {
        setLoading(true);
        try {
            const stored = await AsyncStorage.getItem('user');
            if (stored) {
                setUser(JSON.parse(stored));
            } else {
                const response = await apiFetch(`${API_URL}/api/Auth/Me`);
                if (response.ok) {
                    const data = await response.json();
                    setUser(data);
                    await AsyncStorage.setItem('user', JSON.stringify(data));
                }
            }
        } catch (err) {
            console.error('Error loading user data:', err);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setShowLogoutConfirm(false);
    };

    const validationRules = [
        { label: 'Mínimo de 8 caracteres', valid: newPassword.length >= 8 },
        { label: 'Máximo de 16 caracteres', valid: newPassword.length <= 16 && newPassword.length > 0 },
        { label: 'Pelo menos uma letra maiúscula', valid: /[A-Z]/.test(newPassword) },
        { label: 'Pelo menos uma letra minúscula', valid: /[a-z]/.test(newPassword) },
        { label: 'Pelo menos um caractere especial', valid: /[!@#$%^&*(),.?":{|}<>]/.test(newPassword) },
    ];

    const allRulesValid = validationRules.every(r => r.valid);

    const handleChangePassword = async () => {
        if (!currentPassword.trim()) {
            Alert.alert('Erro', 'Digite sua senha atual.');
            return;
        }
        if (!allRulesValid) {
            Alert.alert('Erro', 'A nova senha não atende aos requisitos.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Erro', 'As senhas não conferem.');
            return;
        }

        setIsSaving(true);
        try {
            const response = await apiFetch(`${API_URL}/api/Auth/AlterarSenha`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senhaAtual: currentPassword,
                    novaSenha: newPassword,
                }),
            });

            if (response.ok) {
                Alert.alert('Sucesso', 'Senha alterada com sucesso!');
                resetForm();
            } else {
                const data = await response.json().catch(() => null);
                Alert.alert('Erro', data?.message || 'Não foi possível alterar a senha. Verifique sua senha atual.');
            }
        } catch (err) {
            Alert.alert('Erro', 'Erro de conexão. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogoutPress = () => {
        setShowLogoutConfirm(true);
    };

    const handleLogoutConfirm = () => {
        setShowLogoutConfirm(false);
        onClose();
        onLogout();
    };

    const getInitials = (name: string) => {
        if (!name) return 'US';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const displayName = user?.nome || user?.userName || userName || '—';
    const displayEmail = user?.email || '—';
    const displayRole = user?.role || 'Vendedor';
    const initials = getInitials(displayName);

    const isDark = theme === 'dark';

    return (
        <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
            <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
                {/* Header */}
                <View style={[styles.header, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.borderColor }]}>
                    <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.brandTealLight }]} onPress={onClose}>
                        <FontAwesome5 name="arrow-left" size={18} color={colors.brandTeal} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Meu Perfil</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer} showsVerticalScrollIndicator={false}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.brandTeal} />
                        </View>
                    ) : (
                        <>
                            {/* User Avatar & Name */}
                            <View style={styles.avatarSection}>
                                <View style={[styles.bigAvatar, { backgroundColor: colors.brandTeal, shadowColor: colors.brandTeal }]}>
                                    <Text style={styles.bigAvatarText}>{initials}</Text>
                                </View>
                                <Text style={[styles.userName, { color: colors.textPrimary }]}>{displayName}</Text>
                                <View style={[styles.roleBadge, { backgroundColor: colors.brandTealLight }]}>
                                    <Text style={[styles.roleBadgeText, { color: colors.brandTeal }]}>{displayRole}</Text>
                                </View>
                            </View>

                            {/* Theme Toggle Section */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Aparência</Text>
                                <View style={[styles.infoCard, { backgroundColor: colors.bgSecondary }]}>
                                    <View style={styles.themeRow}>
                                        <View style={styles.themeRowLeft}>
                                            <View style={[styles.infoIconContainer, { backgroundColor: colors.brandTealLight }]}>
                                                <FontAwesome5 name={isDark ? 'moon' : 'sun'} size={14} color={colors.brandTeal} />
                                            </View>
                                            <View>
                                                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{isDark ? 'Modo Escuro' : 'Modo Claro'}</Text>
                                                <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{isDark ? 'Alternar para claro' : 'Alternar para escuro'}</Text>
                                            </View>
                                        </View>
                                        <Switch
                                            value={isDark}
                                            onValueChange={toggleTheme}
                                            trackColor={{ false: '#d1d5db', true: colors.brandTeal }}
                                            thumbColor={isDark ? '#ffffff' : '#f4f3f4'}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Personal Info Section */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Informações Pessoais</Text>

                                <View style={[styles.infoCard, { backgroundColor: colors.bgSecondary }]}>
                                    <View style={styles.infoRow}>
                                        <View style={[styles.infoIconContainer, { backgroundColor: colors.brandTealLight }]}>
                                            <FontAwesome5 name="user" size={14} color={colors.brandTeal} />
                                        </View>
                                        <View style={styles.infoContent}>
                                            <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Nome</Text>
                                            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{displayName}</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.infoSeparator, { backgroundColor: colors.borderColorSoft }]} />

                                    <View style={styles.infoRow}>
                                        <View style={[styles.infoIconContainer, { backgroundColor: colors.brandTealLight }]}>
                                            <FontAwesome5 name="envelope" size={14} color={colors.brandTeal} />
                                        </View>
                                        <View style={styles.infoContent}>
                                            <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Email</Text>
                                            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{displayEmail}</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.infoSeparator, { backgroundColor: colors.borderColorSoft }]} />

                                    <View style={styles.infoRow}>
                                        <View style={[styles.infoIconContainer, { backgroundColor: colors.brandTealLight }]}>
                                            <FontAwesome5 name="briefcase" size={14} color={colors.brandTeal} />
                                        </View>
                                        <View style={styles.infoContent}>
                                            <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>Função / Cargo</Text>
                                            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{displayRole}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Change Password Section */}
                            <View style={styles.section}>
                                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Alterar Senha</Text>

                                <View style={[styles.infoCard, { backgroundColor: colors.bgSecondary }]}>
                                    <View style={styles.formGroup}>
                                        <Text style={[styles.formLabel, { color: colors.textTertiary }]}>Senha atual</Text>
                                        <View style={[styles.passwordInputRow, { backgroundColor: colors.bgTertiary, borderColor: colors.borderColor }]}>
                                            <TextInput
                                                key={`current-${formKey}`}
                                                style={[styles.formInput, { color: colors.textPrimary }]}
                                                placeholder="Digite sua senha atual"
                                                placeholderTextColor={colors.textTertiary}
                                                secureTextEntry={!showCurrentPassword}
                                                value={currentPassword}
                                                onChangeText={setCurrentPassword}
                                                autoCapitalize="none"
                                                autoComplete="off"
                                                importantForAutofill="no"
                                                textContentType="oneTimeCode"
                                                autoCorrect={false}
                                            />
                                            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                                                <FontAwesome5 name={showCurrentPassword ? 'eye-slash' : 'eye'} size={16} color={colors.textTertiary} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={[styles.formLabel, { color: colors.textTertiary }]}>Nova senha</Text>
                                        <View style={[styles.passwordInputRow, { backgroundColor: colors.bgTertiary, borderColor: colors.borderColor }]}>
                                            <TextInput
                                                style={[styles.formInput, { color: colors.textPrimary }]}
                                                placeholder="Digite a nova senha"
                                                placeholderTextColor={colors.textTertiary}
                                                secureTextEntry={!showNewPassword}
                                                value={newPassword}
                                                onChangeText={setNewPassword}
                                                autoCapitalize="none"
                                                autoComplete="off"
                                                importantForAutofill="no"
                                                textContentType="oneTimeCode"
                                                autoCorrect={false}
                                            />
                                            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowNewPassword(!showNewPassword)}>
                                                <FontAwesome5 name={showNewPassword ? 'eye-slash' : 'eye'} size={16} color={colors.textTertiary} />
                                            </TouchableOpacity>
                                        </View>

                                        {newPassword.length > 0 && (
                                            <View style={styles.rulesContainer}>
                                                {validationRules.map((rule, index) => (
                                                    <View key={index} style={styles.ruleRow}>
                                                        <FontAwesome5
                                                            name={rule.valid ? 'check-circle' : 'circle'}
                                                            size={12}
                                                            color={rule.valid ? '#10b981' : colors.textTertiary}
                                                            solid={rule.valid}
                                                        />
                                                        <Text style={[styles.ruleText, { color: colors.textTertiary }, rule.valid && styles.ruleTextValid]}>
                                                            {rule.label}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.formGroup}>
                                        <Text style={[styles.formLabel, { color: colors.textTertiary }]}>Confirmar senha</Text>
                                        <View style={[styles.passwordInputRow, { backgroundColor: colors.bgTertiary, borderColor: colors.borderColor }]}>
                                            <TextInput
                                                style={[styles.formInput, { color: colors.textPrimary }]}
                                                placeholder="Confirme a nova senha"
                                                placeholderTextColor={colors.textTertiary}
                                                secureTextEntry={!showConfirmPassword}
                                                value={confirmPassword}
                                                onChangeText={setConfirmPassword}
                                                autoCapitalize="none"
                                                autoComplete="off"
                                                importantForAutofill="no"
                                                textContentType="oneTimeCode"
                                                autoCorrect={false}
                                            />
                                            <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                <FontAwesome5 name={showConfirmPassword ? 'eye-slash' : 'eye'} size={16} color={colors.textTertiary} />
                                            </TouchableOpacity>
                                        </View>
                                        {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                                            <Text style={styles.errorText}>As senhas não conferem</Text>
                                        )}
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.changePasswordButton, { backgroundColor: colors.brandTeal }, (!allRulesValid || newPassword !== confirmPassword || !currentPassword || isSaving) && styles.disabledButton]}
                                        onPress={handleChangePassword}
                                        disabled={!allRulesValid || newPassword !== confirmPassword || !currentPassword || isSaving}
                                    >
                                        {isSaving ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <Text style={styles.changePasswordButtonText}>Atualizar Senha</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Logout Section */}
                            <View style={styles.section}>
                                {!showLogoutConfirm ? (
                                    <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.bgSecondary }]} onPress={handleLogoutPress}>
                                        <FontAwesome5 name="sign-out-alt" size={16} color="#dc3545" />
                                        <Text style={styles.logoutButtonText}>Sair do Aplicativo</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={[styles.logoutConfirmCard, { backgroundColor: colors.bgSecondary }]}>
                                        <Text style={[styles.logoutConfirmText, { color: colors.textPrimary }]}>Tem certeza que deseja sair?</Text>
                                        <View style={styles.logoutConfirmActions}>
                                            <TouchableOpacity style={[styles.cancelButton, { backgroundColor: colors.bgTertiary }]} onPress={() => setShowLogoutConfirm(false)}>
                                                <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>Cancelar</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.confirmLogoutButton} onPress={handleLogoutConfirm}>
                                                <Text style={styles.confirmLogoutButtonText}>Sim, Sair</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>

                            <View style={{ height: 40 }} />
                        </>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: 50,
        borderBottomWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    scrollContent: {
        flex: 1,
    },
    scrollContentContainer: {
        padding: 16,
    },
    loadingContainer: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 24,
        marginBottom: 8,
    },
    bigAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    bigAvatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
    },
    roleBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
    },
    roleBadgeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 10,
        paddingLeft: 4,
    },
    infoCard: {
        borderRadius: 14,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    infoIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '500',
    },
    infoSeparator: {
        height: 1,
        marginLeft: 48,
    },
    // Theme toggle
    themeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    themeRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    // Form
    formGroup: {
        marginBottom: 16,
    },
    formLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    passwordInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 1,
    },
    formInput: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        backgroundColor: 'transparent',
    },
    eyeButton: {
        padding: 12,
    },
    rulesContainer: {
        marginTop: 10,
        paddingLeft: 4,
    },
    ruleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    ruleText: {
        fontSize: 12,
        marginLeft: 8,
    },
    ruleTextValid: {
        color: '#10b981',
    },
    errorText: {
        fontSize: 12,
        color: '#ef4444',
        marginTop: 6,
        paddingLeft: 4,
    },
    changePasswordButton: {
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 4,
    },
    disabledButton: {
        opacity: 0.5,
    },
    changePasswordButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    logoutButtonText: {
        color: '#dc3545',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    logoutConfirmCard: {
        borderRadius: 14,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#fecaca',
    },
    logoutConfirmText: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 16,
    },
    logoutConfirmActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    confirmLogoutButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#dc3545',
        alignItems: 'center',
    },
    confirmLogoutButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default ProfileModal;
