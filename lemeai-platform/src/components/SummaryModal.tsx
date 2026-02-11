import React from 'react';
import './SummaryModal.css';
import { FaMagic, FaTimes } from 'react-icons/fa';

interface SummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    summary: string;
}

const SummaryModal: React.FC<SummaryModalProps> = ({ isOpen, onClose, summary }) => {
    if (!isOpen) return null;

    // Simple parser to convert basic markdown to JSX
    const renderMarkdown = (text: string) => {
        if (!text) return null;

        const lines = text.split('\n');
        let inList = false;
        const elements: React.ReactNode[] = [];

        lines.forEach((line, index) => {
            // Headers (## Title)
            if (line.startsWith('## ')) {
                if (inList) {
                    elements.push(<ul key={`list-end-${index}`}></ul>);
                    inList = false;
                }
                elements.push(<h3 key={index}>{line.replace('## ', '')}</h3>);
            }
            // Bold (**Text**) - simple replacement for now, assumes no nested markdown
            else if (line.trim().startsWith('**')) {
                if (inList) {
                    elements.push(<ul key={`list-end-${index}`}></ul>);
                    inList = false;
                }
                // Basic handling for bold lines or paragraphs starting with bold
                // Basic handling for bold lines or paragraphs starting with bold
                // Better: Split by ** and map to strong/span
                const parts = line.split(/(\*\*.*?\*\*)/g);
                const lineContent = parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i}>{part.slice(2, -2)}</strong>;
                    }
                    return part;
                });
                elements.push(<p key={index}>{lineContent}</p>);

            }
            // List items (* Item)
            else if (line.trim().startsWith('* ')) {
                if (!inList) {
                    // Start a new list if we aren't in one. 
                    // React key issue with this simple approach: we need to wrap items in ul.
                    // For simplicity in this custom parser, we'll just render li with a bullet style or wrap them if we can look ahead/behind.
                    // Let's just use a div with a dot for now or try to group them.
                    // Simpler approach: Just render <li> and wrap everything in a container that allows <li>? No, <li> must be in <ul>
                    // Let's just render a div with a specific class that looks like a list item.
                    elements.push(
                        <div key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '5px' }}>
                            <span style={{ marginRight: '10px', fontWeight: 'bold' }}>•</span>
                            <span>{line.replace('* ', '')}</span>
                        </div>
                    );
                } else {
                    // inList is true
                }
            }
            // Paragraphs
            else if (line.trim().length > 0) {
                if (inList) {
                    inList = false;
                }
                const parts = line.split(/(\*\*.*?\*\*)/g);
                const lineContent = parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i}>{part.slice(2, -2)}</strong>;
                    }
                    return part;
                });
                elements.push(<p key={index}>{lineContent}</p>);
            }
        });

        return elements;
    };

    return (
        <div className="summary-modal-overlay" onClick={onClose}>
            <div className="summary-modal-content" onClick={(e) => e.stopPropagation()}>
                <header className="summary-modal-header">
                    <h2>
                        <FaMagic className="summary-header-icon" />
                        Resumo da Conversa
                    </h2>
                    <button className="close-summary-button" onClick={onClose}>
                        <FaTimes />
                    </button>
                </header>
                <div className="summary-modal-body">
                    <div className="summary-markdown">
                        {renderMarkdown(summary)}
                    </div>
                </div>
                <footer className="summary-modal-footer">
                    <button className="summary-close-btn" onClick={onClose}>
                        Fechar
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SummaryModal;
