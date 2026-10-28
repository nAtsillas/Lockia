/**
 * Lockia - Checkout, Billing & Real-Time Invoice Script
 * Handles:
 * - Floating label input state tracking
 * - Real-time Spanish Postal Code lookup (Provinces 01..52 & Municipalities)
 * - Dynamic shipping (entrega) and installation rates (Madrid vs outside Madrid)
 * - Complete invoice decomposition per product with formula (Base 200€, Extra slots 10€, Delivery, Installation, Quantity)
 * - Dynamic validation: "Pagar" button remains disabled/gray until all mandatory fields are valid
 */

document.addEventListener('DOMContentLoaded', () => {
  // Spanish Postal Code Directory (01 to 52)
  const SPANISH_PROVINCES = {
    '01': { name: 'Álava', capital: 'Vitoria-Gasteiz' },
    '02': { name: 'Albacete', capital: 'Albacete' },
    '03': { name: 'Alicante', capital: 'Alicante' },
    '04': { name: 'Almería', capital: 'Almería' },
    '05': { name: 'Ávila', capital: 'Ávila' },
    '06': { name: 'Badajoz', capital: 'Badajoz' },
    '07': { name: 'Illes Balears', capital: 'Palma de Mallorca' },
    '08': { name: 'Barcelona', capital: 'Barcelona' },
    '09': { name: 'Burgos', capital: 'Burgos' },
    '10': { name: 'Cáceres', capital: 'Cáceres' },
    '11': { name: 'Cádiz', capital: 'Cádiz' },
    '12': { name: 'Castellón', capital: 'Castellón de la Plana' },
    '13': { name: 'Ciudad Real', capital: 'Ciudad Real' },
    '14': { name: 'Córdoba', capital: 'Córdoba' },
    '15': { name: 'A Coruña', capital: 'A Coruña' },
    '16': { name: 'Cuenca', capital: 'Cuenca' },
    '17': { name: 'Girona', capital: 'Girona' },
    '18': { name: 'Granada', capital: 'Granada' },
    '19': { name: 'Guadalajara', capital: 'Guadalajara' },
    '20': { name: 'Gipuzkoa', capital: 'San Sebastián' },
    '21': { name: 'Huelva', capital: 'Huelva' },
    '22': { name: 'Huesca', capital: 'Huesca' },
    '23': { name: 'Jaén', capital: 'Jaén' },
    '24': { name: 'León', capital: 'León' },
    '25': { name: 'Lleida', capital: 'Lleida' },
    '26': { name: 'La Rioja', capital: 'Logroño' },
    '27': { name: 'Lugo', capital: 'Lugo' },
    '28': { name: 'Madrid', capital: 'Madrid' },
    '29': { name: 'Málaga', capital: 'Málaga' },
    '30': { name: 'Murcia', capital: 'Murcia' },
    '31': { name: 'Navarra', capital: 'Pamplona' },
    '32': { name: 'Ourense', capital: 'Ourense' },
    '33': { name: 'Asturias', capital: 'Oviedo' },
    '34': { name: 'Palencia', capital: 'Palencia' },
    '35': { name: 'Las Palmas', capital: 'Las Palmas de Gran Canaria' },
    '36': { name: 'Pontevedra', capital: 'Pontevedra' },
    '37': { name: 'Salamanca', capital: 'Salamanca' },
    '38': { name: 'Santa Cruz de Tenerife', capital: 'Santa Cruz de Tenerife' },
    '39': { name: 'Cantabria', capital: 'Santander' },
    '40': { name: 'Segovia', capital: 'Segovia' },
    '41': { name: 'Sevilla', capital: 'Sevilla' },
    '42': { name: 'Soria', capital: 'Soria' },
    '43': { name: 'Tarragona', capital: 'Tarragona' },
    '44': { name: 'Teruel', capital: 'Teruel' },
    '45': { name: 'Toledo', capital: 'Toledo' },
    '46': { name: 'Valencia', capital: 'Valencia' },
    '47': { name: 'Valladolid', capital: 'Valladolid' },
    '48': { name: 'Bizkaia', capital: 'Bilbao' },
    '49': { name: 'Zamora', capital: 'Zamora' },
    '50': { name: 'Zaragoza', capital: 'Zaragoza' },
    '51': { name: 'Ceuta', capital: 'Ceuta' },
    '52': { name: 'Melilla', capital: 'Melilla' },
  };

  // Specific municipality ranges for Madrid
  function getMunicipalityFromCP(cp) {
    const prefix2 = cp.substring(0, 2);
    const num = parseInt(cp, 10);
    const prov = SPANISH_PROVINCES[prefix2];
    if (!prov) return null;

    if (prefix2 === '28') {
      if (num >= 28001 && num <= 28055) return { provincia: 'Madrid', municipio: 'Madrid (Capital)' };
      if (num >= 28801 && num <= 28807) return { provincia: 'Madrid', municipio: 'Alcalá de Henares' };
      if (num >= 28931 && num <= 28938) return { provincia: 'Madrid', municipio: 'Móstoles' };
      if (num >= 28911 && num <= 28919) return { provincia: 'Madrid', municipio: 'Leganés' };
      if (num >= 28901 && num <= 28909) return { provincia: 'Madrid', municipio: 'Getafe' };
      if (num >= 28921 && num <= 28925) return { provincia: 'Madrid', municipio: 'Alcorcón' };
      if (num >= 28100 && num <= 28109) return { provincia: 'Madrid', municipio: 'Alcobendas' };
      if (num >= 28220 && num <= 28224) return { provincia: 'Madrid', municipio: 'Majadahonda / Pozuelo' };
      if (num >= 28701 && num <= 28709) return { provincia: 'Madrid', municipio: 'San Sebastián de los Reyes' };
      return { provincia: 'Madrid', municipio: 'Comunidad de Madrid' };
    }

    if (prefix2 === '08' && num >= 8001 && num <= 8042) return { provincia: 'Barcelona', municipio: 'Barcelona (Capital)' };
    if (prefix2 === '46' && num >= 46001 && num <= 46026) return { provincia: 'Valencia', municipio: 'Valencia (Capital)' };
    if (prefix2 === '41' && num >= 41001 && num <= 41020) return { provincia: 'Sevilla', municipio: 'Sevilla (Capital)' };
    if (prefix2 === '50' && num >= 50001 && num <= 50022) return { provincia: 'Zaragoza', municipio: 'Zaragoza (Capital)' };
    if (prefix2 === '29' && num >= 29001 && num <= 29018) return { provincia: 'Málaga', municipio: 'Málaga (Capital)' };

    return { provincia: prov.name, municipio: prov.capital };
  }

  // State
  let isMadrid = false;
  let hasValidCP = false;

  // DOM Elements
  const inputNombre = document.getElementById('checkoutNombre');
  const inputPrimerApellido = document.getElementById('checkoutPrimerApellido');
  const inputSegundoApellido = document.getElementById('checkoutSegundoApellido');
  const inputDireccion = document.getElementById('checkoutDireccion');
  const inputDireccionAdicional = document.getElementById('checkoutDireccionAdicional');
  const inputCodigoPostal = document.getElementById('checkoutCodigoPostal');
  const inputEmail = document.getElementById('checkoutEmail');
  const inputTelefono = document.getElementById('checkoutTelefono');

  const postalLookupBadge = document.getElementById('postalLookupBadge');
  const postalLookupText = document.getElementById('postalLookupText');
  const emailErrorMsg = document.getElementById('emailErrorMsg');
  const phoneErrorMsg = document.getElementById('phoneErrorMsg');

  const itemsContainer = document.getElementById('checkoutInvoiceItemsContainer');
  const grandTotalEl = document.getElementById('checkoutGrandTotal');
  const btnPay = document.getElementById('btnPayAction');

  const paymentModal = document.getElementById('paymentSuccessModal');
  const modalSummaryBox = document.getElementById('modalOrderSummaryBox');

  // Check URL parameters for maintenance plans
  const urlParams = new URLSearchParams(window.location.search);
  const planParam = urlParams.get('plan');

  // Floating label helper: adds .has-value class when text is entered
  const allInputs = [
    inputNombre,
    inputPrimerApellido,
    inputSegundoApellido,
    inputDireccion,
    inputDireccionAdicional,
    inputCodigoPostal,
    inputEmail,
    inputTelefono,
  ];

  allInputs.forEach((inp) => {
    if (!inp) return;
    const checkValue = () => {
      if (inp.value && inp.value.trim().length > 0) {
        inp.classList.add('has-value');
      } else {
        inp.classList.remove('has-value');
      }
    };
    inp.addEventListener('input', checkValue);
    inp.addEventListener('blur', checkValue);
    checkValue();
  });

  // Validation Helpers
  function isValidEmail(val) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return re.test(String(val).trim());
  }

  function isValidPhone(val) {
    const cleaned = String(val).replace(/[^0-9]/g, '');
    return cleaned.length >= 9 && cleaned.length <= 15;
  }

  function isValidPostalCode(val) {
    const cleaned = String(val).trim();
    if (!/^\d{5}$/.test(cleaned)) return false;
    const prefix = cleaned.substring(0, 2);
    return Boolean(SPANISH_PROVINCES[prefix]);
  }

  // Real-time Postal Code Handler
  if (inputCodigoPostal) {
    inputCodigoPostal.addEventListener('input', (e) => {
      let val = e.target.value.replace(/[^0-9]/g, '');
      if (val.length > 5) val = val.substring(0, 5);
      e.target.value = val;

      if (val.length === 5) {
        const info = getMunicipalityFromCP(val);
        if (info) {
          hasValidCP = true;
          isMadrid = info.provincia.toLowerCase().includes('madrid');
          if (postalLookupBadge && postalLookupText) {
            postalLookupBadge.style.display = 'inline-flex';
            postalLookupBadge.className = 'postal-lookup-badge ' + (isMadrid ? 'badge-madrid' : 'badge-national');
            postalLookupText.innerHTML = `<strong>Provincia:</strong> ${info.provincia} • <strong>Municipio:</strong> ${info.municipio}`;
          }
        } else {
          hasValidCP = false;
          if (postalLookupBadge && postalLookupText) {
            postalLookupBadge.style.display = 'inline-flex';
            postalLookupBadge.className = 'postal-lookup-badge badge-invalid';
            postalLookupText.textContent = 'Código postal no reconocido en España';
          }
        }
      } else {
        hasValidCP = false;
        if (postalLookupBadge) postalLookupBadge.style.display = 'none';
      }

      renderInvoice();
      validateForm();
    });
  }

  // Email blur validation
  if (inputEmail) {
    inputEmail.addEventListener('blur', () => {
      const val = inputEmail.value.trim();
      if (val.length > 0 && !isValidEmail(val)) {
        if (emailErrorMsg) emailErrorMsg.style.display = 'block';
      } else {
        if (emailErrorMsg) emailErrorMsg.style.display = 'none';
      }
      validateForm();
    });
    inputEmail.addEventListener('input', () => {
      if (isValidEmail(inputEmail.value.trim())) {
        if (emailErrorMsg) emailErrorMsg.style.display = 'none';
      }
      validateForm();
    });
  }

  // Phone blur validation
  if (inputTelefono) {
    inputTelefono.addEventListener('blur', () => {
      const val = inputTelefono.value.trim();
      if (val.length > 0 && !isValidPhone(val)) {
        if (phoneErrorMsg) phoneErrorMsg.style.display = 'block';
      } else {
        if (phoneErrorMsg) phoneErrorMsg.style.display = 'none';
      }
      validateForm();
    });
    inputTelefono.addEventListener('input', () => {
      if (isValidPhone(inputTelefono.value.trim())) {
        if (phoneErrorMsg) phoneErrorMsg.style.display = 'none';
      }
      validateForm();
    });
  }

  // General field listeners to trigger button validation
  [inputNombre, inputPrimerApellido, inputDireccion].forEach((inp) => {
    if (!inp) return;
    inp.addEventListener('input', validateForm);
    inp.addEventListener('blur', validateForm);
  });

  function validateForm() {
    const isNomOk = inputNombre && inputNombre.value.trim().length > 0;
    const isApe1Ok = inputPrimerApellido && inputPrimerApellido.value.trim().length > 0;
    const isDirOk = inputDireccion && inputDireccion.value.trim().length > 0;
    const isCpOk = hasValidCP && inputCodigoPostal && isValidPostalCode(inputCodigoPostal.value);
    const isMailOk = inputEmail && isValidEmail(inputEmail.value.trim());
    const isPhoneOk = inputTelefono && isValidPhone(inputTelefono.value.trim());

    const isAllValid = isNomOk && isApe1Ok && isDirOk && isCpOk && isMailOk && isPhoneOk;

    if (btnPay) {
      if (isAllValid) {
        btnPay.disabled = false;
        btnPay.classList.add('active-enabled');
      } else {
        btnPay.disabled = true;
        btnPay.classList.remove('active-enabled');
      }
    }
  }

  // =========================================================================
  // DYNAMIC INVOICE RENDERING
  // Specifications:
  // - Nombre del color de la taquilla, huecos y distribución
  // - A la izquierda los apartados, y a la derecha el precio:
  //   1. Precio base (200€)
  //   2. Huecos adicionales (10 x el número de huecos, descompuesto así y con el resultado al lado)
  //   3. Entrega (25€ si es en Madrid, 30€ si no es en Madrid)
  //   4. Instalación (50€ si es en Madrid, 60€ si no es en Madrid)
  //   5. Cantidad indicada multiplicando la suma de los anteriores
  // - Por cada producto se desglosa todo lo anterior, y al final: Total con línea separadora.
  // =========================================================================
  function renderInvoice() {
    if (!itemsContainer) return;
    itemsContainer.innerHTML = '';

    const shippingPrice = isMadrid ? 25 : 30;
    const installPrice = isMadrid ? 50 : 60;
    const locationTag = isMadrid ? 'Madrid' : 'Nacional';

    // SCENARIO 1: Coming from Mantenimiento
    if (planParam === 'basico' || planParam === 'fuera_de_plan') {
      const isBasico = planParam === 'basico';
      const planTitle = isBasico ? 'Plan de mantenimiento básico' : 'Reparación fuera del plan';
      const planPriceText = isBasico ? '9,90 €' : '35,00 € - 60,00 €';
      const planNum = isBasico ? 9.9 : 45.0;

      const card = document.createElement('div');
      card.className = 'invoice-product-block';
      card.innerHTML = `
        <div class="product-block-header">
          <span class="product-title-text">${planTitle}</span>
          <span class="product-badge-maint">Servicio Técnico</span>
        </div>
        <div class="invoice-item-line">
          <span class="item-line-label">Tarifa del servicio:</span>
          <span class="item-line-price">${planPriceText} ${isBasico ? '/ mes' : '+ piezas'}</span>
        </div>
        <div class="invoice-item-line">
          <span class="item-line-label">Asistencia técnica y desplazamiento:</span>
          <span class="item-line-price">Incluido</span>
        </div>
        <div class="invoice-item-line">
          <span class="item-line-label">Cantidad:</span>
          <span class="item-line-price">1 suscripción</span>
        </div>
      `;
      itemsContainer.appendChild(card);

      if (grandTotalEl) grandTotalEl.textContent = `${planPriceText}`;
      return;
    }

    // SCENARIO 2: Taquillas (from cart or single item)
    let cartItems = [];
    if (window.LockiaCart) {
      cartItems = window.LockiaCart.getItems();
    }

    // Fallback if accessed directly with empty cart
    if (cartItems.length === 0) {
      cartItems = [
        {
          colorName: 'Negro metálico',
          colorCode: '#1e2229',
          huecos: 15,
          quantity: 1,
          disposition: [0],
        },
      ];
    }

    let overallGrandTotal = 0;

    cartItems.forEach((item, idx) => {
      const huecos = parseInt(item.huecos, 10) || 15;
      const quantity = parseInt(item.quantity, 10) || 1;
      const extraHuecos = Math.max(0, huecos - 15);
      const baseCost = 200;
      const extraCost = extraHuecos * 10;
      const productUnitSum = baseCost + extraCost + shippingPrice + installPrice;
      const productTotal = productUnitSum * quantity;

      overallGrandTotal += productTotal;

      const block = document.createElement('div');
      block.className = 'invoice-product-block';

      // Title: Nombre del color de la taquilla, huecos y distribución
      block.innerHTML = `
        <div class="product-block-header">
          <div class="product-title-text">
            <strong>${item.colorName}</strong> — ${huecos} huecos (Red 5×5)
          </div>
          <span class="product-index-pill">Producto #${idx + 1}</span>
        </div>

        <div class="invoice-table-grid">
          <!-- 1. Precio base -->
          <div class="invoice-item-line">
            <span class="item-line-label">Precio base (15 huecos mínimos):</span>
            <span class="item-line-price">200 €</span>
          </div>

          <!-- 2. Huecos adicionales (descompuesto 10 x n de huecos) -->
          <div class="invoice-item-line">
            <span class="item-line-label">
              Huecos adicionales (10 € × ${extraHuecos} ${extraHuecos === 1 ? 'hueco' : 'huecos'}):
            </span>
            <span class="item-line-price">${extraCost} €</span>
          </div>

          <!-- 3. Entrega (25€ si es Madrid, 30€ fuera) -->
          <div class="invoice-item-line">
            <span class="item-line-label">
              Entrega (${locationTag}):
            </span>
            <span class="item-line-price">${shippingPrice} €</span>
          </div>

          <!-- 4. Instalación (50€ si es Madrid, 60€ fuera) -->
          <div class="invoice-item-line">
            <span class="item-line-label">
              Instalación oficial (${locationTag}):
            </span>
            <span class="item-line-price">${installPrice} €</span>
          </div>

          <!-- Subtotal unitario -->
          <div class="invoice-item-line subtotal-unit-line">
            <span class="item-line-label">Subtotal unitario por taquilla:</span>
            <span class="item-line-price">${productUnitSum} €</span>
          </div>

          <!-- 5. Cantidad multiplicando la suma -->
          <div class="invoice-item-line quantity-multiplier-line">
            <span class="item-line-label">
              Cantidad (${quantity} ${quantity === 1 ? 'unidad' : 'unidades'} × ${productUnitSum} €):
            </span>
            <span class="item-line-price highlight-product-total">${productTotal} €</span>
          </div>
        </div>
      `;

      itemsContainer.appendChild(block);
    });

    if (grandTotalEl) {
      grandTotalEl.textContent = `${overallGrandTotal} €`;
    }
  }

  // Handle Pay Click
  if (btnPay) {
    btnPay.addEventListener('click', () => {
      if (btnPay.disabled) return;

      const nombre = inputNombre.value.trim();
      const apellido1 = inputPrimerApellido.value.trim();
      const dir = inputDireccion.value.trim();
      const cp = inputCodigoPostal.value.trim();
      const email = inputEmail.value.trim();
      const tel = inputTelefono.value.trim();
      const totalAmount = grandTotalEl ? grandTotalEl.textContent : '0 €';

      if (modalSummaryBox) {
        modalSummaryBox.innerHTML = `
          <p style="margin: 0 0 6px 0;"><strong>Titular:</strong> ${nombre} ${apellido1}</p>
          <p style="margin: 0 0 6px 0;"><strong>Dirección de entrega:</strong> ${dir} (CP: ${cp})</p>
          <p style="margin: 0 0 6px 0;"><strong>Email de confirmación:</strong> ${email}</p>
          <p style="margin: 0 0 6px 0;"><strong>Teléfono de contacto:</strong> ${tel}</p>
          <p style="margin: 8px 0 0 0; font-size: 1.05rem; color: #0284c7;"><strong>Importe Total Facturado:</strong> ${totalAmount}</p>
        `;
      }

      if (paymentModal) paymentModal.style.display = 'flex';

      // Clear cart upon successful checkout
      if (window.LockiaCart && !planParam) {
        window.LockiaCart.clear();
      }
    });
  }

  // Initial render & validation check
  renderInvoice();
  validateForm();
});
