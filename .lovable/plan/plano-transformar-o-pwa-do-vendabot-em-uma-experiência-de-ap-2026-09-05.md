# Plano: transformar o PWA do VendaBot em uma experiência de app

## Objetivo
Melhorar somente o VendaBot quando estiver instalado e aberto pela tela inicial do smartphone. O site aberto normalmente no navegador continuará com o layout atual.

## O que a análise encontrou
- A barra inferior tem 8 destinos em rolagem horizontal; opções importantes podem ficar escondidas e a navegação não parece nativa.
- Botões, seletores, campos, caixas de seleção e ícones de ação têm entre 32 e 40 px; no celular instalado, o ideal é no mínimo 44–48 px para toque confortável.
- O espaço de recorte superior e da barra inferior do aparelho não está aplicado por completo.
- Algumas telas apenas encolhem títulos, cards e espaços no modo instalado. Isso deixa o conteúdo mais apertado, mas não mais organizado.
- Formulários longos, listas e ações lado a lado precisam virar blocos próprios para celular, com ações principais largas e fáceis de alcançar.
- Janelas de aviso/tutorial precisam respeitar a altura do smartphone e permitir rolagem sem cortar conteúdo.
- A instalação e os ícones já existem; esta etapa é de experiência visual e navegação, não de alterar banco, pagamentos ou funcionamento do bot.

## Mudanças propostas

### 1. Estrutura exclusiva do app instalado
- Criar uma barra superior compacta com marca VendaBot, título da tela e status do bot.
- Aplicar áreas seguras do smartphone no topo e embaixo.
- Manter a barra lateral e o site atual inalterados fora do modo instalado.
- Ajustar a área principal para ocupar corretamente a tela e não ficar escondida atrás da navegação.

### 2. Navegação de aplicativo
- Trocar, somente no PWA, a faixa horizontal de 8 itens por 5 destinos fixos e grandes: Painel, Produtos, Horários, Grupos e Mais.
- Abrir “Mais” como um menu inferior com Conexão, Preview IA, Indique e Ganhe e Configurações.
- Destacar claramente a tela atual e preservar o indicador de conexão.
- Garantir alvos de toque de pelo menos 48 px e rótulos legíveis.

### 3. Controles mais robustos no PWA
- Aumentar apenas no modo instalado a altura de botões, campos e menus para aproximadamente 48 px.
- Ampliar ícones de editar/excluir, caixas de seleção e áreas clicáveis.
- Tornar ações principais de formulários largas no celular; ações secundárias continuam discretas.
- Melhorar estados pressionado, foco, carregando e desabilitado sem mudar as cores atuais.

### 4. Organização das telas
- **Painel:** resumo mais escaneável e próximos disparos sem aperto entre textos e etiquetas.
- **Produtos:** formulário em sequência vertical; preço/desconto destacados; cada produto em bloco mobile com ações claras.
- **Horários:** seletores maiores, grupos com linha inteira tocável e horários cadastrados organizados sem colisões.
- **Grupos:** seleção e cadastro em fluxo vertical; lista com identificação e ação de excluir acessível.
- **Conexão:** QR Code com tamanho adaptável, status central e botão principal largo.
- **Preview IA:** seletor e geração em sequência; ações de variar/copiar adaptadas à largura da tela.
- **Indicações, Planos, Suporte e Configurações:** botões e opções em largura confortável, cards mais legíveis e ações sem cortes.

### 5. Janelas e acabamento mobile
- Fazer avisos, promoções e tutorial caberem entre as áreas seguras, com rolagem interna quando necessário.
- Preservar o tema dark, verde WhatsApp, roxo da IA e as fontes atuais.
- Respeitar redução de movimento configurada no aparelho.

## Limites desta etapa
- Nenhuma mudança no banco de dados, autenticação, pagamentos ou regras do bot.
- Nenhum cache offline novo e nenhuma mudança no serviço de notificações.
- Nenhuma mudança visual na landing page ou no site aberto pelo navegador.

## Validação
- Conferir as principais telas em dimensões de smartphones pequenos e grandes, simulando o modo instalado.
- Verificar que não há rolagem horizontal, conteúdo sob a barra inferior ou texto/botões cortados.
- Confirmar que o modo navegador mantém o visual atual.
- Conferir navegação, formulários, janelas e estados de carregamento, além do build final sem erros.
