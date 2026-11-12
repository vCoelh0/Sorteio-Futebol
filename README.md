# Sorteio Futebol

Aplicação para realizar, acompanhar e manter ao vivo o sorteio de 25 participantes em cinco times de cinco pessoas.

## Estado atual

O backend já executa e persiste o sorteio completo:

- Node.js, Express e Socket.IO;
- PostgreSQL hospedado no Neon;
- estado persistente único do sorteio;
- estados `IDLE`, `DRAWING` e `COMPLETED`;
- animação prevista de sete segundos;
- health checks da aplicação e do banco;
- configuração para Render e GitHub Actions;
- autenticação das ações administrativas;
- sorteio aleatório dos cinco times, sem nomes repetidos;
- transmissão simultânea do início, resultado e reset pelo Socket.IO;
- recuperação automática de um sorteio após reinício do servidor.

Ao iniciar, todos os clientes recebem o estado `DRAWING`. Sete segundos depois, recebem os cinco times pelo evento `draw:state`. O resultado permanece salvo até o administrador resetá-lo.

## Requisitos

- Node.js 20 ou superior;
- uma base PostgreSQL, como o Neon.

## Configuração local

1. Instale as dependências:

   ```bash
   npm ci
   ```

2. Copie `.env.example` para `.env` e preencha os valores.

   `ADMIN_PASSWORD` é a senha digitada na tela de login. `ADMIN_TOKEN` é o token interno devolvido após o login e pode ser qualquer valor secreto diferente da senha.

3. Crie as tabelas e importe os participantes de `data/participants.json`:

   ```bash
   npm run migrate
   npm run seed
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
| `GET /api/draw` | Estado público atual do sorteio |
| `POST /api/admin/login` | Valida a senha e devolve o token administrativo |
| `GET /api/admin/session` | Verifica se o token ainda é válido |
| `POST /api/admin/draw` | Inicia o sorteio de sete segundos |
| `POST /api/admin/reset` | Limpa o resultado e retorna para `IDLE` |

O login recebe `{ "password": "..." }`. As demais rotas administrativas exigem `Authorization: Bearer <token>` ou o cabeçalho `x-admin-token`. Para sair, o frontend só precisa apagar o token armazenado localmente.

Ao abrir uma conexão Socket.IO, o servidor envia o estado persistido pelo evento `draw:state`. O mesmo evento é transmitido a todos no início e na conclusão do sorteio e após o reset. Enquanto o estado é `DRAWING`, os times permanecem ocultos na API e no socket.

## Próximas etapas

- cadastrar os nomes reais dos 25 participantes;
- integrar o frontend responsivo baseado nos protótipos.

O arquivo `data/participants.json` contém nomes temporários e poderá ser substituído antes da importação para o banco.
