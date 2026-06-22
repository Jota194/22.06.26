import { useState } from 'react';

const equipamentos = [
  'Motor de Transportador',
  'Esteira Rolante',
  'Bomba Centrífuga',
  'CLP / Controlador Lógico',
  'Sistema de Visão',
  'Frequência Inversor'
];

function App() {
  const [equipamento, setEquipamento] = useState(equipamentos[0]);
  const [sintoma, setSintoma] = useState('');
  const [protocolo, setProtocolo] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!sintoma.trim()) {
      setErro('Descreva o sintoma da falha antes de enviar.');
      return;
    }

    setErro('');
    setProtocolo('');
    setCarregando(true);

    try {
      const response = await fetch('http://localhost:4000/api/triagem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ equipamento, sintoma })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Falha na comunicação com o servidor.');
      }

      setProtocolo(data.protocolo || 'Nenhuma resposta recebida.');
    } catch (fetchError) {
      console.error(fetchError);
      setErro(fetchError.message || 'Erro de rede ou serviço indisponível. Acione a manutenção manualmente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleReset = () => {
    setEquipamento(equipamentos[0]);
    setSintoma('');
    setProtocolo('');
    setErro('');
  };

  const renderProtocolo = () => {
    if (!protocolo) return null;

    return (
      <div className="card resultado-card">
        <h2>Protocolo de Triagem</h2>
        {protocolo.split('\n').map((linha, index) => (
          <p key={index}>{linha}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="app-shell">
      <header className="painel-header">
        <div>
          <span className="tag">Assistente Técnico Inteligente</span>
          <h1>IHM de Triagem de Falhas</h1>
          <p>Selecione o equipamento, descreva o sintoma e gere o protocolo de triagem.</p>
        </div>
      </header>

      <main>
        <form className="painel-form" onSubmit={handleSubmit}>
          <label>
            Equipamento
            <select value={equipamento} onChange={(event) => setEquipamento(event.target.value)}>
              {equipamentos.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label>
            Descrição do Sintoma
            <textarea
              rows="5"
              value={sintoma}
              onChange={(event) => setSintoma(event.target.value)}
              placeholder="Ex: superaquecimento no motor da esteira, ruído anômalo, falha de comunicação com CLP"
            />
          </label>

          <div className="actions-row">
            <button type="submit" disabled={carregando}>
              {carregando ? 'Gerando Protocolo de Triagem...' : 'Gerar Protocolo'}
            </button>
            <button type="button" className="secondary" onClick={handleReset}>
              Resetar Tela
            </button>
          </div>

          {erro && <div className="alert error">{erro}</div>}
        </form>

        {renderProtocolo()}
      </main>
    </div>
  );
}

export default App;
