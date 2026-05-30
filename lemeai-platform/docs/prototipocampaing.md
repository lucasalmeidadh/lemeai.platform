import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Info, MessageSquare, Link as LinkIcon, Phone } from 'lucide-react';

function App() {
  // --- Estados do Formulário ---
  const [templateName, setTemplateName] = useState('testemarketing');
  const [language, setLanguage] = useState('pt_BR');
  const [headerFormat, setHeaderFormat] = useState('TEXT'); // NONE, TEXT, IMAGE, VIDEO, DOCUMENT
  const [headerText, setHeaderText] = useState('CRM para sua empresa');
  const [bodyText, setBodyText] = useState('Olá {{1}}, buscando um CRM integrado ao Whatsapp?\nUm agente de IA que atende seus clientes?\nConheça o LemeAI CRM da GB Code, uma plataforma única para você vender mais!!\n\nAcesse nosso site e saiba mais.');
  const [footerText, setFooterText] = useState('LemeIA – Atendimento inteligente');
  const [buttons, setButtons] = useState([
    { type: 'URL', text: 'Acessar site', url: 'https://gbcode.com.br' }
  ]);

  // Estado para armazenar os valores de exemplo das variáveis (ex: {{1}}: "João")
  const [variableMappings, setVariableMappings] = useState({});

  // --- Lógica de Variáveis Dinâmicas ---
  // Detecta variáveis {{n}} no corpo do texto e atualiza os campos de exemplo necessários
  useEffect(() => {
    const regex = /\{\{(\d+)\}\}/g;
    let match;
    const foundVariables = new Set();
    while ((match = regex.exec(bodyText)) !== null) {
      foundVariables.add(match[1]);
    }

    setVariableMappings(prev => {
      const newMappings = { ...prev };
      // Remove exemplos de variáveis que não existem mais no texto
      Object.keys(newMappings).forEach(key => {
        if (!foundVariables.has(key)) {
          delete newMappings[key];
        }
      });
      // Adiciona chaves para novas variáveis encontradas, se ainda não existirem
      foundVariables.forEach(num => {
        if (!newMappings[num]) {
          newMappings[num] = '';
        }
      });
      return newMappings;
    });
  }, [bodyText]);

  const handleVariableChange = (num, value) => {
    setVariableMappings(prev => ({ ...prev, [num]: value }));
  };

  // --- Lógica de Botões ---
  const addButton = () => {
    if (buttons.length < 3) { // Meta geralmente limita a 3 botões principais
      setButtons([...buttons, { type: 'URL', text: '', url: '' }]);
    }
  };

  const updateButton = (index, field, value) => {
    const newButtons = [...buttons];
    newButtons[index][field] = value;
    setButtons(newButtons);
  };

  const removeButton = (index) => {
    const newButtons = buttons.filter((_, i) => i !== index);
    setButtons(newButtons);
  };

  // --- Função auxiliar para renderizar o corpo com as variáveis substituídas ---
  const renderPreviewBody = () => {
    let processedText = bodyText;
    Object.entries(variableMappings).forEach(([num, value]) => {
      const replacement = value || `{{${num}}}`; // Usa o exemplo ou mantém o placeholder se vazio
      processedText = processedText.replace(new RegExp(`\\{\\{${num}\\}\\}`, 'g'), replacement);
    });
    // Converte quebras de linha em <br>
    return processedText.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        <br />
      </span>
    ));
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 font-sans text-slate-800 overflow-y-auto sm:overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col">
        
        {/* --- Modal Header --- */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900">Editar Template de Campanha</h2>
          <button className="text-slate-400 hover:text-slate-600 transition">
            <X size={24} />
          </button>
        </div>

        {/* --- Modal Body (Scrollable Area) --- */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          
          {/* Warning Alert */}
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8 flex items-start rounded-r-md">
            <Info className="text-amber-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-amber-800">
              <span className="font-bold">Atenção:</span> Ao editar, o template será atualizado diretamente na Meta e passará por um novo processo de aprovação.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* --- LEFT COLUMN: Form --- */}
            <div className="flex-1 space-y-8">
              
              {/* Section 1: Configurações Gerais */}
              <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                  Configurações Gerais
                </h3>
                <div className="grid gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome do template <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500Bg-slate-50"
                      placeholder="Ex: promocao_natal"
                    />
                    <p className="text-xs text-slate-500 mt-1">Letras minúsculas, números e underscores.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Idioma <span className="text-red-500">*</span></label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pt_BR">Português (Brasil)</option>
                      <option value="en_US">Inglês (EUA)</option>
                      <option value="es_ES">Espanhol</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Section 2: Estrutura da Mensagem */}
              <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                 <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                  Estrutura da Mensagem
                  <MessageSquare size={18} className="ml-2 text-slate-400"/>
                </h3>
                <div className="space-y-5">
                  {/* Cabeçalho */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Formato do cabeçalho</label>
                    <select
                      value={headerFormat}
                      onChange={(e) => setHeaderFormat(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-md mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="NONE">Nenhum</option>
                      <option value="TEXT">Texto</option>
                      <option value="IMAGE">Imagem (Mídia)</option>
                    </select>
                    {headerFormat === 'TEXT' && (
                       <input
                        type="text"
                        value={headerText}
                        onChange={(e) => setHeaderText(e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Texto do cabeçalho (opcional)"
                        maxLength={60}
                      />
                    )}
                     {headerFormat === 'IMAGE' && (
                      <div className="border-2 border-dashed border-slate-300 rounded-md p-6 text-center bg-slate-50">
                        <p className="text-sm text-slate-500">Upload de imagem será feito na etapa de envio.</p>
                      </div>
                     )}
                  </div>

                  {/* Corpo */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Texto do corpo <span className="text-red-500">*</span></label>
                    <textarea
                      rows={6}
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder="Digite sua mensagem. Use {{1}}, {{2}} para variáveis."
                    />
                    <p className="text-xs text-slate-500 mt-1">Use <code>{'{{1}}'}</code>, <code>{'{{2}}'}</code> etc. para inserir variáveis dinâmicas.</p>
                  </div>

                  {/* Variáveis Dinâmicas (Aparecem apenas se detectadas no corpo) */}
                  {Object.keys(variableMappings).length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-100 animate-fadeIn">
                      <label className="block text-sm font-semibold text-blue-800 mb-3">Exemplos das variáveis detectadas:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.keys(variableMappings).sort().map((num) => (
                          <div key={num}>
                            <label className="block text-xs font-medium text-blue-700 mb-1">Variável {`{{${num}}}`}</label>
                            <input
                              type="text"
                              value={variableMappings[num]}
                              onChange={(e) => handleVariableChange(num, e.target.value)}
                              className="w-full p-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder={`Exemplo para {{${num}}}`}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-blue-600 mt-2">Esses exemplos são usados para aprovação da Meta e na pré-visualização.</p>
                    </div>
                  )}

                  {/* Rodapé */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rodapé</label>
                    <input
                      type="text"
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Texto curto no final da mensagem"
                      maxLength={60}
                    />
                    <p className="text-xs text-slate-500 mt-1">Máx. 60 caracteres. Sem variáveis.</p>
                  </div>
                </div>
              </section>

               {/* Section 3: Interatividade (Botões) */}
              <section className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-slate-900 flex items-center">Botões</h3>
                   <button
                    onClick={addButton}
                    disabled={buttons.length >= 3}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} className="mr-1" /> Adicionar botão
                  </button>
                </div>
                
                {buttons.length === 0 ? (
                   <p className="text-sm text-slate-500 italic">Nenhum botão adicionado.</p>
                ) : (
                  <div className="space-y-3">
                    {buttons.map((button, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-3 p-3 border border-slate-200 rounded-md bg-slate-50 items-start sm:items-center group relative">
                        {/* Tipo do Botão */}
                        <select
                          value={button.type}
                          onChange={(e) => updateButton(index, 'type', e.target.value)}
                          className="p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 flex-shrink-0 w-full sm:w-auto"
                        >
                          <option value="URL">Link (URL)</option>
                          <option value="PHONE_NUMBER">Telefone</option>
                          <option value="QUICK_REPLY">Resposta Rápida</option>
                        </select>

                        {/* Texto do Botão */}
                         <input
                            type="text"
                            value={button.text}
                            onChange={(e) => updateButton(index, 'text', e.target.value)}
                            className="flex-1 p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 w-full"
                            placeholder="Texto do botão (ex: Ver site)"
                            maxLength={20}
                          />

                          {/* Valor do Botão (URL ou Telefone) */}
                         {button.type !== 'QUICK_REPLY' && (
                           <input
                            type="text"
                            value={button.url}
                            onChange={(e) => updateButton(index, 'url', e.target.value)}
                            className="flex-1 p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 w-full"
                            placeholder={button.type === 'URL' ? 'https://...' : '+551199999999'}
                          />
                         )}
                         
                        <button
                          onClick={() => removeButton(index)}
                          className="text-slate-400 hover:text-red-500 transition p-1 sm:static absolute top-1 right-1"
                          title="Remover botão"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                 <p className="text-xs text-slate-500 mt-3">Máximo de 3 botões principais.</p>
              </section>

            </div>

            {/* --- RIGHT COLUMN: Sticky Preview --- */}
            <div className="lg:w-[400px] flex-shrink-0">
              <div className="sticky top-6">
                 {/* Header estilo WhatsApp */}
                <div className="bg-[#008069] text-white p-3 rounded-t-xl flex items-center shadow-sm">
                  <span className="font-medium flex-1">Pré-visualização</span>
                   <span className="text-xs opacity-80">WhatsApp Business</span>
                </div>
                
                {/* Corpo estilo WhatsApp */}
                <div className="bg-[#EFEAE2] p-4 rounded-b-xl shadow-md min-h-[400px] bg-opacity-90" style={{backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundBlendMode: 'overlay'}}>
                  
                  {/* Balão da Mensagem */}
                  <div className="bg-white rounded-lg p-3 shadow-sm max-w-[90%] ml-auto relative">
                    {/* Seta do balão */}
                    <div className="absolute top-0 -right-2 w-0 h-0 border-t-[10px] border-t-white border-r-[10px] border-r-transparent"></div>

                    {/* Conteúdo da Mensagem */}
                    <div className="space-y-2">
                      {/* Header do Preview */}
                      {headerFormat === 'TEXT' && headerText && (
                        <div className="font-bold text-slate-900 pb-2">{headerText}</div>
                      )}
                       {headerFormat === 'IMAGE' && (
                        <div className="bg-slate-200 h-32 rounded-md flex items-center justify-center text-slate-500 mb-2">
                          <Info size={24} />
                        </div>
                      )}

                      {/* Body do Preview */}
                      <div className="text-slate-800 text-[15px] leading-relaxed whitespace-pre-wrap">
                        {renderPreviewBody()}
                      </div>

                      {/* Footer do Preview */}
                      {footerText && (
                        <div className="text-xs text-slate-500 pt-1">{footerText}</div>
                      )}
                    </div>

                    {/* Hora e Check (Fake) */}
                     <div className="flex justify-end items-center space-x-1 mt-2">
                      <span className="text-[10px] text-slate-500">16:48</span>
                      <svg viewBox="0 0 16 11" height="11px" width="16px" preserveAspectRatio="xMidYMid meet" class="" version="1.1" x="0px" y="0px" enable-background="new 0 0 16 11"><path fill="#53bdeb" d="M11.058,1.294c-0.201-0.201-0.529-0.201-0.73,0L4.955,6.666L3.57,5.281c-0.201-0.201-0.529-0.201-0.73,0 l-1.52,1.52c-0.201,0.201-0.201,0.529,0,0.73l4.016,4.016c0.195,0.195,0.509,0.2,0.713,0.01l7.832-7.832 c0.201-0.201,0.201-0.529,0-0.73L11.058,1.294z"></path><path fill="#53bdeb" d="M15.372,3.665l-7.832,7.832c-0.204,0.19-0.518,0.185-0.713-0.01l-0.504-0.504 c0.205-0.205,0.538-0.205,0.743,0l0.724,0.724l7.832-7.832c0.201-0.201,0.201-0.529,0-0.73l-1.092-1.092 c-0.201-0.201-0.529-0.201-0.73,0L12.773,3.085L13.865,4.177c0.201,0.201,0.529,0.201,0.73,0l1.507-1.507 c0.201-0.201,0.201-0.529,0-0.73L15.372,3.665z"></path></svg>
                    </div>
                  </div>

                   {/* Botões do Preview (Fora do balão principal, estilo WA interativo) */}
                  {buttons.length > 0 && (
                    <div className="mt-2 space-y-1 max-w-[90%] ml-auto">
                      {buttons.map((btn, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-2.5 text-center text-blue-500 font-medium shadow-sm flex items-center justify-center cursor-pointer hover:bg-slate-50 transition">
                           {btn.type === 'URL' && <LinkIcon size={16} className="mr-2" />}
                           {btn.type === 'PHONE_NUMBER' && <Phone size={16} className="mr-2" />}
                           {btn.text || 'Botão sem texto'}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
                 {/* Aviso abaixo do preview */}
                <p className="text-center text-xs text-slate-500 mt-3 px-4">
                  As variáveis {'{{1}}'}, {'{{2}}'} serão substituídas pelos exemplos informados na visualização.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- Modal Footer --- */}
        <div className="p-6 border-t border-slate-200 flex justify-end space-x-4 bg-white rounded-b-xl">
          <button className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-50 transition">
            Cancelar
          </button>
          <button className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-md hover:bg-slate-800 transition flex items-center">
            Enviar para análise
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;