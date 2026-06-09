import { useState, useEffect } from 'react';
import { FaTimes, FaBoxOpen } from 'react-icons/fa';
import { ProductService, type Product } from '../services/ProductService';
import { ConversaProdutoService } from '../services/ConversaProdutoService';
import toast from 'react-hot-toast';
import './WinDealProductModal.css';

interface WinDealProductModalProps {
    isOpen: boolean;
    dealId: number;
    dealTitle: string;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
}

const WinDealProductModal = ({ isOpen, dealId, dealTitle, onConfirm, onCancel }: WinDealProductModalProps) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setSelectedProductId(null);
        setQuantity(1);
        setUnitPrice('');
        setSearchQuery('');
        setIsSaving(false);

        const loadProducts = async () => {
            setIsLoadingProducts(true);
            try {
                const res = await ProductService.getAll();
                if (res.sucesso) setProducts(res.dados ?? []);
            } catch {
                toast.error('Erro ao carregar produtos.');
            } finally {
                setIsLoadingProducts(false);
            }
        };
        loadProducts();
    }, [isOpen]);

    if (!isOpen) return null;

    const filtered = products.filter(p =>
        p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.marca && p.marca.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const selectedProduct = products.find(p => p.produtoId === selectedProductId);

    const handleConfirm = async () => {
        if (!selectedProduct) return;
        const price = parseFloat(unitPrice) >= 0 ? parseFloat(unitPrice) : selectedProduct.preco;
        setIsSaving(true);
        try {
            await ConversaProdutoService.vincular(dealId, {
                produtoId: selectedProduct.produtoId,
                quantidade: quantity,
                precoUnitarioNegociado: price,
            });
            await onConfirm();
        } catch (err: any) {
            toast.error(err.message || 'Erro ao vincular produto.');
            setIsSaving(false);
        }
    };

    return (
        <div className="wdpm-overlay" onClick={onCancel}>
            <div className="wdpm-modal" onClick={e => e.stopPropagation()}>
                <div className="wdpm-header">
                    <div className="wdpm-header-info">
                        <FaBoxOpen className="wdpm-header-icon" />
                        <div>
                            <h3>Vincular Produto para Fechar Venda</h3>
                            <p title={dealTitle}>{dealTitle}</p>
                        </div>
                    </div>
                    <button className="wdpm-close" onClick={onCancel} aria-label="Fechar" disabled={isSaving}>
                        <FaTimes />
                    </button>
                </div>

                <div className="wdpm-body">
                    <p className="wdpm-info-text">
                        Para fechar esta venda é necessário vincular pelo menos um produto ou serviço.
                    </p>

                    <div className="wdpm-form-group">
                        <label>Pesquisar Produto</label>
                        <input
                            type="text"
                            className="wdpm-input"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Pesquise por nome, marca ou código..."
                            autoFocus
                            disabled={isSaving}
                        />
                    </div>

                    <div className="wdpm-form-group">
                        <label>Selecionar Produto <span className="wdpm-required">*</span></label>
                        <div className="wdpm-product-list">
                            {isLoadingProducts ? (
                                <p className="wdpm-empty">Carregando produtos...</p>
                            ) : filtered.length === 0 ? (
                                <p className="wdpm-empty">
                                    {products.length === 0
                                        ? 'Nenhum produto cadastrado no sistema.'
                                        : 'Nenhum produto encontrado.'}
                                </p>
                            ) : (
                                filtered.map(p => {
                                    const isSelected = selectedProductId === p.produtoId;
                                    return (
                                        <div
                                            key={p.produtoId}
                                            className={`wdpm-product-item ${isSelected ? 'selected' : ''}`}
                                            onClick={() => {
                                                if (isSaving) return;
                                                setSelectedProductId(p.produtoId);
                                                setUnitPrice(p.preco.toString());
                                            }}
                                        >
                                            <div className="wdpm-product-info">
                                                <span className="wdpm-product-name">{p.nome}</span>
                                                <span className="wdpm-product-meta">
                                                    Cód: {p.codigo} | Marca: {p.marca || 'N/A'}
                                                </span>
                                            </div>
                                            <span className="wdpm-product-price">
                                                {new Intl.NumberFormat('pt-BR', {
                                                    style: 'currency',
                                                    currency: 'BRL',
                                                }).format(p.preco)}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {selectedProduct && (
                        <div className="wdpm-details-row">
                            <div className="wdpm-form-group">
                                <label>Quantidade</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="wdpm-input"
                                    value={quantity}
                                    onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    disabled={isSaving}
                                />
                            </div>
                            <div className="wdpm-form-group wdpm-price-group">
                                <label>Preço Unitário Negociado (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="wdpm-input"
                                    value={unitPrice}
                                    onChange={e => setUnitPrice(e.target.value)}
                                    placeholder="Preço padrão"
                                    disabled={isSaving}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="wdpm-footer">
                    <button className="wdpm-btn-cancel" onClick={onCancel} disabled={isSaving}>
                        Cancelar
                    </button>
                    <button
                        className="wdpm-btn-confirm"
                        disabled={!selectedProductId || isSaving}
                        onClick={handleConfirm}
                    >
                        {isSaving ? 'Vinculando...' : 'Vincular e Fechar Venda'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WinDealProductModal;
