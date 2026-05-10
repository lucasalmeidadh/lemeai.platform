
import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaBox, FaConciergeBell } from 'react-icons/fa';
import './ProductsPage.css';
import { ProductService, type Product, type CreateProductDTO } from '../services/ProductService';

type ItemType = 'produto' | 'servico';

const ProductsPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [itemType, setItemType] = useState<ItemType | null>(null);

    // Generate a random code for the API
    const generateRandomCode = () => String(Math.floor(Math.random() * 900000) + 100000);

    // Form state
    const [formData, setFormData] = useState<CreateProductDTO>({
        codigo: '',
        codigoReferencia: '',
        nome: '',
        codigoBarra: '',
        marca: '',
        secao: '',
        preco: 0,
        precoDeCusto: 0,
        peso: 0,
        link: '',
        descricaoDetalhada: ''
    });

    // Temporary state for currency inputs to handle masking
    const [priceInput, setPriceInput] = useState('');

    // Auto-resize textarea
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const autoResize = useCallback((el: HTMLTextAreaElement) => {
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
    }, []);

    // Resize on value change (e.g. when opening edit modal with existing text)
    useEffect(() => {
        if (textareaRef.current) {
            autoResize(textareaRef.current);
        }
    }, [formData.descricaoDetalhada, itemType, autoResize]);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setIsLoading(true);
        try {
            const response = await ProductService.getAll();
            if (response.sucesso) {
                setProducts(response.dados);
            } else {
                toast.error(response.mensagem || 'Erro ao carregar produtos.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    // Formats input value as currency (R$ X.XXX,XX) while typing
    const formatCurrencyInput = (value: string) => {
        const numericValue = value.replace(/\D/g, '');
        const number = Number(numericValue) / 100;
        return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Parses formatted currency string back to number
    const parseCurrencyInput = (value: string) => {
        const numericValue = value.replace(/\D/g, '');
        return Number(numericValue) / 100;
    };

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setCurrentProduct(product);
            // Infer type: if it has marca or peso > 0, it's a product
            const isProduct = !!(product.marca && product.marca.trim());
            setItemType(isProduct ? 'produto' : 'servico');
            setFormData({
                codigo: product.codigo,
                codigoReferencia: product.codigoReferencia || '',
                nome: product.nome,
                codigoBarra: product.codigoBarra || '',
                marca: product.marca,
                secao: product.secao || '',
                preco: product.preco,
                precoDeCusto: product.precoDeCusto || 0,
                peso: product.peso,
                link: product.link || '',
                descricaoDetalhada: product.descricaoDetalhada || ''
            });
            setPriceInput(product.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
        } else {
            setCurrentProduct(null);
            setItemType(null); // Show type selection first
            setFormData({
                codigo: generateRandomCode(),
                codigoReferencia: '',
                nome: '',
                codigoBarra: '',
                marca: '',
                secao: '',
                preco: 0,
                precoDeCusto: 0,
                peso: 0,
                link: '',
                descricaoDetalhada: ''
            });
            setPriceInput('');
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentProduct(null);
        setItemType(null);
        setPriceInput('');
    };

    const handleSelectType = (type: ItemType) => {
        setItemType(type);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'preco') {
            const numericValue = parseCurrencyInput(value);
            setPriceInput(formatCurrencyInput(value));
            setFormData(prev => ({ ...prev, preco: numericValue }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: name === 'peso' ? Number(value) : value
            }));
        }
    };

    const handleSaveProduct = async () => {
        if (!formData.nome) {
            toast.error(`O nome do ${itemType === 'servico' ? 'serviço' : 'produto'} é obrigatório.`);
            return;
        }

        // Ensure codigo is always set
        const dataToSend = {
            ...formData,
            codigo: formData.codigo || generateRandomCode()
        };

        try {
            if (currentProduct) {
                // Edit
                const response = await ProductService.update({
                    produtoId: currentProduct.produtoId,
                    ...dataToSend
                });
                if (response.sucesso) {
                    toast.success(`${itemType === 'servico' ? 'Serviço' : 'Produto'} atualizado com sucesso!`);
                    loadProducts();
                    handleCloseModal();
                } else {
                    toast.error(response.mensagem || 'Erro ao atualizar.');
                }
            } else {
                // Create
                const response = await ProductService.create(dataToSend);
                if (response.sucesso) {
                    toast.success(`${itemType === 'servico' ? 'Serviço' : 'Produto'} criado com sucesso!`);
                    loadProducts();
                    handleCloseModal();
                } else {
                    toast.error(response.mensagem || 'Erro ao criar.');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar produto.');
        }
    };

    const handleDeleteProduct = async (id: number) => {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            try {
                const response = await ProductService.delete(id);
                if (response.sucesso) {
                    toast.success('Produto removido com sucesso!');
                    loadProducts();
                } else {
                    toast.error(response.mensagem || 'Erro ao remover produto.');
                }
            } catch (error) {
                console.error(error);
                toast.error('Erro ao remover produto.');
            }
        }
    };

    return (
        <div className="page-container products-page">
            <div className="page-header">
                <h1>Produtos e Serviços</h1>
                <button className="add-button" onClick={() => handleOpenModal()}>
                    <FaPlus /> Novo
                </button>
            </div>

            <div className="dashboard-card">
                <div className="table-container">
                    <table className="management-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Nome</th>
                                <th>Marca</th>
                                <th>Preço</th>
                                <th>Peso (kg)</th>
                                <th style={{ width: '100px' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                                        Carregando produtos...
                                    </td>
                                </tr>
                            ) : products.length > 0 ? (
                                products.map((product) => (
                                    <tr key={product.produtoId}>
                                        <td>{product.codigo}</td>
                                        <td>{product.nome}</td>
                                        <td>{product.marca}</td>
                                        <td>{formatCurrency(product.preco)}</td>
                                        <td>{product.peso}</td>
                                        <td className="actions-cell">
                                            <button className="action-button edit" onClick={() => handleOpenModal(product)} title="Editar">
                                                <FaEdit />
                                            </button>
                                            <button className="action-button delete" onClick={() => handleDeleteProduct(product.produtoId)} title="Excluir">
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                                        Nenhum produto encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>
                                {currentProduct
                                    ? `Editar ${itemType === 'servico' ? 'Serviço' : 'Produto'}`
                                    : itemType
                                        ? `Novo ${itemType === 'servico' ? 'Serviço' : 'Produto'}`
                                        : 'Novo Cadastro'}
                            </h2>
                            <button className="close-button" onClick={handleCloseModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            {/* Type selection step — only for new items */}
                            {!currentProduct && !itemType && (
                                <div className="type-selection">
                                    <p className="type-selection-label">O que você deseja cadastrar?</p>
                                    <div className="type-selection-cards">
                                        <button
                                            className="type-card"
                                            onClick={() => handleSelectType('produto')}
                                        >
                                            <FaBox className="type-card-icon" />
                                            <span className="type-card-title">Produto</span>
                                            <span className="type-card-desc">Item físico com marca, peso e preço</span>
                                        </button>
                                        <button
                                            className="type-card"
                                            onClick={() => handleSelectType('servico')}
                                        >
                                            <FaConciergeBell className="type-card-icon" />
                                            <span className="type-card-title">Serviço</span>
                                            <span className="type-card-desc">Serviço prestado com preço definido</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Form fields — shown after type is selected or when editing */}
                            {itemType && (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="nome">
                                            {itemType === 'servico' ? 'Nome do Serviço' : 'Nome do Produto'} *
                                        </label>
                                        <input
                                            type="text"
                                            id="nome"
                                            name="nome"
                                            value={formData.nome}
                                            onChange={handleInputChange}
                                            placeholder={itemType === 'servico' ? 'Ex: Consultoria, Manutenção...' : 'Nome do produto'}
                                        />
                                    </div>

                                    {itemType === 'produto' && (
                                        <>
                                            <div className="form-group">
                                                <label htmlFor="marca">Marca</label>
                                                <input
                                                    type="text"
                                                    id="marca"
                                                    name="marca"
                                                    value={formData.marca}
                                                    onChange={handleInputChange}
                                                    placeholder="Marca do produto"
                                                />
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label htmlFor="peso">Peso (kg)</label>
                                                    <input
                                                        type="number"
                                                        id="peso"
                                                        name="peso"
                                                        value={formData.peso}
                                                        onChange={handleInputChange}
                                                        placeholder="0.00"
                                                        step="0.01"
                                                    />
                                                </div>
                                                <div className="form-group">
                                                    <label htmlFor="preco">Preço de Venda (R$)</label>
                                                    <input
                                                        type="text"
                                                        id="preco"
                                                        name="preco"
                                                        value={priceInput}
                                                        onChange={handleInputChange}
                                                        placeholder="R$ 0,00"
                                                    />
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="link">Link</label>
                                                <input
                                                    type="text"
                                                    id="link"
                                                    name="link"
                                                    value={formData.link}
                                                    onChange={handleInputChange}
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        </>
                                    )}

                                    {itemType === 'servico' && (
                                        <div className="form-group">
                                            <label htmlFor="preco">Preço (R$)</label>
                                            <input
                                                type="text"
                                                id="preco"
                                                name="preco"
                                                value={priceInput}
                                                onChange={handleInputChange}
                                                placeholder="R$ 0,00"
                                            />
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label htmlFor="descricaoDetalhada">Descrição Detalhada</label>
                                        <textarea
                                            ref={textareaRef}
                                            id="descricaoDetalhada"
                                            name="descricaoDetalhada"
                                            value={formData.descricaoDetalhada}
                                            onChange={(e) => {
                                                setFormData(prev => ({ ...prev, descricaoDetalhada: e.target.value }));
                                                autoResize(e.target);
                                            }}
                                            placeholder={itemType === 'servico' ? 'Descreva mais sobre o serviço...' : 'Descrição completa do produto...'}
                                            rows={4}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        {itemType && (
                            <div className="modal-footer">
                                <button className="secondary-button" onClick={handleCloseModal}>Cancelar</button>
                                <button className="primary-button" onClick={handleSaveProduct}>Salvar</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsPage;
