# VendaBot Dashboard

Crie um painel web chamado "VendaBot" para gerenciar um bot de automação de marketing no WhatsApp voltado para afiliados. Tema visual: dark mode, cores #0d0f14 (fundo), #25D366 (verde WhatsApp como cor de destaque), #a78bfa (roxo para elementos de IA), fonte Inter para texto e Space Grotesk para títulos. Sidebar fixa à esquerda com navegação, conteúdo principal à direita.

Conecte ao Supabase (nativo do Lovable) usando o projeto Supabase já conectado a este workspace. As tabelas já existem no banco — NÃO crie tabelas novas, apenas use as existentes:

1. products
   - id (uuid, pk)
   - user_id (uuid, referência ao usuário logado)
   - name (text)
   - platform (text) -- "shopee" ou "mercadolivre"
   - old_price (numeric)
   - price (numeric)
   - link (text)
   - image_url (text, opcional)
   - category (text, opcional)
   - created_at (timestamp, default now())

2. groups
   - id (uuid, pk)
   - user_id (uuid)
   - name (text)
   - whatsapp_gid (text) -- ID do grupo tipo 120363...@g.us
   - role (text) -- "admin" ou "member"
   - created_at (timestamp, default now())

3. schedules
   - id (uuid, pk)
   - user_id (uuid)
   - time (text) -- formato "HH:MM"
   - repeat (text) -- "daily" ou "weekdays"
   - group_ids (uuid[]) -- array de ids da tabela groups
   - category (text, opcional) -- categoria forçada, ou null para o agente decidir
   - created_at (timestamp, default now())

Use a autenticação por email/senha do Supabase (Auth) já configurada, com tela de login simples antes de acessar o painel.

As tabelas já devem ter RLS (Row Level Security) ativado, restringindo cada usuário a ver e editar apenas suas próprias linhas (user_id = auth.uid()). Verifique se está funcionando corretamente com as políticas existentes.

Páginas do painel (navegação lateral):

- Painel (dashboard): cards com contagem de produtos, horários ativos e grupos cadastrados. Lista dos próximos horários agendados.
- Produtos: formulário para adicionar produto (nome, plataforma, preço antigo, preço atual, link de afiliado, URL de imagem, categoria opcional) com cálculo automático de % de desconto exibido em tempo real. Lista dos produtos cadastrados com opção de editar e excluir.
- Horários: formulário para adicionar horário de disparo (horário, repetição diária ou dias úteis, seleção de múltiplos grupos via checkbox, categoria opcional do produto). Lista dos horários cadastrados.
- Grupos: formulário para adicionar grupo do WhatsApp (nome, ID do grupo no formato xxx@g.us, papel: admin ou membro). Lista dos grupos cadastrados.
- Preview IA: seletor de produto cadastrado + botão que simula uma mensagem de venda gerada automaticamente (texto com nome do produto, preço riscado, preço atual, % de desconto, e link), com opção de gerar outra variação.

Todas as operações de adicionar/editar/excluir devem salvar diretamente no Supabase (sem localStorage). Adicione indicador de status "conectado/desconectado" no topo da sidebar (placeholder por enquanto, vamos integrar com o bot real depois).

Não implemente ainda: geração real de QR Code, conexão com WhatsApp, ou envio de mensagens — isso será feito em uma etapa posterior por um serviço separado (bot Node.js hospedado no Render) que vai ler e escrever nessas mesmas tabelas do Supabase.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/46cdbc07-b716-4957-bae2-acc87a667020).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
