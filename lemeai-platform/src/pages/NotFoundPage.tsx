import React from 'react';
import { Link } from 'react-router-dom';
import pageNotFound from '../assets/undraw_nao_encontrado.svg';


const NotFoundPage = () => {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>404 - Página Não Encontrada</h1>
      <p>Ops! A página que você está procurando não existe.</p>
      {/* Exemplo de imagem para um erro 404 */}
      <img
        src={pageNotFound}
        alt="Página não encontrada"
        style={{ maxWidth: '400px', margin: '30px auto' }}
      />
      <p>
        <Link to="/dashboard">Voltar para a página inicial</Link>
      </p>
    </div>
  );
};

export default NotFoundPage;