
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import './ProductsPage.css';
import { ProductService, type Product, type CreateProductDTO } from '../services/ProductService';

const ProductsPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState<CreateProductDTO>({
        codigo: '',
        nome: '',
        marca: '',
        preco: 0,
        peso: 0
    });

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

    const handleOpenModal = (product?: Product) => {
        if (product) {
            setCurrentProduct(product);
            setFormData({
                codigo: product.codigo,
                nome: product.nome,
                marca: product.marca,
                preco: product.preco,
                peso: product.peso
            });
        } else {
            setCurrentProduct(null);
            setFormData({
                codigo: '',
                nome: '',
                marca: '',
                preco: 0,
                peso: 0
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentProduct(null);
        setFormData({
            codigo: '',
            nome: '',
            marca: '',
            preco: 0,
            peso: 0
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'preco' || name === 'peso' ? Number(value) : value
        }));
    };

    const handleSaveProduct = async () => {
        if (!formData.codigo || !formData.nome) {
            toast.error('Código e Nome são obrigatórios.');
            return;
        }

        try {
            if (currentProduct) {
                // Edit
                const response = await ProductService.update({
                    produtoId: currentProduct.produtoId,
                    ...formData
                });
                if (response.sucesso) {
                    toast.success('Produto atualizado com sucesso!');
                    loadProducts();
                    handleCloseModal();
                } else {
                    toast.error(response.mensagem || 'Erro ao atualizar produto.');
                }
            } else {
                // Create
                const response = await ProductService.create(formData);
                if (response.sucesso) {
                    toast.success('Produto criado com sucesso!');
                    loadProducts();
                    handleCloseModal();
                } else {
                    toast.error(response.mensagem || 'Erro ao criar produto.');
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
        <div className="products-page">
            <div className="page-header">
                <h1>Produtos</h1>
                <button className="add-button" onClick={() => handleOpenModal()}>
                    <FaPlus /> Novo Produto
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
                                        <td>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco)}</td>
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
                            <h2>{currentProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
                            <button className="close-button" onClick={handleCloseModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label htmlFor="codigo">Código</label>
                                <input
                                    type="text"
                                    id="codigo"
                                    name="codigo"
                                    value={formData.codigo}
                                    onChange={handleInputChange}
                                    placeholder="Ex: 001"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="nome">Nome</label>
                                <input
                                    type="text"
                                    id="nome"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleInputChange}
                                    placeholder="Nome do produto"
                                />
                            </div>
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
                            <div className="form-group">
                                <label htmlFor="preco">Preço</label>
                                <input
                                    type="number"
                                    id="preco"
                                    name="preco"
                                    value={formData.preco}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    step="0.01"
                                />
                            </div>
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
                        </div>
                        <div className="modal-footer">
                            <button className="secondary-button" onClick={handleCloseModal}>Cancelar</button>
                            <button className="primary-button" onClick={handleSaveProduct}>Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsPage;
