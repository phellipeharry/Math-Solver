# Math Solver - Solucionador de Matemática & Plotador de Gráficos

O **Math Solver** é uma aplicação web interativa premium de página única (SPA) desenvolvida para estudantes, engenheiros e entusiastas de matemática. Ele permite desenhar fórmulas matemáticas na tela, reconhecê-las usando Inteligência Artificial (Gemini 2.5 Flash), visualizar a resolução explicada passo a passo e plotar gráficos automaticamente em um plano cartesiano interativo 2D.

---

## ✨ Recursos

- **Tela de Desenho Interativa (Canvas):** Suporta mouse e touch-screen, ajuste de espessura de pincel, borracha inteligente, limpar e histórico de ações para desfazer/refazer (Undo/Redo).
- **Reconhecimento por IA com Gemini:** Converte desenhos manuais complexos diretamente em código LaTeX e texto limpo.
- **Resolução Passo a Passo:** Explica os passos detalhados para resolver ou simplificar equações em português.
- **Renderização Visual Matemática:** Renderiza equações com qualidade editorial de forma instantânea usando KaTeX.
- **Plano Cartesiano 2D Interativo:** Plota funções matemáticas (ex: $y = x^2 - 4$, $f(x) = \sin(x)$) usando a biblioteca **Function Plot**. Permite zoom (com o scroll do mouse), arrasto da tela para navegar nas coordenadas e rastreamento do cursor do mouse em tempo real.
- **Gerenciador de Funções:** Permite adicionar manualmente novas funções com cores diferentes, ocultar/exibir curvas e apagar itens do gráfico.
- **Edição e Cálculo Local Fallback:** Caso você não configure a chave da API do Gemini, o site ainda calcula localmente fórmulas digitadas e plota gráficos usando a biblioteca **Math.js**.

---

## 🛠️ Tecnologias Utilizadas (Via CDN)

1. **HTML5 & Vanilla CSS3:** Layout de grid responsivo, efeitos de glassmorphism, sombras neon e animações de escaneamento.
2. **KaTeX:** Mecanismo ultra-rápido de renderização LaTeX.
3. **Function Plot (D3.js):** Renderizador 2D interativo de funções de alta qualidade e precisão matemática.
4. **Math.js:** Biblioteca de matemática para análise sintática e cálculos locais.
5. **FontAwesome Icons:** Biblioteca de ícones moderna.
6. **Gemini API:** Modelo multimodal `gemini-2.5-flash` para processar imagens desenhadas e resolver equações.

---

## 🚀 Como Executar

Por ser uma aplicação SPA estática baseada em módulos padrões da web, você não precisa instalar nenhuma dependência ou compilar o projeto!

1. Abra a pasta do projeto.
2. Dê um duplo-clique no arquivo `index.html` para abrir diretamente no seu navegador.
3. *Recomendado para melhor desempenho de rede:* Execute um servidor HTTP local simples a partir da pasta. Exemplos:
   - Se tiver o VS Code, utilize a extensão **Live Server**.
   - No terminal, execute: `npx serve` ou `python -m http.server`.

---

## 🔑 Como Obter a Chave da API do Gemini (Grátis)

Para habilitar o reconhecimento de escrita manual e resoluções completas:
1. Acesse o [Google AI Studio](https://aistudio.google.com/).
2. Faça login com sua conta do Google.
3. Clique em **"Get API Key"** no menu lateral esquerdo.
4. Clique em **"Create API Key"** e copie a chave gerada.
5. No Math Solver, clique no botão **"API Key"** no topo da tela, cole a chave e clique em **Salvar**. A chave ficará salva com segurança apenas no armazenamento local (`localStorage`) do seu próprio navegador.
