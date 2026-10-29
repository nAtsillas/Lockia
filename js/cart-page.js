/**
 * Lockia - Carrito de la compra (Page 6)
 * Renders orders table or "No hay productos" if empty.
 */

document.addEventListener('DOMContentLoaded', () => {
  const cartTableContainer = document.getElementById('cartTableContainer');
  const cartEmptyMessage = document.getElementById('cartEmptyMessage');
  const cartSummaryWrapper = document.getElementById('cartSummaryWrapper');
  const totalHuecosSpan = document.getElementById('totalHuecosSpan');
  const totalInstallationsSpan = document.getElementById('totalInstallationsSpan');

  function renderCart() {
    if (!window.LockiaCart) return;
    const items = window.LockiaCart.getItems();

    if (items.length === 0) {
      if (cartTableContainer) cartTableContainer.style.display = 'none';
      if (cartSummaryWrapper) cartSummaryWrapper.style.display = 'none';
      if (cartEmptyMessage) cartEmptyMessage.style.display = 'block';
      return;
    }

    if (cartEmptyMessage) cartEmptyMessage.style.display = 'none';
    if (cartTableContainer) cartTableContainer.style.display = 'block';
    if (cartSummaryWrapper) cartSummaryWrapper.style.display = 'block';

    const tbody = document.getElementById('cartTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    let totalHuecos = 0;
    let totalInstallations = 0;

    items.forEach((item, index) => {
      totalHuecos += (parseInt(item.huecos, 10) || 0) * (parseInt(item.quantity, 10) || 1);
      totalInstallations += parseInt(item.quantity, 10) || 1;

      // 1. Main Row
      const trMain = document.createElement('tr');

      // Columna 0: Eliminar (×)
      const tdRemove = document.createElement('td');
      tdRemove.style.width = '48px';
      const btnRemove = document.createElement('button');
      btnRemove.type = 'button';
      btnRemove.className = 'btn-remove-item';
      btnRemove.title = 'Eliminar del carrito';
      btnRemove.innerHTML = '&times;';
      btnRemove.addEventListener('click', () => {
        window.LockiaCart.removeItem(index);
        renderCart();
      });
      tdRemove.appendChild(btnRemove);
      trMain.appendChild(tdRemove);

      // Columna 1: Color
      const tdColor = document.createElement('td');
      tdColor.innerHTML = `
        <div class="color-cell-display">
          <span class="cart-color-dot" style="background-color: ${item.colorCode}"></span>
          <span>${item.colorName}</span>
        </div>
      `;
      trMain.appendChild(tdColor);

      // Columna 2: Nº de huecos
      const tdHuecos = document.createElement('td');
      tdHuecos.innerHTML = `<strong>${item.huecos}</strong> huecos`;
      trMain.appendChild(tdHuecos);

      // Columna 3: Cantidad
      const tdQuantity = document.createElement('td');
      tdQuantity.innerHTML = `<strong>${item.quantity}</strong> ${parseInt(item.quantity, 10) === 1 ? 'unidad' : 'unidades'}`;
      trMain.appendChild(tdQuantity);

      // Columna 4: Distribución (Miniatura 5x5)
      const tdDist = document.createElement('td');
      const miniGrid = document.createElement('div');
      miniGrid.className = 'mini-grid-container';

      const activeList = item.disposition || [];
      const isIncomplete = item.incomplete;

      for (let c = 0; c < 25; c++) {
        const cellDiv = document.createElement('div');
        cellDiv.className = 'mini-cell';
        const pos = activeList.indexOf(c);
        if (pos !== -1) {
          const isLast = pos === activeList.length - 1;
          if (isLast && isIncomplete) {
            cellDiv.classList.add('mini-partial');
          } else {
            cellDiv.classList.add('mini-module');
          }
        }
        miniGrid.appendChild(cellDiv);
      }
      tdDist.appendChild(miniGrid);
      trMain.appendChild(tdDist);

      tbody.appendChild(trMain);
    });

    if (totalHuecosSpan) totalHuecosSpan.textContent = totalHuecos;
    if (totalInstallationsSpan) totalInstallationsSpan.textContent = totalInstallations;
  }

  renderCart();
});
