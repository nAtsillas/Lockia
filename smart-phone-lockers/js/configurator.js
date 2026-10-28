/**
 * Lockia - Taquillas Configurator Script (Page 3)
 * Manages 3D locker color, input validations, 4x4 disposition grid, and cart purchase.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D Model in Taquillas page
  let locker3D = null;
  if (typeof window.initLocker3DConfigurator === 'function') {
    locker3D = window.initLocker3DConfigurator('taquillaConfig3dCanvas');
  }

  // State (Default: Negro metálico)
  const state = {
    colorName: 'Negro metálico',
    colorHex: 0x1e2229,
    colorCode: '#1e2229',
    huecos: 15, // Mínimo 15
    installations: 1, // Mínimo 1
    activeCells: [0], // Default: 1st cell filled (index 0 = row 0, col 0)
  };

  // DOM Elements
  const inputHuecos = document.getElementById('inputHuecos');
  const inputQuantity = document.getElementById('inputQuantity');
  const colorButtons = document.querySelectorAll('.color-option-btn');
  const gridContainer = document.getElementById('dispositionGrid');
  const btnBuy = document.getElementById('btnBuyLocker');
  const maxCellsInfo = document.getElementById('maxCellsInfo');

  // --- DYNAMIC PRICE INVOICE CALCULATION ---
  function updatePriceInvoice() {
    const basePrice = 200;
    const baseHuecos = 15;
    const totalHuecos = state.huecos;
    const extraHuecos = Math.max(0, totalHuecos - baseHuecos);
    const extraPrice = extraHuecos * 10;
    const totalPrice = basePrice + extraPrice;

    const elBase = document.getElementById('invoiceBasePrice');
    const elExtraDetail = document.getElementById('invoiceExtraDetail');
    const elExtraPrice = document.getElementById('invoiceExtraPrice');
    const elTotal = document.getElementById('invoiceTotalPrice');
    const elFormula = document.getElementById('invoiceFormulaNote');

    if (elBase) elBase.textContent = `${basePrice} €`;
    if (elExtraDetail) {
      elExtraDetail.textContent = `${extraHuecos} ${extraHuecos === 1 ? 'hueco adicional' : 'huecos adicionales'} × 10 €`;
    }
    if (elExtraPrice) elExtraPrice.textContent = `${extraPrice} €`;
    if (elTotal) elTotal.textContent = `${totalPrice} €`;
    if (elFormula) {
      elFormula.textContent = `Fórmula: 200 € base + (10 € × ${extraHuecos} adicionales) = ${totalPrice} €`;
    }
  }

  // --- COLOR SELECTION ---
  colorButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      colorButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      state.colorName = btn.getAttribute('data-name');
      state.colorCode = btn.getAttribute('data-color');
      state.colorHex = parseInt(state.colorCode.replace('#', '0x'), 16);

      const label = document.getElementById('currentColorLabel');
      if (label) {
        label.textContent = state.colorName;
      }

      if (locker3D && locker3D.setColor) {
        locker3D.setColor(state.colorHex, state.colorName);
      }
    });
  });

  // --- NUMERIC VALIDATIONS ---
  // Input Huecos: Natural number, strictly >= 15 and <= 125
  if (inputHuecos) {
    inputHuecos.addEventListener('input', (e) => {
      // Allow only digits
      let valStr = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = valStr;

      let val = parseInt(valStr, 10);
      if (!isNaN(val)) {
        if (val > 125) {
          val = 125;
          e.target.value = 125;
          showToast('El número máximo de huecos permitido es 125.');
        }
        if (val < 15) {
          // Temporarily let user type, but clamp state to minimum 15
          state.huecos = 15;
        } else {
          state.huecos = val;
        }
        updateGridConstraints();
        updatePriceInvoice();
      }
    });

    inputHuecos.addEventListener('blur', (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 15) {
        e.target.value = 15;
        state.huecos = 15;
      } else if (val > 125) {
        e.target.value = 125;
        state.huecos = 125;
      }
      updateGridConstraints();
      updatePriceInvoice();
    });
  }

  // Input Quantity: Natural number, strictly >= 1
  if (inputQuantity) {
    inputQuantity.addEventListener('input', (e) => {
      let valStr = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = valStr;

      let val = parseInt(valStr, 10);
      if (!isNaN(val) && val >= 1) {
        state.installations = val;
      }
    });

    inputQuantity.addEventListener('blur', (e) => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) {
        e.target.value = 1;
        state.installations = 1;
      }
    });
  }

  // --- 5x5 DISPOSITION GRID LOGIC ---
  // Helpers
  function indexToCoord(idx) {
    return { r: Math.floor(idx / 5), c: idx % 5 };
  }

  function coordToIndex(r, c) {
    return r * 5 + c;
  }

  function isAdjacent(idxA, idxB) {
    const a = indexToCoord(idxA);
    const b = indexToCoord(idxB);
    const dr = Math.abs(a.r - b.r);
    const dc = Math.abs(a.c - b.c);
    // 4 cardinal directions (up, down, left, right)
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  }

  function canConnect(idx, currentList) {
    if (currentList.length === 0) return true;
    return currentList.some((existingIdx) => isAdjacent(idx, existingIdx));
  }

  // Connectivity check for removal (BFS to check if remaining cells form a single connected component)
  function isGraphConnected(cellList) {
    if (cellList.length <= 1) return true;
    const visited = new Set();
    const queue = [cellList[0]];
    visited.add(cellList[0]);

    while (queue.length > 0) {
      const curr = queue.shift();
      cellList.forEach((neighbor) => {
        if (!visited.has(neighbor) && isAdjacent(curr, neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }

    return visited.size === cellList.length;
  }

  function getMaxCells() {
    return Math.ceil(state.huecos / 5);
  }

  function renderGrid() {
    if (!gridContainer) return;
    const maxCells = getMaxCells();
    const isIncomplete = state.huecos % 5 !== 0;

    gridContainer.innerHTML = '';

    // 5x5 Grid = 25 cells
    for (let i = 0; i < 25; i++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'grid-cell';
      cell.setAttribute('data-index', i);

      const activePos = state.activeCells.indexOf(i);

      if (activePos !== -1) {
        // Is this the last filled cell AND does an incomplete module exist?
        const isLastCell = activePos === state.activeCells.length - 1;
        if (isLastCell && isIncomplete) {
          cell.classList.add('cell-partial');
          cell.title = 'Módulo incompleto (' + (state.huecos % 5) + ' huecos)';
        } else {
          cell.classList.add('cell-module');
          cell.title = 'Módulo completo (5 huecos)';
        }
      }

      cell.addEventListener('click', () => handleCellClick(i));
      gridContainer.appendChild(cell);
    }

    if (maxCellsInfo) {
      const isComplete = state.activeCells.length === maxCells;
      maxCellsInfo.innerHTML = `Celdas asignadas: <strong style="color: ${isComplete ? 'var(--color-teal)' : '#ef4444'}">${state.activeCells.length} de ${maxCells} requeridas</strong> (Huecos: ${state.huecos})`;
    }
  }

  function handleCellClick(index) {
    const existingIndex = state.activeCells.indexOf(index);
    const maxCells = getMaxCells();

    if (existingIndex !== -1) {
      // Cell is already active -> User wants to deselect it
      // Test if removing this cell preserves connectivity
      const testList = state.activeCells.filter((idx) => idx !== index);
      if (isGraphConnected(testList)) {
        state.activeCells = testList;
        renderGrid();
      } else {
        showToast('No puedes quitar esta celda intermedia porque desconectaría la cadena de módulos.');
      }
    } else {
      // Cell is empty -> User wants to activate it
      if (state.activeCells.length >= maxCells) {
        showToast(`Ya has alcanzado el máximo de ${maxCells} módulos para ${state.huecos} huecos. Si necesitas más módulos, aumenta el número de huecos.`);
        return;
      }

      if (canConnect(index, state.activeCells)) {
        state.activeCells.push(index);
        renderGrid();
      } else {
        showToast('La celda debe estar conectada de forma directa (arriba, abajo, izquierda o derecha) a un módulo existente.');
      }
    }
  }

  function updateGridConstraints() {
    const maxCells = getMaxCells();
    // Trim excess cells if user decreased huecos
    while (state.activeCells.length > maxCells) {
      state.activeCells.pop();
    }
    // If empty, ensure at least one
    if (state.activeCells.length === 0) {
      state.activeCells = [0];
    }
    renderGrid();
  }

  // --- BOTÓN COMPRAR ---
  if (btnBuy) {
    btnBuy.addEventListener('click', () => {
      const maxCells = getMaxCells();

      // Validación estricta: No dejar añadir al carrito si no está completada al máximo posible
      if (state.activeCells.length < maxCells) {
        showToast(`No puedes añadir al carrito: debes completar la distribución al máximo en la red 5x5 (has colocado ${state.activeCells.length} de los ${maxCells} módulos requeridos para ${state.huecos} huecos).`);
        return;
      }

      if (state.activeCells.length === 0) {
        showToast('Debes seleccionar al menos una celda en la cuadrícula de disposición.');
        return;
      }

      const basePrice = 200;
      const extraHuecos = Math.max(0, state.huecos - 15);
      const extraPrice = extraHuecos * 10;
      const unitPrice = basePrice + extraPrice;

      const orderItem = {
        colorName: state.colorName,
        colorCode: state.colorCode,
        huecos: state.huecos,
        extraHuecos: extraHuecos,
        basePrice: basePrice,
        extraPrice: extraPrice,
        unitPrice: unitPrice,
        quantity: state.installations,
        disposition: [...state.activeCells], // Array of active indices
        incomplete: state.huecos % 5 !== 0,
        incompleteSlots: state.huecos % 5,
        specs: {
          material: 'Acero electrostático reforzado',
          doors: 'Cristal templado con marco metálico',
          cards: 'Tarjetas maestras RFID/NFC para personal incluidas',
          lock: 'Bloqueo temporizado programable',
          leds: 'Indicadores LED de ocupación y carga',
        },
      };

      if (window.LockiaCart) {
        window.LockiaCart.addItem(orderItem);
        showToast('¡Taquilla añadida al carrito con éxito!');
        // Update badge
        window.LockiaCart.updateBadge();
      }
    });
  }

  // Simple Toast Helper
  function showToast(msg) {
    let toast = document.getElementById('toastNotice');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toastNotice';
      toast.className = 'toast-notice';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  // Initial grid & price render
  renderGrid();
  updatePriceInvoice();
});
