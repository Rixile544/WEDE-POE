// js/script.js - Luna Cafe interactivity (cart, form validation, lightbox, mobile nav)

document.addEventListener('DOMContentLoaded', () => {

  /* ---------------- Mobile nav toggle ---------------- */
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('active'));
  }

  /* ---------------- Lightbox for images ---------------- */
  (function lightboxSetup(){
    const imgs = document.querySelectorAll('.lightbox-img');
    if (!imgs.length) return;
    const overlay = document.createElement('div');
    overlay.id = 'lightbox-overlay';
    overlay.style = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;visibility:hidden;z-index:9999;padding:18px';
    const img = document.createElement('img');
    img.style.maxWidth='95%'; img.style.maxHeight='95%'; img.style.borderRadius='8px';
    overlay.appendChild(img);
    document.body.appendChild(overlay);
    imgs.forEach(i => { i.style.cursor='zoom-in'; i.addEventListener('click', ()=>{ img.src = i.src; overlay.style.visibility='visible'; }); });
    overlay.addEventListener('click', ()=> overlay.style.visibility='hidden');
  })();

  /* ---------------- Menu search/filter (if exists) ---------------- */
  const menuSearch = document.getElementById('menu-search');
  if (menuSearch) {
    menuSearch.addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.menu-item').forEach(card => {
        const text = (card.textContent || '').toLowerCase();
        card.style.display = text.includes(q) ? '' : 'none';
      });
    });
  }

  /* ---------------- Simple animations ---------------- */
  document.querySelectorAll('.menu-item, .service-card, .review-card').forEach(el => {
    el.style.transition = 'transform 200ms ease, box-shadow 200ms ease';
    el.addEventListener('mouseenter', () => { el.style.transform='translateY(-6px)'; el.style.boxShadow='0 12px 28px rgba(0,0,0,0.12)'; });
    el.addEventListener('mouseleave', () => { el.style.transform=''; el.style.boxShadow=''; });
  });

  /* ---------------- Cart functionality ---------------- */
  const CART_KEY = 'luna_cart_v1';

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch(e){ return []; }
  }
  function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartBadge(); }

  function addToCart(item) {
    const cart = getCart();
    const exists = cart.find(i => i.id === item.id);
    if (exists) { exists.qty += 1; }
    else { cart.push({ ...item, qty: 1 }); }
    saveCart(cart);
    flashMessage('Added to cart');
  }

  function removeFromCart(id) {
    let cart = getCart();
    cart = cart.filter(i => i.id !== id);
    saveCart(cart);
  }

  function updateQty(id, qty) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty = Math.max(0, Math.floor(qty));
    if (item.qty === 0) removeFromCart(id);
    else saveCart(cart);
  }

  function cartTotal() {
    const cart = getCart();
    return cart.reduce((s,i) => s + (i.price * i.qty), 0);
  }

  function updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    const totalQty = getCart().reduce((s,i)=>s+i.qty,0);
    if (badge) badge.textContent = totalQty;
  }

  function flashMessage(text) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style = 'position:fixed;right:20px;bottom:20px;background:#6b4226;color:#fff;padding:10px 14px;border-radius:8px;z-index:9999;box-shadow:0 6px 18px rgba(0,0,0,0.2);transition:opacity 0.6s';
    document.body.appendChild(el);
    setTimeout(()=> el.style.opacity = '0', 1600);
    setTimeout(()=> el.remove(), 2200);
  }

  // Wire add-to-cart buttons
  document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      const price = parseFloat(btn.getAttribute('data-price')) || 0;
      addToCart({ id, name, price });
    });
  });

  // Expose helper to window for cart page
  window.lunaCart = { getCart, saveCart, addToCart, removeFromCart, updateQty, cartTotal, updateCartBadge };

  // Update badge at start
  updateCartBadge();

  /* ---------------- Cart page rendering (if on cart.html) ---------------- */
  function renderCartPage() {
    const container = document.getElementById('cart-container');
    if (!container) return;
    const cart = getCart();
    if (!cart.length) {
      container.innerHTML = '<p class="small">Your cart is empty. Browse the <a href="menu.html">menu</a>.</p>';
      return;
    }
    let html = '<table class="cart-table"><thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Total</th><th></th></tr></thead><tbody>';
    cart.forEach(item => {
      html += `<tr data-id="${item.id}">
        <td>${escapeHtml(item.name)}</td>
        <td>R${item.price.toFixed(2)}</td>
        <td><input class="qty-input" type="number" min="0" value="${item.qty}" data-id="${item.id}"></td>
        <td>R${(item.price * item.qty).toFixed(2)}</td>
        <td><button class="remove-item" data-id="${item.id}">Remove</button></td>
      </tr>`;
    });
    html += `</tbody></table>
      <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
        <div class="small">Subtotal: <strong>R${cartTotal().toFixed(2)}</strong></div>
        <div>
          <a href="menu.html" class="btn" style="margin-right:10px">Continue Shopping</a>
          <a href="#" id="checkout-btn" class="btn">Checkout</a>
        </div>
      </div>`;
    container.innerHTML = html;

    container.querySelectorAll('.qty-input').forEach(inp => {
      inp.addEventListener('change', (e) => {
        const id = inp.getAttribute('data-id');
        const qty = parseInt(inp.value, 10) || 0;
        updateQty(id, qty);
        renderCartPage();
      });
    });
    container.querySelectorAll('.remove-item').forEach(b => b.addEventListener('click', () => {
      removeFromCart(b.getAttribute('data-id'));
      renderCartPage();
    }));
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', e => {
        e.preventDefault();
        window.location.href = 'cart.html?checkout=true';
      });
    }
  }

  renderCartPage();

  /* ---------------- Mini-Cart Popup ---------------- */
  const miniCart = document.getElementById('mini-cart');
  const miniCartItems = document.getElementById('mini-cart-items');
  const miniCartTotal = document.getElementById('mini-cart-total');
  const cartBadge = document.querySelector('.cart-badge');

  function renderMiniCart() {
    const cart = getCart();
    if (!cart.length) {
      miniCartItems.innerHTML = '<p>Your cart is empty.</p>';
      miniCartTotal.textContent = '0.00';
      return;
    }
    let html = '';
    cart.forEach(it => {
      html += `
        <div style="margin-bottom:10px;border-bottom:1px solid #eee;padding-bottom:6px;">
          <div>${escapeHtml(it.name)}</div>
          <div>R${it.price.toFixed(2)} x <input type="number" min="0" value="${it.qty}" data-id="${it.id}" style="width:50px;"> = R${(it.price*it.qty).toFixed(2)}</div>
          <button data-remove-id="${it.id}" style="margin-top:4px;background:#f55;color:#fff;border:none;padding:4px 6px;border-radius:4px;cursor:pointer;">Remove</button>
        </div>
      `;
    });
    miniCartItems.innerHTML = html;
    miniCartTotal.textContent = cartTotal().toFixed(2);

    miniCartItems.querySelectorAll('input[type="number"]').forEach(inp => {
      inp.addEventListener('change', () => {
        const id = inp.getAttribute('data-id');
        const qty = parseInt(inp.value,10) || 0;
        updateQty(id, qty);
        renderMiniCart();
        updateCartBadge();
      });
    });

    miniCartItems.querySelectorAll('[data-remove-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        removeFromCart(btn.getAttribute('data-remove-id'));
        renderMiniCart();
        updateCartBadge();
      });
    });
  }

  if (cartBadge && miniCart) {
    cartBadge.addEventListener('click', () => {
      renderMiniCart();
      miniCart.style.right = '0';
    });
  }

  const miniCartClose = document.getElementById('mini-cart-close');
  if (miniCartClose) {
    miniCartClose.addEventListener('click', () => miniCart.style.right = '-400px');
  }

  const miniCartCheckout = document.getElementById('mini-cart-checkout');
  if (miniCartCheckout) {
    miniCartCheckout.addEventListener('click', () => {
      window.location.href = 'cart.html';
    });
  }

  /* ---------------- Basic form validation ---------------- */
  function basicFormSetup(id) {
    const form = document.getElementById(id);
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const required = Array.from(form.querySelectorAll('[required]'));
      for (const el of required) {
        if (!el.value.trim()) {
          alert('Please fill all required fields.');
          el.focus();
          return;
        }
      }
      const email = form.querySelector('input[type="email"]');
      if (email && !/^\S+@\S+\.\S+$/.test(email.value.trim())) {
        alert('Please enter a valid email address.');
        email.focus();
        return;
      }
      const endpoint = form.getAttribute('data-endpoint');
      const payload = {};
      new FormData(form).forEach((v,k) => payload[k]=v);
      if (endpoint) {
        try {
          const res = await fetch(endpoint, { method:'POST', headers:{ 'Content-Type':'application/json', 'Accept':'application/json' }, body: JSON.stringify(payload) });
          if (res.ok) { alert('Submission successful. Thank you!'); form.reset(); }
          else { alert('Submission failed, please try again later.'); }
        } catch (err) {
          alert('Network error. Please try again later.');
        }
      } else {
        alert('Form validated. (No endpoint configured) — demo mode.');
        form.reset();
      }
    });
  }
  basicFormSetup('enquiry-form');
  basicFormSetup('contact-form');

  /* ---------------- Utility ---------------- */
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

});

/* ---------------- 3D Image Orbit ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  const orbit = document.querySelector('.orbit');
  if (!orbit) return;

  // Optional: Mouse movement control
  let mouseX = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX / 5;
    orbit.style.transform = `rotateY(${mouseX}deg)`;
  });

  // Optional: Touch support for mobile
  let startX = 0;
  window.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  });
  window.addEventListener('touchmove', (e) => {
    const diff = e.touches[0].clientX - startX;
    orbit.style.transform = `rotateY(${diff / 2}deg)`;
  });
});
