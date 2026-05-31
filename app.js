/**
 * MathFlow - Core Application Logic
 * Canvas Drawing, Gemini API client-side OCR, KaTeX rendering, Math.js & Function Plot integration.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const canvas = document.getElementById('drawing-canvas');
  const canvasContainer = document.getElementById('canvas-container');
  const brushSizeInput = document.getElementById('brush-size');
  const btnToggleEraser = document.getElementById('btn-toggle-eraser');
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  const btnClear = document.getElementById('btn-clear');
  const btnRecognize = document.getElementById('btn-recognize');
  const btnExpandCanvas = document.getElementById('btn-expand-canvas');
  const expandIcon = document.getElementById('expand-icon');
  const panelDrawing = document.getElementById('panel-drawing');
  
  const latexOutput = document.getElementById('latex-output');
  const formulaInputEdit = document.getElementById('formula-input-edit');
  const btnSolveEdited = document.getElementById('btn-solve-edited');
  const finalResultContainer = document.getElementById('final-result-container');
  const finalResultValue = document.getElementById('final-result-value');
  const stepsContainer = document.getElementById('steps-container');
  
  const coordTracker = document.getElementById('coord-tracker');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnZoomReset = document.getElementById('btn-zoom-reset');
  const btnToggleAxes = document.getElementById('btn-toggle-axes');
  const graphWrapper = document.getElementById('graph-container');
  const newFuncInput = document.getElementById('new-func-input');
  const newFuncColor = document.getElementById('new-func-color');
  const btnAddFunction = document.getElementById('btn-add-function');
  const functionListContainer = document.getElementById('function-list-container');

  // Modals
  const modalSettings = document.getElementById('modal-settings');
  const btnOpenSettings = document.getElementById('btn-open-settings');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const btnCancelSettings = document.getElementById('btn-cancel-settings');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const geminiApiKeyInput = document.getElementById('gemini-api-key');
  const btnToggleKeyVisibility = document.getElementById('btn-toggle-key-visibility');
  const eyeIcon = document.getElementById('eye-icon');

  const modalHelp = document.getElementById('modal-help');
  const btnHelp = document.getElementById('btn-help');
  const btnCloseHelp = document.getElementById('btn-close-help');
  const btnOkHelp = document.getElementById('btn-ok-help');

  // App State
  let ctx = canvas.getContext('2d');
  let drawing = false;
  let isPanning = false;
  let startX = 0;
  let startY = 0;
  
  let isEraser = false;
  let brushSize = parseInt(brushSizeInput.value, 10);
  
  // Vector Drawing State
  let strokes = [];
  let redoStack = [];
  let zoomLevel = 1.0;
  let panX = 0;
  let panY = 0;

  let apiKeyValue = localStorage.getItem('gemini_api_key') || '';
  
  // Graphing State
  let functions = [
    { id: '1', expr: 'x^2 - 4', color: '#00F2FE', visible: true }
  ];
  let xDomain = [-10, 10];
  let yDomain = [-10, 10];

  // ----------------------------------------------------
  // Toast notifications
  // ----------------------------------------------------
  function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'toast-error' : ''}`;
    toast.innerHTML = `
      <i class="fa-solid ${isError ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    // Auto-remove after 4s
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3700);
  }

  // ----------------------------------------------------
  // Modal controllers
  // ----------------------------------------------------
  function openModal(modal) {
    modal.classList.add('active');
  }

  function closeModal(modal) {
    modal.classList.remove('active');
  }

  btnOpenSettings.addEventListener('click', () => {
    geminiApiKeyInput.value = apiKeyValue;
    openModal(modalSettings);
  });
  btnCloseSettings.addEventListener('click', () => closeModal(modalSettings));
  btnCancelSettings.addEventListener('click', () => closeModal(modalSettings));
  
  btnSaveSettings.addEventListener('click', () => {
    apiKeyValue = geminiApiKeyInput.value.trim();
    localStorage.setItem('gemini_api_key', apiKeyValue);
    closeModal(modalSettings);
    showToast(apiKeyValue ? "Chave de API salva com sucesso!" : "Chave de API removida.");
  });

  btnToggleKeyVisibility.addEventListener('click', () => {
    if (geminiApiKeyInput.type === 'password') {
      geminiApiKeyInput.type = 'text';
      eyeIcon.className = 'fa-solid fa-eye';
    } else {
      geminiApiKeyInput.type = 'password';
      eyeIcon.className = 'fa-solid fa-eye-slash';
    }
  });

  btnHelp.addEventListener('click', () => openModal(modalHelp));
  btnCloseHelp.addEventListener('click', () => closeModal(modalHelp));
  btnOkHelp.addEventListener('click', () => closeModal(modalHelp));

  // Show help modal on first load if no key is stored
  if (!apiKeyValue) {
    setTimeout(() => {
      openModal(modalHelp);
    }, 1000);
  }

  // ----------------------------------------------------
  // Canvas Drawing Manager (Vector & Zoom-capable)
  // ----------------------------------------------------
  function initCanvas() {
    const rect = canvasContainer.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set high-DPI resolution
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    redrawCanvas();
  }

  function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const rect = canvasContainer.getBoundingClientRect();
    
    // Fill background solid white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    ctx.save();
    // Apply pan and zoom
    ctx.translate(panX, panY);
    ctx.scale(zoomLevel, zoomLevel);
    
    // Draw strokes
    strokes.forEach(stroke => {
      if (stroke.points.length < 1) return;
      
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = stroke.size;
      
      if (stroke.isEraser) {
        ctx.strokeStyle = '#ffffff'; // White erases black strokes
      } else {
        ctx.strokeStyle = '#000000'; // Black brush ink
      }
      
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.closePath();
    });
    
    ctx.restore();
  }

  function undo() {
    if (strokes.length > 0) {
      redoStack.push(strokes.pop());
      redrawCanvas();
    } else {
      showToast("Nada para desfazer");
    }
  }

  function redo() {
    if (redoStack.length > 0) {
      strokes.push(redoStack.pop());
      redrawCanvas();
    } else {
      showToast("Nada para refazer");
    }
  }

  // Pointer event listeners (supports Mouse & Touch seamlessly)
  function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Disable context menu so right click can pan
  });

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    canvas.releasePointerCapture(e.pointerId);
    
    // Right click (2) or middle click (1) triggers panning
    if (e.button === 2 || e.button === 1) {
      isPanning = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      return;
    }
    
    // Left click (0) triggers drawing
    if (e.button === 0) {
      drawing = true;
      const pos = getPointerPos(e);
      
      // Map screen pos to zoomed canvas coordinate space
      const canvasX = (pos.x - panX) / zoomLevel;
      const canvasY = (pos.y - panY) / zoomLevel;
      
      const strokeSize = isEraser ? (brushSize * 2.5) : brushSize;
      const newStroke = {
        points: [{ x: canvasX, y: canvasY }],
        size: strokeSize / zoomLevel, // Constant screen thickness
        isEraser: isEraser
      };
      
      strokes.push(newStroke);
      redoStack = []; // Reset redo
      redrawCanvas();
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    e.preventDefault();
    
    if (isPanning) {
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      redrawCanvas();
      return;
    }
    
    if (drawing && strokes.length > 0) {
      const pos = getPointerPos(e);
      const canvasX = (pos.x - panX) / zoomLevel;
      const canvasY = (pos.y - panY) / zoomLevel;
      
      const currentStroke = strokes[strokes.length - 1];
      currentStroke.points.push({ x: canvasX, y: canvasY });
      redrawCanvas();
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    if (isPanning) {
      isPanning = false;
      return;
    }
    if (drawing) {
      drawing = false;
    }
  });

  canvas.addEventListener('pointercancel', () => {
    drawing = false;
    isPanning = false;
  });

  // Wheel zoom listener
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault(); // Crucial: prevents scrolling the page!
    
    const zoomIntensity = 0.08;
    const mousePos = getPointerPos(e);
    
    // Position of mouse in canvas coordinates before zoom
    const canvasMouseX = (mousePos.x - panX) / zoomLevel;
    const canvasMouseY = (mousePos.y - panY) / zoomLevel;
    
    if (e.deltaY < 0) {
      zoomLevel += zoomIntensity;
    } else {
      zoomLevel -= zoomIntensity;
    }
    
    // Zoom limits: 0.4x to 8.0x
    zoomLevel = Math.min(Math.max(0.4, zoomLevel), 8.0);
    
    // Recalculate panX/Y so we zoom centering on the mouse cursor
    panX = mousePos.x - canvasMouseX * zoomLevel;
    panY = mousePos.y - canvasMouseY * zoomLevel;
    
    redrawCanvas();
  }, { passive: false });

  // Brush controls
  brushSizeInput.addEventListener('input', () => {
    brushSize = parseInt(brushSizeInput.value, 10);
  });

  btnToggleEraser.addEventListener('click', () => {
    isEraser = !isEraser;
    btnToggleEraser.classList.toggle('tool-active', isEraser);
    showToast(isEraser ? "Borracha ativada (fundo branco)" : "Pincel de escrita ativado");
  });

  btnUndo.addEventListener('click', undo);
  btnRedo.addEventListener('click', redo);
  
  btnClear.addEventListener('click', () => {
    strokes = [];
    redoStack = [];
    zoomLevel = 1.0;
    panX = 0;
    panY = 0;
    redrawCanvas();
    showToast("Tela limpa e zoom resetado");
  });

  // Canvas Expand toggle
  btnExpandCanvas.addEventListener('click', () => {
    const isExpanded = panelDrawing.classList.toggle('expanded');
    if (isExpanded) {
      expandIcon.className = 'fa-solid fa-compress';
      showToast("Tela expandida!");
    } else {
      expandIcon.className = 'fa-solid fa-expand';
      showToast("Tela restaurada!");
    }
    // Re-initialize canvas dimension for expanded/restored container
    setTimeout(initCanvas, 150);
  });

  // Global Keyboard Shortcut: Ctrl + Z / Cmd + Z for drawing Undo
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      const activeEl = document.activeElement;
      const isInput = activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable;
      if (!isInput) {
        e.preventDefault();
        undo();
      }
    }
  });

  // Handle Resize
  window.addEventListener('resize', initCanvas);
  
  // Initial Canvas Setup
  initCanvas();
  // Double-check initialization to handle fast loads
  setTimeout(initCanvas, 200);

  // ----------------------------------------------------
  // LaTeX & KaTeX Rendering
  // ----------------------------------------------------
  function renderLaTeX(latexString) {
    if (!latexString) {
      latexOutput.innerHTML = `<span style="color: var(--text-muted); font-size: 0.95rem;">Fórmula vazia</span>`;
      return;
    }
    try {
      katex.render(latexString, latexOutput, {
        throwOnError: false,
        displayMode: true
      });
    } catch (e) {
      latexOutput.innerText = latexString;
    }
  }

  // ----------------------------------------------------
  // Function Plot Cartesian Plane Manager
  // ----------------------------------------------------
  function getGraphContainerSize() {
    const container = document.getElementById('graph-container');
    return {
      width: container.clientWidth,
      height: container.clientHeight
    };
  }

  function cleanExpressionForPlotting(expr) {
    if (!expr) return '';
    let cleaned = expr.trim();
    
    // Remove f(x) = or y = if present
    if (cleaned.includes('=')) {
      const parts = cleaned.split('=');
      // Take whichever part contains 'x'
      if (parts[1] && parts[1].includes('x')) {
        cleaned = parts[1];
      } else if (parts[0] && parts[0].includes('x')) {
        cleaned = parts[0];
      } else {
        cleaned = parts[parts.length - 1]; // Fallback to right side
      }
    }
    
    cleaned = cleaned.trim();
    
    // Function-plot expects standard mathematical operators in js-like syntax.
    // Replace standard representations math.js will handle or D3 will plot.
    // D3 function plot parses standard formulas, but we ensure multiplications are implicit if possible, or explicit
    // e.g. "2x" => "2*x", but function-plot is quite smart.
    return cleaned;
  }

  function renderGraph() {
    const size = getGraphContainerSize();
    const activeData = functions
      .filter(f => f.visible && f.expr.trim() !== '')
      .map(f => {
        const cleanFn = cleanExpressionForPlotting(f.expr);
        return {
          fn: cleanFn,
          color: f.color,
          graphType: 'polyline'
        };
      });

    try {
      functionPlot({
        target: '#plot-area',
        width: size.width,
        height: size.height,
        grid: true,
        xAxis: { domain: xDomain },
        yAxis: { domain: yDomain },
        annotations: [
          { x: 0, text: 'y' },
          { y: 0, text: 'x' }
        ],
        data: activeData
      });
      
      // Update coordinates display setup on SVG mousemove
      setupCoordTracker();
      
    } catch (error) {
      console.error("Erro ao desenhar o gráfico:", error);
      // Fallback rendering only valid functions to avoid complete crash
      showToast("Erro ao plotar algumas funções. Verifique a sintaxe.", true);
    }
  }

  function setupCoordTracker() {
    const svgEl = document.querySelector('#plot-area svg');
    if (!svgEl) return;

    svgEl.addEventListener('mousemove', (e) => {
      const rect = svgEl.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate coordinates based on domains
      const pctX = mouseX / rect.width;
      const pctY = mouseY / rect.height;
      
      const xVal = xDomain[0] + pctX * (xDomain[1] - xDomain[0]);
      // Y-axis is inverted in SVG coordinates
      const yVal = yDomain[1] - pctY * (yDomain[1] - yDomain[0]);

      coordTracker.innerText = `x: ${xVal.toFixed(2)}, y: ${yVal.toFixed(2)}`;
    });
    
    svgEl.addEventListener('mouseleave', () => {
      coordTracker.innerText = `x: 0.00, y: 0.00`;
    });
  }

  // Zoom actions
  btnZoomIn.addEventListener('click', () => {
    xDomain = [xDomain[0] * 0.7, xDomain[1] * 0.7];
    yDomain = [yDomain[0] * 0.7, yDomain[1] * 0.7];
    renderGraph();
  });

  btnZoomOut.addEventListener('click', () => {
    xDomain = [xDomain[0] * 1.4, xDomain[1] * 1.4];
    yDomain = [yDomain[0] * 1.4, yDomain[1] * 1.4];
    renderGraph();
  });

  btnZoomReset.addEventListener('click', () => {
    xDomain = [-10, 10];
    yDomain = [-10, 10];
    renderGraph();
  });

  // Toggle Axes visibility
  btnToggleAxes.addEventListener('click', () => {
    const isHidden = graphWrapper.classList.toggle('hide-axes');
    btnToggleAxes.classList.toggle('tool-active', !isHidden);
    showToast(isHidden ? "Eixos X e Y ocultados" : "Eixos X e Y ativados");
  });

  // Re-render graph on window resize
  window.addEventListener('resize', renderGraph);

  // Manage functions in UI list
  function updateFunctionListUI() {
    functionListContainer.innerHTML = '';
    
    if (functions.length === 0) {
      functionListContainer.innerHTML = `
        <div style="color: var(--text-muted); font-size: 0.85rem; padding: 0.5rem; text-align: center;">
          Nenhuma função plotada.
        </div>
      `;
      return;
    }

    functions.forEach((f) => {
      const item = document.createElement('div');
      item.className = 'function-item';
      
      item.innerHTML = `
        <div class="function-info">
          <div class="color-indicator" style="background-color: ${f.color}"></div>
          <span class="function-expr">${f.expr}</span>
        </div>
        <div class="function-actions">
          <button class="btn btn-icon-only btn-toggle-vis" style="width: 28px; height: 28px; font-size: 0.8rem;" title="Ocultar/Exibir">
            <i class="fa-solid ${f.visible ? 'fa-eye' : 'fa-eye-slash'}"></i>
          </button>
          <button class="btn btn-icon-only btn-delete-func" style="width: 28px; height: 28px; font-size: 0.8rem;" title="Excluir">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      `;

      // Toggle Visibility Event
      item.querySelector('.btn-toggle-vis').addEventListener('click', () => {
        f.visible = !f.visible;
        updateFunctionListUI();
        renderGraph();
      });

      // Delete Event
      item.querySelector('.btn-delete-func').addEventListener('click', () => {
        functions = functions.filter(itemFunc => itemFunc.id !== f.id);
        updateFunctionListUI();
        renderGraph();
      });

      functionListContainer.appendChild(item);
    });
  }

  // Add custom function
  btnAddFunction.addEventListener('click', () => {
    const expr = newFuncInput.value.trim();
    if (!expr) {
      showToast("Digite uma expressão", true);
      return;
    }

    // Try to check syntax using math.js
    try {
      const cleaned = cleanExpressionForPlotting(expr);
      math.parse(cleaned); // Checks if math.js can parse it
      
      const newFunc = {
        id: Date.now().toString(),
        expr: expr,
        color: newFuncColor.value,
        visible: true
      };

      functions.push(newFunc);
      newFuncInput.value = '';
      updateFunctionListUI();
      renderGraph();
      showToast("Função adicionada");
    } catch (e) {
      showToast("Expressão inválida. Use termos como x, x^2, sin(x).", true);
    }
  });

  // Render initial graph
  updateFunctionListUI();
  renderGraph();

  // ----------------------------------------------------
  // Gemini AI Call & Local Calculator Math Solver
  // ----------------------------------------------------

  // Show loading skeleton in steps list
  function showLoadingState() {
    canvasContainer.classList.add('scanning');
    btnRecognize.disabled = true;
    btnRecognize.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Reconhecendo...</span>`;
    
    latexOutput.innerHTML = `<div class="skeleton-line" style="margin: 0 auto; width: 50%;"></div>`;
    formulaInputEdit.value = '';
    finalResultContainer.style.display = 'none';
    
    stepsContainer.innerHTML = `
      <div class="skeleton-line medium" style="margin-bottom: 0.75rem;"></div>
      <div class="skeleton-line" style="margin-bottom: 0.75rem;"></div>
      <div class="skeleton-line short" style="margin-bottom: 0.75rem;"></div>
    `;
  }

  function hideLoadingState() {
    canvasContainer.classList.remove('scanning');
    btnRecognize.disabled = false;
    btnRecognize.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Reconhecer & Resolver</span>`;
  }

  async function callGeminiVision(base64Image) {
    if (!apiKeyValue) {
      throw new Error("Chave API não configurada. Clique em 'API Key' no topo para configurar!");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeyValue}`;
    
    const requestPayload = {
      contents: [{
        parts: [
          {
            text: `Resolva a equação, fórmula ou expressão matemática desenhada na imagem.
O seu retorno DEVE obedecer estritamente a este esquema JSON:
- 'expression': Texto limpo contendo a expressão correspondente (Ex: "y = x^2 - 4" ou "3x + 5 = 11").
- 'latex': String formatada em LaTeX válida para renderização direta via KaTeX (NÃO inclua delimitadores externos como $$ ou \\[ \\]).
- 'steps': Um array de objetos, onde cada objeto descreve um passo da resolução. Cada objeto deve conter: 'explanation' (explicação em português do que está sendo feito no passo) e 'formula' (a fórmula matemática resultante deste passo em formato LaTeX, sem os delimitadores $$ ou $).
- 'result': String resumindo o resultado final (ex: "x = 2", "5" ou "Equação resolvida").
- 'isFunction': Um booleano true/false informando se o termo se trata de uma função de x plotável no plano cartesiano (Ex: "y = x^2", "f(x) = sin(x)", "x^3").
- 'plotFunction': String contendo apenas a fórmula simplificada em relação a x para plotagem matemática direta no javascript (Ex: se for "y = x^2 - 4" ou "f(x) = x^2 - 4", retorne apenas "x^2 - 4"). Se não for uma função plotável, retorne uma string vazia "".`
          },
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            expression: { type: "STRING" },
            latex: { type: "STRING" },
            steps: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  explanation: { type: "STRING" },
                  formula: { type: "STRING" }
                },
                required: ["explanation", "formula"]
              }
            },
            result: { type: "STRING" },
            isFunction: { type: "BOOLEAN" },
            plotFunction: { type: "STRING" }
          },
          required: ["expression", "latex", "steps", "result", "isFunction", "plotFunction"]
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Erro na comunicação com a API do Gemini');
    }

    const resData = await response.json();
    if (!resData.candidates || resData.candidates.length === 0) {
      throw new Error('Nenhuma resposta gerada pelo modelo.');
    }
    
    const jsonText = resData.candidates[0].content.parts[0].text;
    return JSON.parse(jsonText);
  }

  async function callGeminiTextSolver(expression) {
    if (!apiKeyValue) {
      throw new Error("Chave API não configurada.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeyValue}`;
    
    const requestPayload = {
      contents: [{
        parts: [
          {
            text: `Resolva a seguinte expressão matemática informada pelo usuário: "${expression}".
O seu retorno DEVE obedecer estritamente a este esquema JSON:
- 'expression': Texto limpo contendo a expressão correspondente (Ex: "y = x^2 - 4" ou "3x + 5 = 11").
- 'latex': String formatada em LaTeX válida para renderização direta via KaTeX (NÃO inclua delimitadores externos como $$ ou \\[ \\]).
- 'steps': Um array de objetos, onde cada objeto descreve um passo da resolução. Cada objeto deve conter: 'explanation' (explicação em português do que está sendo feito no passo) e 'formula' (a fórmula matemática resultante deste passo em formato LaTeX, sem os delimitadores $$ ou $).
- 'result': String resumindo o resultado final (ex: "x = 2", "5" ou "Equação resolvida").
- 'isFunction': Um booleano true/false informando se o termo se trata de uma função de x plotável no plano cartesiano.
- 'plotFunction': String contendo apenas a fórmula simplificada em relação a x para plotagem matemática direta no javascript (Ex: se for "y = x^2 - 4", retorne apenas "x^2 - 4"). Se não for uma função plotável, retorne uma string vazia "".`
          }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            expression: { type: "STRING" },
            latex: { type: "STRING" },
            steps: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  explanation: { type: "STRING" },
                  formula: { type: "STRING" }
                },
                required: ["explanation", "formula"]
              }
            },
            result: { type: "STRING" },
            isFunction: { type: "BOOLEAN" },
            plotFunction: { type: "STRING" }
          },
          required: ["expression", "latex", "steps", "result", "isFunction", "plotFunction"]
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Erro na comunicação com a API do Gemini');
    }

    const resData = await response.json();
    const jsonText = resData.candidates[0].content.parts[0].text;
    return JSON.parse(jsonText);
  }

  function displayResults(data) {
    // Render LaTeX output
    renderLaTeX(data.latex);
    
    // Set editable text input
    formulaInputEdit.value = data.expression;
    
    // Render final result
    if (data.result) {
      finalResultContainer.style.display = 'block';
      finalResultValue.innerText = data.result;
    } else {
      finalResultContainer.style.display = 'none';
    }

    // Render step-by-step flowchart
    stepsContainer.innerHTML = '';
    if (data.steps && data.steps.length > 0) {
      data.steps.forEach((step, idx) => {
        const stepCard = document.createElement('div');
        stepCard.className = 'step-card';
        stepCard.style.animationDelay = `${idx * 0.1}s`;
        
        stepCard.innerHTML = `
          <div class="step-number">${idx + 1}</div>
          <div class="step-content-box">
            <div class="step-explanation">${step.explanation}</div>
            ${step.formula ? `
              <div class="step-formula-box">
                <div class="step-formula-render"></div>
              </div>
            ` : ''}
          </div>
        `;
        stepsContainer.appendChild(stepCard);

        if (step.formula) {
          const formulaRenderEl = stepCard.querySelector('.step-formula-render');
          try {
            katex.render(step.formula, formulaRenderEl, {
              throwOnError: false,
              displayMode: true
            });
          } catch (err) {
            formulaRenderEl.innerText = step.formula;
          }
        }

        // Add a vertical flowchart arrow if not the last step
        if (idx < data.steps.length - 1) {
          const arrow = document.createElement('div');
          arrow.className = 'step-flow-arrow';
          arrow.innerHTML = `<i class="fa-solid fa-arrow-down-long"></i>`;
          stepsContainer.appendChild(arrow);
        }
      });
    } else {
      stepsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-circle-info"></i>
          <p>Nenhuma etapa listada para este cálculo.</p>
        </div>
      `;
    }

    // Plot dynamically if it's a function
    if (data.isFunction && data.plotFunction) {
      const cleaned = cleanExpressionForPlotting(data.plotFunction);
      if (cleaned) {
        // Look if we already have it to avoid duplicates
        const exists = functions.some(f => cleanExpressionForPlotting(f.expr) === cleaned);
        if (!exists) {
          // Select a color that isn't the primary one if possible, or cycle
          const colors = ['#00F2FE', '#7F00FF', '#10B981', '#EF4444', '#F59E0B'];
          const randColor = colors[functions.length % colors.length];
          
          functions.push({
            id: Date.now().toString(),
            expr: data.plotFunction,
            color: randColor,
            visible: true
          });
          
          updateFunctionListUI();
          renderGraph();
          showToast("Função adicionada e plotada no gráfico!");
        }
      }
    }
  }

  // Recognize button action
  btnRecognize.addEventListener('click', async () => {
    // Check key
    if (!apiKeyValue) {
      showToast("Chave da API do Gemini não configurada! Clique em API Key para configurar.", true);
      openModal(modalSettings);
      return;
    }

    showLoadingState();

    try {
      // Get base64 canvas image data
      // We need to strip the prefix: "data:image/png;base64,"
      // Create temporary canvas to render the complete vector drawing unzoomed (zoom=1.0, pan=0,0)
      const tempCanvas = document.createElement('canvas');
      const rect = canvasContainer.getBoundingClientRect();
      tempCanvas.width = rect.width;
      tempCanvas.height = rect.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Fill background solid white
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Render strokes at standard scale
      strokes.forEach(stroke => {
        if (stroke.points.length < 1) return;
        
        tempCtx.beginPath();
        tempCtx.lineCap = 'round';
        tempCtx.lineJoin = 'round';
        tempCtx.lineWidth = stroke.size;
        
        if (stroke.isEraser) {
          tempCtx.strokeStyle = '#ffffff';
        } else {
          tempCtx.strokeStyle = '#000000';
        }
        
        tempCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          tempCtx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        tempCtx.stroke();
        tempCtx.closePath();
      });

      const base64DataUrl = tempCanvas.toDataURL('image/png');
      const base64Data = base64DataUrl.split(',')[1];
      
      const result = await callGeminiVision(base64Data);
      displayResults(result);
      showToast("Fórmula resolvida!");
    } catch (e) {
      console.error(e);
      showToast(e.message || "Erro ao reconhecer desenho.", true);
      
      // Restore empty states
      latexOutput.innerHTML = `<span style="color: var(--danger);">Falha no reconhecimento.</span>`;
      stepsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p>Ocorreu um erro no processamento. Verifique sua chave de API ou tente desenhar novamente.</p>
        </div>
      `;
    } finally {
      hideLoadingState();
    }
  });

  // Solve manually edited/typed formulas
  async function solveManualFormula() {
    const expr = formulaInputEdit.value.trim();
    if (!expr) {
      showToast("Digite ou reconheça uma fórmula primeiro", true);
      return;
    }

    showLoadingState();

    if (apiKeyValue) {
      // API resolution (rich explanation + plot extraction)
      try {
        const result = await callGeminiTextSolver(expr);
        displayResults(result);
        showToast("Fórmula recalculada com sucesso!");
      } catch (e) {
        console.error(e);
        showToast(e.message || "Erro ao resolver fórmula.", true);
        hideLoadingState();
      } finally {
        hideLoadingState();
      }
    } else {
      // Local fallback calculation using math.js (no steps, simple result only)
      try {
        // Try solving locally
        let latexStr = math.parse(expr).toTex();
        renderLaTeX(latexStr);
        
        const evaluated = math.evaluate(expr);
        let resultStr = "";
        
        if (typeof evaluated === 'function') {
          // It's a mathJS function, we can add it to graphs
          resultStr = "Função de x detectada.";
          
          // Add to functions list if not already there
          const cleaned = cleanExpressionForPlotting(expr);
          const exists = functions.some(f => cleanExpressionForPlotting(f.expr) === cleaned);
          if (!exists) {
            functions.push({
              id: Date.now().toString(),
              expr: expr,
              color: '#10B981',
              visible: true
            });
            updateFunctionListUI();
            renderGraph();
          }
        } else {
          resultStr = String(evaluated);
        }

        finalResultContainer.style.display = 'block';
        finalResultValue.innerText = resultStr;

        const localStep = {
          explanation: "Calculado localmente com Math.js (Sem passos detalhados). Adicione sua chave do Gemini para resoluções passo a passo completas.",
          formula: latexStr
        };

        stepsContainer.innerHTML = '';
        const stepCard = document.createElement('div');
        stepCard.className = 'step-card';
        stepCard.innerHTML = `
          <div class="step-number"><i class="fa-solid fa-bolt"></i></div>
          <div class="step-content-box">
            <div class="step-explanation">${localStep.explanation}</div>
            <div class="step-formula-box">
              <div class="step-formula-render"></div>
            </div>
          </div>
        `;
        stepsContainer.appendChild(stepCard);

        const formulaRenderEl = stepCard.querySelector('.step-formula-render');
        try {
          katex.render(localStep.formula, formulaRenderEl, {
            throwOnError: false,
            displayMode: true
          });
        } catch (err) {
          formulaRenderEl.innerText = localStep.formula;
        }
        showToast("Calculado localmente!");
      } catch (e) {
        console.error(e);
        showToast("Erro ao calcular localmente: " + e.message, true);
        
        latexOutput.innerHTML = `<span style="color: var(--danger);">Fórmula inválida.</span>`;
        stepsContainer.innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <p>Não foi possível calcular. Adicione a chave do Gemini para suporte avançado de IA.</p>
          </div>
        `;
      } finally {
        hideLoadingState();
      }
    }
  }

  btnSolveEdited.addEventListener('click', solveManualFormula);
  
  // Also solve if user presses Enter on the edit text area
  formulaInputEdit.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      solveManualFormula();
    }
  });

});
