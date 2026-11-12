# Sorteio Futebol

Aplicação para realizar, acompanhar e manter ao vivo o sorteio de 25 participantes em cinco times de cinco pessoas.

## Estado atual

Esta primeira etapa prepara o backend e a infraestrutura do projeto:

- Node.js, Express e Socket.IO;
- PostgreSQL hospedado no Neon;
- estado persistente único do sorteio;
- estados `IDLE`, `DRAWING` e `COMPLETED`;
- animação prevista de sete segundos;
- health checks da aplicação e do banco;
- configuração inicial para Render e GitHub Actions.

As rotas administrativas e a lógica que efetivamente sorteia e reseta os times serão implementadas na próxima etapa.

## Requisitos

- Node.js 20 ou superior;
- uma base PostgreSQL, como o Neon.

## Configuração local

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e preencha os valores.

3. Crie as tabelas:

   ```bash
   npm run migrate
   ```

4. Inicie o servidor:

   ```bash
   npm run dev
   ```

## Endpoints iniciais

| Endpoint | Finalidade |
| --- | --- |
| `GET /api` | Identificação da API |
| `GET /api/health` | Estado da aplicação |
| `GET /api/health/database` | Estado da conexão com o banco |

Ao abrir uma conexão Socket.IO, o servidor envia o estado persistido pelo evento `draw:state`.

## Próximas etapas

- cadastrar os nomes reais dos 25 participantes;
- implementar autenticação do administrador;
- implementar as ações de sortear e resetar;
- transmitir a animação e o resultado para todos os visitantes;
- integrar o frontend responsivo baseado nos protótipos.

O arquivo `data/participants.json` contém nomes temporários e poderá ser substituído antes da importação para o banco.
