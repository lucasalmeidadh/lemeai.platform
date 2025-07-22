import './ContactList.css';

const contacts = [
  { id: 1, name: 'João da Silva', lastMessage: 'Ok, combinado!', time: '10:45', active: true },
  { id: 2, name: 'Maria Pereira', lastMessage: 'Preciso da cotação...', time: 'Ontem', active: false },
  { id: 3, name: 'Carlos Andrade', lastMessage: 'Obrigado!', time: 'Sexta', active: false },
];

const ContactList = () => {
  return (
    <div className="contact-list">
      <div className="contact-list-header">
        <h2>Conversas</h2>
      </div>
      <ul>
        {contacts.map(contact => (
          <li key={contact.id} className={contact.active ? 'active' : ''}>
            <div className="contact-info">
              <span className="contact-name">{contact.name}</span>
              <span className="contact-last-message">{contact.lastMessage}</span>
            </div>
            <span className="contact-time">{contact.time}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
export default ContactList;