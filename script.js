const BASE_URL = 'http://localhost:5000/api/wms';

// ========================
//   Modal Management
// ========================
function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
});

// ESC key closes top modal
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => {
      m.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
});

// ========================
//   Toast Notification
// ========================
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3200);
}

// ========================
//   Header Date
// ========================
function setHeaderDate() {
  const el = document.getElementById('headerDate');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleDateString('en-IN', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}

// ========================
//   Search Location
// ========================
async function searchLocation() {
  const sku = document.getElementById("searchSku").value.trim();
  const tableBody = document.getElementById("locationTable");
  tableBody.innerHTML = '';

  if (!sku) {
    showToast('Please enter a SKU', 'error');
    return;
  }

  tableBody.innerHTML = `<tr><td colspan="5" class="empty-row">Searching...</td></tr>`;

  try {
    const res = await fetch(`${BASE_URL}/location/${sku}`);
    const data = await res.json();

    if (!data || data.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" class="empty-row">No location found for SKU: ${sku}</td></tr>`;
      return;
    }

    tableBody.innerHTML = data.map(item => `
      <tr>
        <td>${item.p_sku}</td>
        <td>${item.in_bim}</td>
        <td>${item.in_rack_no}</td>
        <td>${item.in_r_column}</td>
        <td>${item.in_r_row}</td>
      </tr>`).join('');

  } catch (err) {
    console.error(err);
    tableBody.innerHTML = `<tr><td colspan="5" class="empty-row">Error fetching location</td></tr>`;
    showToast('Error fetching location', 'error');
  }
}

// ========================
//   Load Inventory
// ========================
async function loadInventory() {
  try {
    const res = await fetch(`${BASE_URL}/inventory`);
    const data = await res.json();

    const tbody = document.getElementById('inventory');
    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty-row">No inventory found</td></tr>`;
      updateStats([], null);
      return;
    }

    tbody.innerHTML = data.map(p => `
      <tr onclick="showProductDetail(${JSON.stringify(p).replace(/"/g, '&quot;')})">
        <td>${p.p_sku}</td>
        <td>${p.p_name}</td>
        <td>${p.p_quantity}</td>
        <td>₹${parseFloat(p.p_price).toLocaleString('en-IN')}</td>
      </tr>`).join('');

    updateStats(data, null);

  } catch (err) {
    console.error(err);
    document.getElementById('inventory').innerHTML =
      `<tr><td colspan="4" class="empty-row">Could not load inventory</td></tr>`;
  }
}

// ========================
//   Load Orders
// ========================
async function loadOrders() {
  try {
    const res = await fetch(`${BASE_URL}/orders`);
    const data = await res.json();

    const tbody = document.getElementById('order');
    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty-row">No orders found</td></tr>`;
      updateStats(null, 0);
      return;
    }

    tbody.innerHTML = data.map(p => {
      const date = p.ord_date ? new Date(p.ord_date).toLocaleDateString('en-IN') : '—';
      return `
        <tr>
          <td style="font-family:inherit;color:var(--text);font-size:13px">${p.cust_name}</td>
          <td style="font-family:'Space Mono',monospace;font-size:11px;color:var(--muted)">${date}</td>
          <td>${p.p_sku}</td>
          <td style="font-family:inherit;color:var(--text);font-size:13px">${p.p_name}</td>
          <td style="color:var(--green);font-family:'Space Mono',monospace;font-size:12px">₹${parseFloat(p.p_price).toLocaleString('en-IN')}</td>
          <td style="font-family:'Space Mono',monospace;font-size:12px">${p.item_quantity}</td>
          <td style="color:var(--accent);font-family:'Space Mono',monospace;font-size:12px;font-weight:700">₹${parseFloat(p.total_price).toLocaleString('en-IN')}</td>
        </tr>`;
    }).join('');

    updateStats(null, data.length);

  } catch (err) {
    console.error(err);
    document.getElementById('order').innerHTML =
      `<tr><td colspan="7" class="empty-row">Could not load orders</td></tr>`;
  }
}

// ========================
//   Update Stats
// ========================
function updateStats(inventoryData, orderCount) {
  if (inventoryData !== null) {
    document.getElementById('statTotal').textContent = inventoryData.length;
    const totalQty = inventoryData.reduce((s, i) => s + (parseInt(i.p_quantity) || 0), 0);
    document.getElementById('statQty').textContent = totalQty.toLocaleString('en-IN');
    const totalVal = inventoryData.reduce((s, i) => s + ((parseFloat(i.p_price) || 0) * (parseInt(i.p_quantity) || 0)), 0);
    document.getElementById('statValue').textContent = '₹' + totalVal.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }
  if (orderCount !== null) {
    document.getElementById('statOrders').textContent = orderCount;
  }
}

// ========================
//   Add Product
// ========================
async function addProduct() {
  const sku   = document.getElementById('sku').value.trim();
  const name  = document.getElementById('name').value.trim();
  const qty   = parseInt(document.getElementById('qty').value);
  const price = parseFloat(document.getElementById('price').value);

  if (!sku || !name || !qty || !price) {
    showToast('Please fill all fields', 'error');
    return;
  }

  try {
    await fetch(`${BASE_URL}/add-product`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, name, qty, price })
    });

    showToast(`✓ Product "${name}" added to inventory`);
    closeModal('addModal');

    // Clear fields
    ['sku','name','qty','price'].forEach(id => document.getElementById(id).value = '');

    loadInventory();

  } catch (err) {
    console.error(err);
    showToast('Error adding product', 'error');
  }
}

// ========================
//   Set Location
// ========================
async function setLocation() {
  const sku     = document.getElementById('locSku').value.trim();
  const bim     = document.getElementById('locBim').value.trim();
  const rackNo  = document.getElementById('locRack').value.trim();
  const rColumn = document.getElementById('locColumn').value.trim();
  const rRow    = document.getElementById('locRow').value.trim();

  if (!sku || !bim || !rackNo || !rColumn || !rRow) {
    showToast('Please fill all fields', 'error');
    return;
  }

  try {
    await fetch(`${BASE_URL}/set-location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, bim, rackNo, rColumn, rRow })
    });

    showToast(`✓ Location set for SKU: ${sku}`);
    closeModal('setLocModal');
    ['locSku','locBim','locRack','locColumn','locRow'].forEach(id => document.getElementById(id).value = '');

  } catch (err) {
    console.error(err);
    showToast('Error setting location', 'error');
  }
}

// ========================
//   Dispatch Product
// ========================
async function dispatchProduct() {
  const sku = document.getElementById('outSku').value.trim();
  const qty = parseInt(document.getElementById('outQty').value);

  if (!sku || !qty) {
    showToast('Please fill all fields', 'error');
    return;
  }

  try {
    await fetch(`${BASE_URL}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, qty })
    });

    showToast(`✓ ${qty} units of ${sku} dispatched`);
    closeModal('dispatchModal');
    document.getElementById('outSku').value = '';
    document.getElementById('outQty').value = '';

    loadInventory();

  } catch (err) {
    console.error(err);
    showToast('Error dispatching product', 'error');
  }
}

// ========================
//   Product Detail Modal
// ========================
let _currentDetail = null;

function showProductDetail(product) {
  _currentDetail = product;
  document.getElementById('detailSku').textContent = product.p_sku;
  document.getElementById('d_sku').textContent  = product.p_sku;
  document.getElementById('d_name').textContent = product.p_name;
  // Hints
  document.getElementById('hint_qty').textContent   = parseInt(product.p_quantity).toLocaleString('en-IN');
  document.getElementById('hint_price').textContent = parseFloat(product.p_price).toLocaleString('en-IN');
  // Pre-fill editable fields with current values
  document.getElementById('edit_qty').value   = product.p_quantity;
  document.getElementById('edit_price').value = product.p_price;
  openModal('detailModal');
}

async function updateProduct() {
  if (!_currentDetail) return;

  const qty   = parseInt(document.getElementById('edit_qty').value);
  const price = parseFloat(document.getElementById('edit_price').value);
  const sku   = _currentDetail.p_sku;

  if (isNaN(qty) || qty < 0) { showToast('Please enter a valid quantity', 'error'); return; }
  if (isNaN(price) || price < 0) { showToast('Please enter a valid price', 'error'); return; }

  try {
    await fetch(`${BASE_URL}/add-product`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku, qty, price })
    });

    showToast(`✓ ${sku} updated — Qty: ${qty}, Price: ₹${price}`);
    closeModal('detailModal');
    loadInventory();

  } catch (err) {
    console.error(err);
    showToast('Error updating product', 'error');
  }
}

async function deleteProduct() {
  if (!_currentDetail) return;

  const sku = _currentDetail.p_sku;

  if (!confirm(`Are you sure you want to delete product "${sku}"? This action cannot be undone.`)) {
    return;
  }

  try {
    await fetch(`${BASE_URL}/delete-product/${sku}`, { method: 'DELETE' });
    showToast(`✓ Product "${sku}" deleted`);
    closeModal('detailModal');
    loadInventory();
  } catch (err) {
    console.error(err);
    showToast('Error deleting product', 'error');
  }
}

function prefillDispatch() {
  if (_currentDetail) {
    closeModal('detailModal');
    document.getElementById('outSku').value = _currentDetail.p_sku;
    document.getElementById('outQty').value = '';
    openModal('dispatchModal');
  }
}


// ========================
//   Initial Load
// ========================
window.onload = () => {
  setHeaderDate();
  loadInventory();
  loadOrders();
};