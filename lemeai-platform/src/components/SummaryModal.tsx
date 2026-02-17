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



    const reorderSummary = (text: string) => {
        if (!text) return '';

        let status = '';
        let intent = '';
        let remaining = text;

        // Extract Status
        // Matches "Status Atual:" (case insensitive) followed by content, until next section or end
        const statusRegex = /(?:##\s*|\*\*|)?Status Atual:(?:\*\*|)?([\s\S]*?)(?=(?:##\s*|\*\*|)?(?:Intenção do Cliente|Resumo da Conversa|Resumo gerado pelo sistema)|$)/i;
        const statusMatch = remaining.match(statusRegex);
        if (statusMatch) {
            status = statusMatch[1].trim();
            remaining = remaining.replace(statusMatch[0], '');
        }

        // Extract Intent
        const intentRegex = /(?:##\s*|\*\*|)?Intenção do Cliente:(?:\*\*|)?([\s\S]*?)(?=(?:##\s*|\*\*|)?(?:Status Atual|Resumo da Conversa|Resumo gerado pelo sistema)|$)/i;
        const intentMatch = remaining.match(intentRegex);
        if (intentMatch) {
            intent = intentMatch[1].trim();
            remaining = remaining.replace(intentMatch[0], '');
        }

        // Clean up remaining text (Summary)
        let summaryContent = remaining.trim();

        // Recursively remove headers to handle stacked prefixes e.g. "Resumo gerado pelo sistema: Resumo da Conversa:"
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
                        {renderMarkdown(processedSummary)}
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
