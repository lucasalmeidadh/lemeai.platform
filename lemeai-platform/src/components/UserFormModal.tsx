import React, { useState, useEffect } from 'react';
import './UserFormModal.css';
import { FaTimes } from 'react-icons/fa';

interface User {
  id: number | null;
  name: string;
  email: string;
  profile: string;
  status: 'Ativo' | 'Inativo';
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User, password?: string) => void;
  userToEdit?: User | null;
  isSaving: boolean; // <-- NOVA PROP
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, userToEdit, isSaving }) => { // <-- NOVA PROP
  const initialState: User = {
    id: null,
    name: '',
    email: '',
    profile: 'Vendedor',
    status: 'Ativo',
  };

  const [user, setUser] = useState<User>(initialState);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setUser(userToEdit);
    } else {
      setUser(initialState);
    }
    setPassword('');
  }, [userToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
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
          {/* Adicionamos o 'fieldset' para desabilitar tudo durante o saving */}
          <fieldset disabled={isSaving} className="form-fieldset">
            <div className="form-grid">
              {/* Campo Nome */}
              <div className="form-group">
                <label htmlFor="name">Nome Completo</label>
                <input type="text" id="name" name="name" value={user.name} onChange={handleChange} required />
              </div>

              {/* Campo Email */}
              <div className="form-group">
                <label htmlFor="email">E-mail</label>
                <input type="email" id="email" name="email" value={user.email} onChange={handleChange} required />
              </div>

              {/* Campo Perfil */}
              <div className="form-group">
                <label htmlFor="profile">Perfil de Acesso</label>
                <select id="profile" name="profile" value={user.profile} onChange={handleChange}>
                  <option value="Vendedor">Vendedor</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>

              {/* Campo Status */}
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" value={user.status} onChange={handleChange}>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              {/* Campo Senha */}
              <div className="form-group full-width">
                <label htmlFor="password">Senha</label>
                <input type="password" id="password" name="password" placeholder={userToEdit ? 'Deixe em branco para não alterar' : 'Digite a senha'} value={password} onChange={(e) => setPassword(e.target.value)} required={!userToEdit} />
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