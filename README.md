# Sistema de Gerenciamento de Estoque EPAMIG

Sistema de gerenciamento de estoque desenvolvido para a EPAMIG, utilizando tecnologias modernas e uma interface intuitiva.

## 🚀 Tecnologias Utilizadas

- **Frontend:**
  - React 18
  - TypeScript
  - Vite
  - TailwindCSS
  - React Router DOM
  - HeadlessUI
  - Lucide Icons
  - React Hot Toast

- **Backend:**
  - Supabase (Banco de dados e autenticação)
  - JSON Server (API de desenvolvimento)

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn
- Conta no Supabase

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/estoque-epamig.git
cd estoque-epamig
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

## 🛠️ Executando o Projeto

1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

2. Para desenvolvimento, inicie também o servidor JSON:
```bash
npm run api
# ou
yarn api
```

3. Para build de produção:
```bash
npm run build
# ou
yarn build
```

## 📦 Funcionalidades

- **Autenticação de Usuários**
  - Login/Logout
  - Gerenciamento de perfis
  - Níveis de acesso (Admin/Usuário)

- **Gerenciamento de Estoque**
  - Cadastro de equipamentos
  - Controle de movimentações
  - Sistema de baixa de itens
  - Histórico de movimentações

- **Interface Intuitiva**
  - Dashboard com visão geral
  - Filtros e busca
  - Notificações em tempo real
  - Design responsivo

## 🏗️ Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
├── config/         # Configurações do projeto
├── contexts/       # Contextos React
├── lib/            # Bibliotecas e utilitários
├── pages/          # Páginas da aplicação
└── App.tsx         # Componente principal
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## ✨ Agradecimentos

- EPAMIG pelo apoio e confiança
- Comunidade open source pelas tecnologias utilizadas
- Todos os contribuidores do projeto
![{0F06EB6A-14AC-4915-86EA-1F676080FA22}](https://github.com/user-attachments/assets/3cc76efa-5b57-4fce-a25d-fa62fd22dfbb)

