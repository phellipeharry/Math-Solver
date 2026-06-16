/**
 * MathFlow - Core Application Logic
 * Canvas Drawing, Gemini API client-side OCR, KaTeX rendering, Math.js & Function Plot integration.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation elements
  const navCalc = document.getElementById('nav-calc');
  const navTutor = document.getElementById('nav-tutor');
  const sectionCalc = document.getElementById('section-calc');
  const sectionTutor = document.getElementById('section-tutor');

  // Input Tab elements
  const tabModeDraw = document.getElementById('tab-mode-draw');
  const tabModeUpload = document.getElementById('tab-mode-upload');
  const contentModeDraw = document.getElementById('content-mode-draw');
  const contentModeUpload = document.getElementById('content-mode-upload');

  // Drawing Canvas elements
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
  
  // Image Upload elements (Calculator)
  const uploadDropzone = document.getElementById('upload-dropzone');
  const btnBrowseFile = document.getElementById('btn-browse-file');
  const fileInputOcr = document.getElementById('file-input-ocr');
  const uploadPreviewContainer = document.getElementById('upload-preview-container');
  const imagePreviewOcr = document.getElementById('image-preview-ocr');
  const btnRemovePreview = document.getElementById('btn-remove-preview');
  const btnSolveImage = document.getElementById('btn-solve-image');

  // Solution display elements
  const latexOutput = document.getElementById('latex-output');
  const formulaInputEdit = document.getElementById('formula-input-edit');
  const btnSolveEdited = document.getElementById('btn-solve-edited');
  const finalResultContainer = document.getElementById('final-result-container');
  const finalResultValue = document.getElementById('final-result-value');
  const stepsContainer = document.getElementById('steps-container');
  
  // Cartesian Plotter elements
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

  // Question Tutor elements
  const tutorTextInput = document.getElementById('tutor-text-input');
  const tutorUploadDropzone = document.getElementById('tutor-upload-dropzone');
  const btnTutorBrowseFile = document.getElementById('btn-tutor-browse-file');
  const tutorFileInput = document.getElementById('tutor-file-input');
  const tutorPreviewContainer = document.getElementById('tutor-preview-container');
  const tutorImagePreview = document.getElementById('tutor-image-preview');
  const btnTutorRemovePreview = document.getElementById('btn-tutor-remove-preview');
  const btnTutorSolve = document.getElementById('btn-tutor-solve');
  const tutorTranscriptionContainer = document.getElementById('tutor-transcription-container');
  const tutorDetectedText = document.getElementById('tutor-detected-text');
  const tutorConceptContainer = document.getElementById('tutor-concept-container');
  const tutorConceptText = document.getElementById('tutor-concept-text');
  const tutorResultContainer = document.getElementById('tutor-result-container');
  const tutorResultValue = document.getElementById('tutor-result-value');
  const tutorStepsTitle = document.getElementById('tutor-steps-title');
  const tutorStepsContainer = document.getElementById('tutor-steps-container');

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

  // Touch Gesture tracking
  let prevTouchDiff = -1;
  let prevTouchMid = null;

  // Question Tutor Image state
  let tutorImageBase64 = null;

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
  // Global Navigation & Secondary Tabs Logic
  // ----------------------------------------------------
  navCalc.addEventListener('click', () => {
    navCalc.classList.add('active');
    navTutor.classList.remove('active');
    sectionCalc.style.display = 'grid';
    sectionTutor.style.display = 'none';
    
    // Force redraw layout
    setTimeout(() => {
      initCanvas();
      renderGraph();
    }, 100);
  });

  navTutor.addEventListener('click', () => {
    navCalc.classList.remove('active');
    navTutor.classList.add('active');
    sectionCalc.style.display = 'none';
    sectionTutor.style.display = 'grid';
  });

  tabModeDraw.addEventListener('click', () => {
    tabModeDraw.classList.add('active');
    tabModeUpload.classList.remove('active');
    contentModeDraw.classList.add('active');
    contentModeUpload.classList.remove('active');
    setTimeout(initCanvas, 50);
  });

  tabModeUpload.addEventListener('click', () => {
    tabModeDraw.classList.remove('active');
    tabModeUpload.classList.add('active');
    contentModeDraw.classList.remove('active');
    contentModeUpload.classList.add('active');
  });

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
  // Canvas Drawing Manager (Vector & Zoom/Pan)
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

  // Pointer event listeners (supports Mouse seamlessly)
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
    // Only capture standard mouse pointer clicks, touch events are handled separately
    if (e.pointerType === 'touch') return;
    
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
    if (e.pointerType === 'touch') return;
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
    if (e.pointerType === 'touch') return;
    if (isPanning) {
      isPanning = false;
      return;
    }
    if (drawing) {
      drawing = false;
    }
  });

  // ----------------------------------------------------
  // Touch Gestures: Multi-touch zoom, pan, and draw (Mobile)
  // ----------------------------------------------------
  function getTouchPos(touch) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  canvas.addEventListener('touchstart', (e) => {
    // Single finger touch -> Draw
    if (e.touches.length === 1) {
      const pos = getTouchPos(e.touches[0]);
      const canvasX = (pos.x - panX) / zoomLevel;
      const canvasY = (pos.y - panY) / zoomLevel;
      
      drawing = true;
      const strokeSize = isEraser ? (brushSize * 2.5) : brushSize;
      const newStroke = {
        points: [{ x: canvasX, y: canvasY }],
        size: strokeSize / zoomLevel,
        isEraser: isEraser
      };
      strokes.push(newStroke);
      redoStack = [];
      redrawCanvas();
    } 
    // Two fingers touch -> Pinch Zoom / Drag pan
    else if (e.touches.length === 2) {
      drawing = false;
      // Remove the single dot created by the first touch if no strokes were drawn
      if (strokes.length > 0 && strokes[strokes.length - 1].points.length <= 1) {
        strokes.pop();
      }
      
      prevTouchDiff = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      prevTouchMid = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      };
      redrawCanvas();
    }
  });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Crucial: prevents scrolling the browser window!
    
    // One finger draw
    if (e.touches.length === 1 && drawing && strokes.length > 0) {
      const pos = getTouchPos(e.touches[0]);
      const canvasX = (pos.x - panX) / zoomLevel;
      const canvasY = (pos.y - panY) / zoomLevel;
      
      const currentStroke = strokes[strokes.length - 1];
      currentStroke.points.push({ x: canvasX, y: canvasY });
      redrawCanvas();
    } 
    // Two finger pinch & drag
    else if (e.touches.length === 2 && prevTouchMid) {
      const diff = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const mid = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2
      };
      
      // Calculate touch zoom factor
      const zoomFactor = diff / prevTouchDiff;
      let newZoomLevel = zoomLevel * zoomFactor;
      newZoomLevel = Math.min(Math.max(0.4, newZoomLevel), 8.0);
      
      // Center of touch in canvas coords
      const rect = canvas.getBoundingClientRect();
      const clientMidX = mid.x - rect.left;
      const clientMidY = mid.y - rect.top;
      
      const canvasMidX = (clientMidX - panX) / zoomLevel;
      const canvasMidY = (clientMidY - panY) / zoomLevel;
      
      // Calculate midpoint translation delta
      const deltaX = mid.x - prevTouchMid.x;
      const deltaY = mid.y - prevTouchMid.y;
      
      zoomLevel = newZoomLevel;
      panX = clientMidX - canvasMidX * zoomLevel + deltaX;
      panY = clientMidY - canvasMidY * zoomLevel + deltaY;
      
      prevTouchDiff = diff;
      prevTouchMid = mid;
      
      redrawCanvas();
    }
  });

  canvas.addEventListener('touchend', (e) => {
    drawing = false;
    prevTouchMid = null;
    prevTouchDiff = -1;
  });

  canvas.addEventListener('pointercancel', () => {
    drawing = false;
    isPanning = false;
  });

  // Wheel zoom listener (Desktop)
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault(); // Prevent page scroll!
    
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
    
    // Recalculate pan centered on cursor
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
    showToast(isEraser ? "Borracha ativa (fundo branco)" : "Pincel de escrita ativo");
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

  // Canvas Expand/Fullscreen toggle
  btnExpandCanvas.addEventListener('click', () => {
    const isExpanded = panelDrawing.classList.toggle('expanded');
    if (isExpanded) {
      expandIcon.className = 'fa-solid fa-compress';
      showToast(window.innerWidth <= 768 ? "Tela cheia ativada! Use 2 dedos para aproximar/mover." : "Tela expandida!");
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
  window.addEventListener('resize', () => {
    if (sectionCalc.style.display !== 'none') {
      initCanvas();
    }
  });
  
  // Initial Canvas Setup
  initCanvas();
  // Double-check initialization to handle fast loads
  setTimeout(initCanvas, 200);

  // ----------------------------------------------------
  // Drag & Drop / Image Selection Logic (Calculator)
  // ----------------------------------------------------
  function handleImageSelected(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast("Por favor, envie um arquivo de imagem válido", true);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreviewOcr.src = e.target.result;
      uploadPreviewContainer.style.display = 'flex';
      uploadDropzone.style.display = 'none';
      btnSolveImage.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  btnBrowseFile.addEventListener('click', () => fileInputOcr.click());
  fileInputOcr.addEventListener('change', () => {
    if (fileInputOcr.files.length > 0) {
      handleImageSelected(fileInputOcr.files[0]);
    }
  });

  btnRemovePreview.addEventListener('click', () => {
    imagePreviewOcr.src = '';
    uploadPreviewContainer.style.display = 'none';
    uploadDropzone.style.display = 'flex';
    btnSolveImage.disabled = true;
    fileInputOcr.value = '';
  });

  uploadDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadDropzone.classList.add('dragover');
  });
  uploadDropzone.addEventListener('dragleave', () => {
    uploadDropzone.classList.remove('dragover');
  });
  uploadDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadDropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleImageSelected(e.dataTransfer.files[0]);
    }
  });

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
  window.addEventListener('resize', () => {
    if (sectionCalc.style.display !== 'none') {
      renderGraph();
    }
  });

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

      item.querySelector('.btn-toggle-vis').addEventListener('click', () => {
        f.visible = !f.visible;
        updateFunctionListUI();
        renderGraph();
      });

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
    btnRecognize.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Processando...</span>`;
    btnSolveImage.disabled = true;
    btnSolveImage.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Calculando...</span>`;
    
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
    btnRecognize.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> <span>Reconhecer & Resolver Desenho</span>`;
    
    btnSolveImage.disabled = (imagePreviewOcr.src === '');
    btnSolveImage.innerHTML = `<i class="fa-solid fa-calculator"></i> <span>Resolver Foto Enviada</span>`;
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
            text: `Resolva a equação, fórmula ou expressão matemática desenhada ou contida na imagem.
O seu retorno DEVE obedecer estritamente a este esquema JSON:
- 'expression': Texto limpo contendo a expressão correspondente (Ex: "y = x^2 - 4" ou "3x + 5 = 11").
- 'latex': String formatada em LaTeX válida para renderização direta via KaTeX (NÃO inclua delimitadores externos como $$ ou \\[ \\]).
- 'steps': Um array de objetos, onde cada objeto descreve um passo da resolução. Cada objeto deve conter: 'explanation' (explicação em português do que está sendo feito no passo) e 'formula' (a fórmula matemática resultante deste passo em formato LaTeX, sem os delimitadores $$ ou $).
- 'result': String resumindo o resultado final (ex: "x = 2", "5" ou "Equação resolvida"). Deve estar no formato LaTeX.
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
- 'result': String resumindo o resultado final (ex: "x = 2", "5" ou "Equação resolvida"). Deve estar no formato LaTeX.
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
    
    // Render final result in KaTeX format to solve fractions \frac rendering
    if (data.result) {
      finalResultContainer.style.display = 'block';
      try {
        katex.render(data.result, finalResultValue, {
          throwOnError: false,
          displayMode: false
        });
      } catch (err) {
        finalResultValue.innerText = data.result;
      }
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
        const exists = functions.some(f => cleanExpressionForPlotting(f.expr) === cleaned);
        if (!exists) {
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

  // Recognize draw button action
  btnRecognize.addEventListener('click', async () => {
    if (!apiKeyValue) {
      showToast("Chave da API do Gemini não configurada! Clique em API Key no topo para configurar.", true);
      openModal(modalSettings);
      return;
    }

    showLoadingState();

    try {
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
      latexOutput.innerHTML = `<span style="color: var(--danger);">Falha no reconhecimento.</span>`;
    } finally {
      hideLoadingState();
    }
  });

  // Solve photo button action (Calculator)
  btnSolveImage.addEventListener('click', async () => {
    if (!imagePreviewOcr.src) return;
    if (!apiKeyValue) {
      showToast("Chave da API do Gemini não configurada! Clique em API Key no topo para configurar.", true);
      openModal(modalSettings);
      return;
    }

    showLoadingState();

    try {
      const base64Data = imagePreviewOcr.src.split(',')[1];
      const result = await callGeminiVision(base64Data);
      displayResults(result);
      showToast("Foto processada e resolvida!");
    } catch (e) {
      console.error(e);
      showToast(e.message || "Erro ao resolver a imagem.", true);
      latexOutput.innerHTML = `<span style="color: var(--danger);">Falha ao ler fórmula da foto.</span>`;
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
      // Local fallback calculation using math.js
      try {
        let latexStr = math.parse(expr).toTex();
        renderLaTeX(latexStr);
        
        const evaluated = math.evaluate(expr);
        let resultStr = "";
        
        if (typeof evaluated === 'function') {
          resultStr = "Função de x detectada.";
          
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
        try {
          katex.render(resultStr, finalResultValue, {
            throwOnError: false,
            displayMode: false
          });
        } catch (err) {
          finalResultValue.innerText = resultStr;
        }

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
  formulaInputEdit.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      solveManualFormula();
    }
  });

  // ----------------------------------------------------
  // Drag & Drop / Image Selection Logic (Tutor de Questões)
  // ----------------------------------------------------
  function handleTutorImageSelected(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast("Por favor, envie um arquivo de imagem válido", true);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      tutorImagePreview.src = e.target.result;
      tutorPreviewContainer.style.display = 'flex';
      tutorUploadDropzone.style.display = 'none';
      tutorImageBase64 = e.target.result.split(',')[1];
    };
    reader.readAsDataURL(file);
  }

  btnTutorBrowseFile.addEventListener('click', () => tutorFileInput.click());
  tutorFileInput.addEventListener('change', () => {
    if (tutorFileInput.files.length > 0) {
      handleTutorImageSelected(tutorFileInput.files[0]);
    }
  });

  btnTutorRemovePreview.addEventListener('click', () => {
    tutorImagePreview.src = '';
    tutorPreviewContainer.style.display = 'none';
    tutorUploadDropzone.style.display = 'flex';
    tutorImageBase64 = null;
    tutorFileInput.value = '';
  });

  tutorUploadDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    tutorUploadDropzone.classList.add('dragover');
  });
  tutorUploadDropzone.addEventListener('dragleave', () => {
    tutorUploadDropzone.classList.remove('dragover');
  });
  tutorUploadDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    tutorUploadDropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
      handleTutorImageSelected(e.dataTransfer.files[0]);
    }
  });

  // ----------------------------------------------------
  // Tutor API Integration & Display Results
  // ----------------------------------------------------
  async function callGeminiTutor(textQuery, base64Image) {
    if (!apiKeyValue) {
      throw new Error("Chave API não configurada. Clique em 'API Key' no topo para configurar!");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeyValue}`;
    
    const parts = [];
    if (textQuery && textQuery.trim()) {
      parts.push({
        text: `A seguinte questão de matemática/ciências foi digitada pelo usuário: "${textQuery}"`
      });
    }
    
    if (base64Image) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Image
        }
      });
      parts.push({
        text: `Considere a imagem fornecida para identificar e resolver a questão.`
      });
    }

    parts.push({
      text: `Você é um Tutor Didático e detalhista de Matemática e Ciências (Física, Estatística, Álgebra, Geometria). Resolva a questão fornecida.
Seu retorno deve ser exclusivamente um objeto JSON estrito com o seguinte esquema:
- 'questionText': String contendo o enunciado transcrito completo da questão detectada (especialmente se for de imagem).
- 'concept': String explicando detalhadamente em português 'Como Pensar' para resolver este tipo de problema, indicando a estratégia de raciocínio, o conceito fundamental e quais fórmulas/regras aplicar.
- 'steps': Um array de objetos descrevendo as etapas da resolução. Cada objeto deve conter: 'explanation' (explicação detalhada do raciocínio da etapa em português) e 'formula' (a equação/cálculo matemático desta etapa em formato LaTeX, sem delimitadores como $$ ou $).
- 'result': String contendo apenas a resposta/resultado final simplificado formatado em LaTeX.

Seja didático e ajude o usuário a aprender como pensar.`
    });

    const requestPayload = {
      contents: [{ parts: parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            questionText: { type: "STRING" },
            concept: { type: "STRING" },
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
            result: { type: "STRING" }
          },
          required: ["questionText", "concept", "steps", "result"]
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

  function displayTutorResults(data) {
    // Show text transcription if image was used
    if (data.questionText) {
      tutorTranscriptionContainer.style.display = 'block';
      tutorDetectedText.innerText = data.questionText;
    } else {
      tutorTranscriptionContainer.style.display = 'none';
    }
    
    // Show "Como Pensar" conceptual strategy
    if (data.concept) {
      tutorConceptContainer.style.display = 'block';
      tutorConceptText.innerText = data.concept;
    } else {
      tutorConceptContainer.style.display = 'none';
    }
    
    // Render final result in KaTeX format to solve formatting bugs
    if (data.result) {
      tutorResultContainer.style.display = 'block';
      try {
        katex.render(data.result, tutorResultValue, {
          throwOnError: false,
          displayMode: false
        });
      } catch (err) {
        tutorResultValue.innerText = data.result;
      }
    } else {
      tutorResultContainer.style.display = 'none';
    }
    
    // Render steps list as visual flowchart
    tutorStepsContainer.innerHTML = '';
    if (data.steps && data.steps.length > 0) {
      tutorStepsTitle.style.display = 'block';
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
        tutorStepsContainer.appendChild(stepCard);
        
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
        
        // Down arrow flow connector
        if (idx < data.steps.length - 1) {
          const arrow = document.createElement('div');
          arrow.className = 'step-flow-arrow';
          arrow.innerHTML = `<i class="fa-solid fa-arrow-down-long"></i>`;
          tutorStepsContainer.appendChild(arrow);
        }
      });
    } else {
      tutorStepsTitle.style.display = 'none';
      tutorStepsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-graduation-cap"></i>
          <p>Nenhuma etapa listada para esta questão.</p>
        </div>
      `;
    }
  }

  btnTutorSolve.addEventListener('click', async () => {
    const textVal = tutorTextInput.value.trim();
    if (!textVal && !tutorImageBase64) {
      showToast("Digite o enunciado ou envie a foto de um exercício", true);
      return;
    }

    if (!apiKeyValue) {
      showToast("Chave da API do Gemini não configurada! Clique em API Key no topo para configurar.", true);
      openModal(modalSettings);
      return;
    }

    btnTutorSolve.disabled = true;
    btnTutorSolve.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Tutor Analisando...</span>`;
    
    tutorStepsContainer.innerHTML = `
      <div class="skeleton-line medium" style="margin-bottom: 0.75rem;"></div>
      <div class="skeleton-line" style="margin-bottom: 0.75rem;"></div>
      <div class="skeleton-line short" style="margin-bottom: 0.75rem;"></div>
    `;
    tutorTranscriptionContainer.style.display = 'none';
    tutorConceptContainer.style.display = 'none';
    tutorResultContainer.style.display = 'none';
    tutorStepsTitle.style.display = 'none';

    try {
      const result = await callGeminiTutor(textVal, tutorImageBase64);
      displayTutorResults(result);
      showToast("Questão resolvida e explicada pelo Tutor!");
    } catch (e) {
      console.error(e);
      showToast(e.message || "Erro ao resolver questão.", true);
      tutorStepsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p>Ocorreu um erro ao resolver esta questão. Verifique sua chave de API ou tente novamente.</p>
        </div>
      `;
    } finally {
      btnTutorSolve.disabled = false;
      btnTutorSolve.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> <span>Explicar & Resolver Questão</span>`;
    }
  });

});
