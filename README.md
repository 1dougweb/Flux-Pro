# FLUXPRO - Gestao de Obras, Cortes CNC e Producao (Comunicacao Visual)

Sistema profissional de gestao operacional para empresas de **Comunicacao Visual, Fachadas em ACM, Letras Caixa e Usinagem CNC Router / Laser**.

Projetado para eliminar esquecimentos na liberacao de arquivos de corte, organizar pecas por ambiente de obra, controlar a separacao de insumos eletricos/quimicos e garantir o cumprimento de prazos de entrega.

Construido com **React 18 + Vite + TypeScript + Tailwind CSS** (paleta monocromatica neutra de alta densidade, sem emojis e sem gradientes, com modo claro e modo escuro em tons de preto puro). Compativel com **Supabase** e pronto para deploy instantaneo na **Vercel**.

---

## Recursos Principais

### 1. Gestao por Ordem de Servico (OS) com Pagina Dedicada
- **Navegacao em Pagina Completa**: Ao selecionar uma obra, o sistema abre uma tela dedicada com todas as informacoes carregadas (pecas, arquivos CNC, plano de corte, materiais e historico).
- **Abertura Fluida**: Ao cadastrar uma nova OS, a navegacao direciona imediatamente para a pagina da obra.
- **Edicao Rapida no Lapis**: Botao de lapis no cabecalho para abrir modal focado de edicao cadastral (cliente, telefone, projeto, status, prazos, tags e ambientes).

### 2. Ambientacao por Obra & Sidebar Interno
- **Sidebar Exclusivo da Obra**: O menu de ambientes fica dentro da pagina da obra, evitando misturar ambientes de clientes distintos.
- **Filtros Simultaneos (Multi-select)**: Checkboxes tecnicos para filtrar pecas de multiplos ambientes ao mesmo tempo.
- **Modo Unico**: Atalho ao passar o mouse para isolar um ambiente com 1 clique.
- **Contador em Tempo Real**: Quantidade de pecas cadastradas por ambiente.
- **Adicao Rapida Inline**: Botao para cadastrar novos ambientes diretamente no sidebar interno.

### 3. Tabela de Pecas da Planta com Arquivos de Corte
- Cadastro de pecas com codigo, medidas (L x A x P em mm), quantidade e iluminacao.
- Vinculacao direta de **arquivos de corte (.DXF, .CDR, .EPS, .AI, .NC)** com status de corte (Pendente, Cortado, Liberado).
- Alerta visual antiesquecimento para pecas que ainda nao possuem arquivo de corte anexado.
- Anexacao e visualizacao de fotos de referencia.

### 4. Plano de Otimizacao e Corte CNC (CAM)
- Registro de software CAM (ArtCAM, Aspire, CorelDRAW, AutoCAD).
- Maquina de destino (Router CNC, Laser CO2, Plotter de Recorte).
- Contagem e especificacao de chapas de ACM, Acrilico, MDF e metragem de vinil/lona.
- Trava formal de liberacao para a fabrica com conferencia do projetista.

### 5. Separacao de Materiais e Kit Padrao de CV
- Controle de insumos (Chapas, Insumos Eletricos, Fixacao Quimica, Serralheria, Vinis).
- Botao de insercao automatica do **Kit CV Padrao** (modulos LED 12V injetados, fontes chaveadas slim 12V 20A, selante PU 40 e fita dupla face estrutural 3M VHB).
- Barra de progresso de separacao com alertas de compras pendentes.

### 6. Fluxo da Producao (Kanban de Obras)
- Quadro Kanban com 5 colunas estrategicas:
  1. *Layout / Medicao*
  2. *Arquivos CNC / Router*
  3. *Separacao de Materiais*
  4. *Usinagem & Producao*
  5. *Pronto / Instalacao*
- Drag and drop fluido com indicadores visuais de soltura e cartoes de obra completos.

### 7. Armazenamento Hibrido (Local + Nuvem)
- Funciona 100% offline ou em modo local via `localStorage`.
- Sincronizacao em tempo real com **Supabase (PostgreSQL)** quando configurado.

### 8. Autenticacao Completa, Recuperacao de Senha e Google Auth
- **Login e Cadastro com Email**: validacao de senha minima, mensagens de erro amigaveis e confirmacao por email.
- **Login com Google (OAuth)**: integracao com Google Cloud e Supabase Auth para acesso rapido em 1 clique.
- **Recuperacao de Senha**: envio de link seguro por email para redefinicao de senha diretamente no app.
- **Menu de Usuario no Navbar**: avatar ou iniciais, exibicao do email, atalho para alterar senha e opcao de logout.
- **Modo Convidado Flexivel**: permite testar e usar em modo local sem bloqueio caso o usuario ainda nao tenha configurado o Supabase.

---

## Como Rodar Localmente

### Pre-requisitos
- Node.js versao 18 ou superior instalado.
- Gerenciador de pacotes `npm`.

### Instalacao e Execucao

```bash
# 1. Clonar ou abrir a pasta do projeto
cd flux-pro

# 2. Instalar dependencias (se ainda nao instaladas)
npm install

# 3. Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse o endereco exibido no terminal (geralmente `http://localhost:3000`).

---

## Como Subir para o GitHub

Execute os comandos abaixo no terminal dentro da pasta do projeto:

```bash
# 1. Verificar os arquivos que serao rastreados
git status

# 2. Adicionar todos os arquivos ao controle de versao
git add .

# 3. Criar o primeiro commit
git commit -m "feat: release inicial FLUXPRO para Comunicacao Visual"

# 4. Renomear o branch principal para main (padrao do GitHub)
git branch -M main

# 5. Conectar com o repositorio remoto no GitHub
# (Substitua a URL pelo link do seu repositorio criado no GitHub)
git remote add origin https://github.com/SEU-USUARIO/flux-pro.git

# 6. Enviar para o GitHub
git push -u origin main
```

---

## Como Fazer Deploy na Vercel

O projeto ja possui o arquivo `vercel.json` configurado com regras de reescrita para Single Page Application (SPA), garantindo que navegacao e recarregamento de paginas funcionem perfeitamente.

### Passo a Passo na Vercel:

1. Acesse [vercel.com](https://vercel.com) e faca login com sua conta do GitHub.
2. Clique em **Add New...** > **Project**.
3. Localize e selecione o repositorio `flux-pro` recem-enviado.
4. Na tela de configuracao do projeto:
   - **Framework Preset**: Vite (detectado automaticamente).
   - **Root Directory**: `./` (raiz).
   - **Build Command**: `npm run build` (detectado automaticamente).
   - **Output Directory**: `dist` (detectado automaticamente).
5. **Variaveis de Ambiente (Opcional)**:
   - Abra a secao **Environment Variables**.
   - Adicione suas chaves do Supabase para conectar a nuvem:
     - `VITE_SUPABASE_URL`: URL do seu projeto no Supabase (ex: `https://seu-projeto.supabase.co`).
     - `VITE_SUPABASE_ANON_KEY`: chave publica anon do seu projeto.
   - *Nota: Se nao adicionar as variaveis, o aplicativo funcionara normalmente usando armazenamento local (localStorage) no navegador do usuario.*
6. Clique em **Deploy**.
7. Em menos de 1 minuto seu sistema estara no ar com certificado SSL gratuito e alta velocidade global.

---

## Configuracao do Banco de Dados no Supabase (Opcional)

Para ativar a sincronizacao na nuvem:

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto.
2. No menu lateral esquerdo, clique em **SQL Editor** > **New Query**.
3. Abra o arquivo [`supabase/schema.sql`](supabase/schema.sql) deste projeto, copie todo o seu conteudo e cole no editor do Supabase.
4. Clique em **Run** para criar as tabelas (`ordens_servico`, `itens_planta`, `planos_corte`, `itens_material`, `historico_os`) e politicas de seguranca.
5. Em **Project Settings** > **API**, copie:
   - **Project URL**
   - **Project API Keys (anon public)**
6. Adicione essas chaves nas variaveis da Vercel ou na janela **Configuracoes do Banco** diretamente no proprio FLUXPRO.

---

## Estrutura do Projeto

```
flux-pro/
├── .env.example              # Exemplo de variaveis de ambiente
├── .gitignore                # Protecao de node_modules, dist e chaves locais
├── index.html                # Ponto de entrada HTML com fontes JetBrains Mono
├── package.json              # Scripts e dependencias do projeto
├── README.md                 # Documentacao completa de instalacao e deploy
├── vercel.json               # Configuracao de roteamento SPA da Vercel
├── vite.config.ts            # Configuracao do Vite e React
├── tailwind.config.js        # Configuracao de design system monocromatico
├── supabase/
│   └── schema.sql            # Script SQL completo de criacao de tabelas e RLS
└── src/
    ├── App.tsx               # Roteamento SPA e orquestrador principal
    ├── index.css             # Estilos globais e variaveis Tailwind
    ├── main.tsx              # Bootstrap do React
    ├── types/
    │   └── index.ts          # Tipos TypeScript para OS, Pecas, Cortes e Materiais
    ├── hooks/
    │   ├── useOrders.ts      # Logica de estado, filtros e persistencia
    │   └── useTheme.ts       # Alternancia de tema claro/escuro
    ├── lib/
    │   ├── storage.ts        # Camada de persistencia hibrida e seed data
    │   └── supabase.ts       # Cliente Supabase e validacao de conexao
    └── components/
        ├── common/           # Badges tecnicos e contagem regressiva
        ├── layout/           # Barra de navegacao e Sidebar global
        ├── dashboard/        # Metricas antiesquecimento de corte e separacao
        ├── os/               # OSDetailPage, OSEditModal, OSList, OSKanban, OSFormModal
        ├── planta/           # ItemPlantaTable, ItemPlantaFormModal, PhotoViewerModal
        ├── materials/        # MaterialProgressBar
        └── settings/         # SupabaseModal para diagnostico de conexao
```

---

## Licenca
Este projeto e de uso profissional e privado. Desenvolvido para maxima eficiencia operacional de projetistas e gestores de Comunicacao Visual.
