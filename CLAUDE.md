# Gastos 3 — Documentação do Projeto

## O que é
PWA (Progressive Web App) de controle de gastos pessoais, configurável e genérico.
Desenvolvido para ser **vendido como produto** a outras pessoas.
Hospedado no GitHub Pages: `https://ulyssesbebem.github.io/Gastos-3/`

## Modelo de negócio
- Distribuído como **APK Android** (gerado via WebIntoApp — funcionou melhor que PWA Builder)
- Venda com **preço único (vitalício)** — sem mensalidade, sem servidor
- Dados ficam no **localStorage** do celular do usuário (sem nuvem)
- Controle de acesso via **seriais de ativação** (tipo serial de software)
- Cada comprador recebe um serial único via WhatsApp após pagar no PIX

## Arquivos principais

| Arquivo | Função |
|---|---|
| `ativacao.html` | Tela de ativação com serial — aparece na primeira abertura |
| `setup.html` | Wizard de configuração inicial (5 passos) |
| `index.html` | App principal — renderiza tudo via JS |
| `configuracoes.html` | Configurações: pessoas, categorias, modos |
| `db.js` | Camada de dados (localStorage, prefix `g3_`) |
| `sw.js` | Service Worker — cache offline (versão atual: v3) |
| `manifest.json` | Manifest PWA |

## Fluxo do usuário
1. Abre o app → cai em `ativacao.html` (se não ativado)
2. Digita o serial → vai para `setup.html`
3. Configura nome, modos (casa/cartão), pessoas → vai para `index.html`
4. Usa o app normalmente

## localStorage — chaves usadas
| Chave | Conteúdo |
|---|---|
| `g3_ativado` | `"true"` se o serial foi validado |
| `g3_serial` | Serial usado na ativação |
| `g3_config` | Config geral (nome, emoji, modoCasa, modoCartao, configurado) |
| `g3_pessoas` | Array de pessoas cadastradas |
| `g3_cats` | Array de categorias extras |
| `g3_despesas` | Array de despesas |
| `g3_receitas` | Array de receitas |

## Seriais de ativação
100 seriais no formato `ULYS-XXXX` hardcoded em `ativacao.html`.
Lista começa em `ULYS-A2B3` e vai até `ULYS-Q4R5`.
Cada comprador recebe um serial diferente — riscar da lista conforme vende.
Quando acabar, adicionar mais seriais em `ativacao.html` e subir no GitHub.

## Funcionalidades
- **Modos configuráveis**: Divisão de casa e/ou gastos no cartão de outras pessoas
- **Categorias dinâmicas**: baseadas nas pessoas e modos ativados
- **Compartilhamento**: gera resumo em texto formatado e abre WhatsApp via `whatsapp://send?text=...`
  - Texto inclui gastos no cartão itemizados + divisão de casa itemizada
  - Usa deep link para retornar ao app após compartilhar
- **Parcelas**: ao cadastrar `3/12`, cria automaticamente as 12 parcelas nos meses seguintes
- **Múltiplos meses**: navega entre meses, histórico completo

## Compartilhamento — decisões técnicas
- `navigator.share` **não funciona** no WebView do APK gerado pelo WebIntoApp
- Solução: `whatsapp://send?text=...` (deep link do WhatsApp app)
- Fallback para `https://wa.me/?text=...` se o WhatsApp não estiver instalado
- Imagem (Canvas API) ainda existe em `gerarImagem()` mas não é usada no fluxo principal

## Como atualizar o app
1. Editar os arquivos locais
2. `git add . && git commit -m "mensagem" && git push`
3. GitHub Pages atualiza em ~2 minutos
4. **Não precisa gerar novo APK** — o WebIntoApp carrega o conteúdo do GitHub Pages

## Como gerar novo APK
- Site: WebIntoApp (funcionou melhor que PWA Builder)
- URL: `https://ulyssesbebem.github.io/Gastos-3/index.html`
- PWA Builder também tem opção iOS mas requer Mac + conta Apple ($99/ano)

## Repositório GitHub
- URL: `https://github.com/Ulyssesbebem/Gastos-3`
- Branch: `main`
- GitHub Pages ativo na branch main

## Outros apps do projeto
| App | Pasta | Repo | Descrição |
|---|---|---|---|
| Gastos (cloud) | `Aplicativo gastos\` | — | Flask + PostgreSQL, hospedado no Render + Neon |
| Lista de Compras | `Aplicativo de compras\` | Repositório próprio | PWA simples de lista de compras |
| Gastos 2 | `Aplicativo gastos 2\` | Gastos-2 | PWA local com compartilhamento via Canvas |
| Gastos 3 | `Aplicativo gastos 3\` | Gastos-3 | **Este app** — versão genérica para venda |
