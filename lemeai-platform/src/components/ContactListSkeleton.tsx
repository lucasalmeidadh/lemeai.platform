// ARQUIVO: src/components/ContactListSkeleton.tsx

import './ContactList.css'; // Reutilizamos alguns estilos
import './Skeleton.css';   // E adicionamos os novos

const SkeletonContactItem = () => (
  <li style={{ gap: 15, padding: 15 }}>
    <div className="skeleton skeleton-avatar"></div>
    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
      <div className="skeleton skeleton-text-sm"></div>
    </div>
  </li>
);

const ContactListSkeleton = () => {
  return (
    <div className="contact-list">
      <div className="contact-list-header">
        <div className="skeleton skeleton-header" style={{ width: '40%' }}></div>
        <div className="skeleton skeleton-input"></div>
      </div>
      <ul className="contacts-ul">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonContactItem key={index} />
        ))}
      </ul>
    </div>
  );
};

export default ContactListSkeleton;