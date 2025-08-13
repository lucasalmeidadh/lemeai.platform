import React, { useState, useEffect } from 'react';
import './UserFormModal.css';
import { FaTimes } from 'react-icons/fa';
import type { User, Profile } from '../types';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User, password?: string) => void;
  userToEdit?: User | null;
  profiles: Profile[]; 
  isSaving: boolean;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, userToEdit, profiles, isSaving }) => {
  
  const getInitialState = (): User => ({
    id: null,
    name: '',
    email: '',
    profileId: profiles.length > 0 ? profiles[0].id : 0, 
    status: 'Ativo',
  });

  const [user, setUser] = useState<User>(getInitialState());
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setUser(userToEdit);
    } else {
      setUser(getInitialState());
    }
    setPassword('');
  }, [userToEdit, isOpen, profiles]); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'profileId' ? Number(value) : value;
    setUser(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(user, password);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <header className="modal-header">
          <h2>{userToEdit ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</h2>
          <button onClick={onClose} className="close-modal-button" disabled={isSaving}>
            <FaTimes />
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <fieldset disabled={isSaving} className="form-fieldset">
            <div className="form-grid">
              {}
              <div className="form-group">
                <label htmlFor="name">Nome Completo</label>
                <input type="text" id="name" name="name" value={user.name} onChange={handleChange} required />
              </div>

              {}
              <div className="form-group">
                <label htmlFor="email">E-mail</label>
                <input type="email" id="email" name="email" value={user.email} onChange={handleChange} required />
              </div>

              {}
              <div className="form-group">
                <label htmlFor="profileId">Perfil de Acesso</label>
                <select id="profileId" name="profileId" value={user.profileId} onChange={handleChange}>
                  {profiles.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.nome}
                    </option>
                  ))}
                </select>
              </div>

              {}
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" value={user.status} onChange={handleChange}>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              {}
              <div className="form-group full-width">
                <label htmlFor="password">Senha</label>
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    placeholder={userToEdit ? 'Deixe em branco para não alterar' : 'Digite a senha'} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required={!userToEdit} 
                />
              </div>
            </div>
          </fieldset>
          <footer className="modal-footer">
            <button type="button" className="button secondary" onClick={onClose} disabled={isSaving}>
              Cancelar
            </button>
            <button type="submit" className="button primary" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Usuário'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;