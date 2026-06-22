import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
const MOCK_PLACEHOLDER = /CHAVE_SUBSTITUIR_PELA_SUA_API_KEY|your_gemini_api_key_here/i;
const MOCK_MODE = !GEMINI_API_KEY || MOCK_PLACEHOLDER.test(GEMINI_API_KEY);

if (MOCK_MODE) {
  console.warn('Aviso: GEMINI_API_KEY ausente ou com valor de placeholder. O servidor entrará em modo de simulação de resposta.');
}

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido no corpo da requisição.' });
  }
  next(err);
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor de triagem ativo' });
});

app.post('/api/triagem', async (req, res) => {
  const { equipamento, sintoma } = req.body;

  if (!equipamento || !sintoma) {
    return res.status(400).json({ error: 'Os campos equipamento e sintoma são obrigatórios.' });
  }

  const prompt = `Você é um Engenheiro de Manutenção Sênior em uma fábrica industrial. O operador informou o equipamento e o sintoma da falha abaixo. GERE UMA RESPOSTA DIRETA, EM PORTUGUÊS, COM FOCO EM PASSOS PRÁTICOS DE TRIAGEM E SEGURANÇA. NÃO RESPONDA COM INFORMAÇÕES GENÉRICAS.

Equipamento: ${equipamento}
Sintoma: ${sintoma}

Sua resposta deve conter:
1. Três passos numerados de triagem técnica e de segurança imediata, considerando lockout/tagout, inspeção visual e ações que o operador pode executar antes de chamar a engenharia.
2. Um breve comentário final indicando se o operador deve acionar a equipe de engenharia após a triagem.
3. Linguagem clara e direta, como se fosse um guia rápido na IHM da fábrica.

Responda apenas com o protocolo e a recomendação, sem cabeçalhos longos ou explicações desnecessárias.`;

  try {
    if (MOCK_MODE) {
      const mockOutput = `1. Pare a máquina e aplique lockout/tagout no circuito de alimentação do motor. Confirme visualmente que o disjuntor está desarmado antes de qualquer intervenção.
2. Verifique o arranjo de ventilação e a integridade do acoplamento do motor. Procure por acúmulo de poeira, folgas mecânicas e sinais de escorregamento ou atrito.
3. Inspecione a carcaça do motor e os cabos de alimentação para detectar sobreaquecimento, isolamento danificado ou conector solto. Se a temperatura permanecer superior ao normal, acione a engenharia.

Após a triagem, se o superaquecimento persistir ou houver ruído anômalo, acione a equipe de engenharia imediatamente.`;
      return res.json({ protocolo: mockOutput });
    }

    const endpointBase = 'https://generativelanguage.googleapis.com/v1beta2/models/gemini-3.5-flash:generateText';
    const endpoint = `${endpointBase}?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const response = await axios.post(endpoint, {
      prompt: {
        text: prompt
      },
      temperature: 0.2,
      maxOutputTokens: 420
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const output = response.data?.candidates?.[0]?.output || response.data?.output;

    if (!output) {
      throw new Error('Resposta inesperada da API Gemini.');
    }

    return res.json({ protocolo: output.trim() });
  } catch (error) {
    console.error('Falha na consulta ao Gemini:', error?.response?.data || error.message || error);
    return res.status(502).json({
      error: 'Erro ao gerar o protocolo de triagem. Tente novamente em alguns instantes ou acione a manutenção manualmente.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor backend rodando em http://localhost:${PORT}`);
});
