import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './Pagination.css';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage
}) => {
    if (totalPages <= 1) return null;

    const renderPageButtons = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages + 2) {
            // Se tiver poucas páginas, mostra todas
            for (let i = 1; i <= totalPages; i++) {
                pages.push(renderButton(i));
            }
        } else {
            // Lógica de elipses
            pages.push(renderButton(1));

            if (currentPage > 3) {
                pages.push(<span key="ellipsis-start" className="pagination-ellipsis">...</span>);
            }

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            // Ajuste para sempre mostrar 3 números no meio se possível
            let adjustedStart = start;
            let adjustedEnd = end;
            
            if (currentPage <= 3) {
                adjustedEnd = 4;
            } else if (currentPage >= totalPages - 2) {
                adjustedStart = totalPages - 3;
            }

            for (let i = adjustedStart; i <= adjustedEnd; i++) {
                pages.push(renderButton(i));
            }

            if (currentPage < totalPages - 2) {
                pages.push(<span key="ellipsis-end" className="pagination-ellipsis">...</span>);
            }

            pages.push(renderButton(totalPages));
        }

        return pages;
    };

    const renderButton = (page: number) => (
        <button
            key={page}
            className={`pagination-page-btn ${currentPage === page ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
        >
            {page}
        </button>
    );

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(totalItems, currentPage * itemsPerPage);

    return (
        <div className="pagination-container">
            <div className="pagination-info">
                Mostrando <strong>{startItem}</strong> a <strong>{endItem}</strong> de <strong>{totalItems}</strong> itens
            </div>
            <div className="pagination-controls">
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                >
                    <FaChevronLeft size={12} /> Anterior
                </button>

                <div className="pagination-pages">
                    {renderPageButtons()}
                </div>

                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                >
                    Próximo <FaChevronRight size={12} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
