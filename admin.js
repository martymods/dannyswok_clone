(function () {
  const ANIMATION_DURATION = 300;
  const SIDEBAR_EL = document.getElementById('sidebar');
  const OVERLAY_EL = document.getElementById('overlay');
  const SUB_MENU_ELS = document.querySelectorAll('.menu > ul > .menu-item.sub-menu');
  const FIRST_SUB_MENUS_BTN = document.querySelectorAll('.menu > ul > .menu-item.sub-menu > a');
  const INNER_SUB_MENUS_BTN = document.querySelectorAll(
    '.menu > ul > .menu-item.sub-menu .menu-item.sub-menu > a'
  );

  class PopperObject {
    constructor(reference, popperTarget) {
      this.instance = null;
      this.reference = null;
      this.popperTarget = null;
      this.init(reference, popperTarget);
    }

    init(reference, popperTarget) {
      if (!window.Popper) {
        return;
      }
      this.reference = reference;
      this.popperTarget = popperTarget;
      this.instance = window.Popper.createPopper(this.reference, this.popperTarget, {
        placement: 'right',
        strategy: 'fixed',
        resize: true,
        modifiers: [
          {
            name: 'computeStyles',
            options: { adaptive: false },
          },
          {
            name: 'flip',
            options: { fallbackPlacements: ['left', 'right'] },
          },
        ],
      });

      document.addEventListener(
        'click',
        (event) => this.handleDocumentClick(event, this.popperTarget, this.reference),
        false
      );

      const resizeObserver = new ResizeObserver(() => {
        this.instance?.update();
      });

      resizeObserver.observe(this.popperTarget);
      resizeObserver.observe(this.reference);
    }

    handleDocumentClick(event, popperTarget, reference) {
      if (
        SIDEBAR_EL?.classList.contains('collapsed') &&
        !popperTarget.contains(event.target) &&
        !reference.contains(event.target)
      ) {
        this.hide();
      }
    }

    hide() {
      if (this.instance) {
        this.instance.state.elements.popper.style.visibility = 'hidden';
      }
    }
  }

  class Poppers {
    constructor() {
      this.subMenuPoppers = [];
      this.init();
    }

    init() {
      SUB_MENU_ELS.forEach((element) => {
        const target = element.lastElementChild;
        if (!target) {
          return;
        }
        this.subMenuPoppers.push(new PopperObject(element, target));
        this.closePoppers();
      });
    }

    togglePopper(target) {
      if (!target) {
        return;
      }
      const currentVisibility = window.getComputedStyle(target).visibility;
      target.style.visibility = currentVisibility === 'hidden' ? 'visible' : 'hidden';
    }

    updatePoppers() {
      this.subMenuPoppers.forEach((popper) => {
        if (popper.instance) {
          popper.instance.state.elements.popper.style.display = 'none';
          popper.instance.update();
        }
      });
    }

    closePoppers() {
      this.subMenuPoppers.forEach((popper) => popper.hide());
    }
  }

  const slideUp = (target, duration = ANIMATION_DURATION) => {
    if (!target) {
      return;
    }
    const parent = target.parentElement;
    parent?.classList.remove('open');
    target.style.transitionProperty = 'height, margin, padding';
    target.style.transitionDuration = `${duration}ms`;
    target.style.boxSizing = 'border-box';
    target.style.height = `${target.offsetHeight}px`;
    target.offsetHeight;
    target.style.overflow = 'hidden';
    target.style.height = '0';
    target.style.paddingTop = '0';
    target.style.paddingBottom = '0';
    target.style.marginTop = '0';
    target.style.marginBottom = '0';
    window.setTimeout(() => {
      target.style.display = 'none';
      target.style.removeProperty('height');
      target.style.removeProperty('padding-top');
      target.style.removeProperty('padding-bottom');
      target.style.removeProperty('margin-top');
      target.style.removeProperty('margin-bottom');
      target.style.removeProperty('overflow');
      target.style.removeProperty('transition-duration');
      target.style.removeProperty('transition-property');
    }, duration);
  };

  const slideDown = (target, duration = ANIMATION_DURATION) => {
    if (!target) {
      return;
    }
    const parent = target.parentElement;
    parent?.classList.add('open');
    target.style.removeProperty('display');
    let { display } = window.getComputedStyle(target);
    if (display === 'none') {
      display = 'block';
    }
    target.style.display = display;
    const height = target.offsetHeight;
    target.style.overflow = 'hidden';
    target.style.height = '0';
    target.style.paddingTop = '0';
    target.style.paddingBottom = '0';
    target.style.marginTop = '0';
    target.style.marginBottom = '0';
    target.offsetHeight;
    target.style.boxSizing = 'border-box';
    target.style.transitionProperty = 'height, margin, padding';
    target.style.transitionDuration = `${duration}ms`;
    target.style.height = `${height}px`;
    target.style.removeProperty('padding-top');
    target.style.removeProperty('padding-bottom');
    target.style.removeProperty('margin-top');
    target.style.removeProperty('margin-bottom');
    window.setTimeout(() => {
      target.style.removeProperty('height');
      target.style.removeProperty('overflow');
      target.style.removeProperty('transition-duration');
      target.style.removeProperty('transition-property');
    }, duration);
  };

  const slideToggle = (target, duration = ANIMATION_DURATION) => {
    if (!target) {
      return;
    }
    if (window.getComputedStyle(target).display === 'none') {
      slideDown(target, duration);
    } else {
      slideUp(target, duration);
    }
  };

  const PoppersInstance = window.Popper ? new Poppers() : null;

  const updatePoppersTimeout = () => {
    if (!PoppersInstance) {
      return;
    }
    setTimeout(() => {
      PoppersInstance.updatePoppers();
    }, ANIMATION_DURATION);
  };

  const closeAllPoppers = () => {
    PoppersInstance?.closePoppers();
  };

  const collapseButton = document.getElementById('btn-collapse');
  if (collapseButton && SIDEBAR_EL) {
    collapseButton.addEventListener('click', () => {
      SIDEBAR_EL.classList.toggle('collapsed');
      closeAllPoppers();
      if (SIDEBAR_EL.classList.contains('collapsed')) {
        FIRST_SUB_MENUS_BTN.forEach((button) => button.parentElement?.classList.remove('open'));
      }
      updatePoppersTimeout();
    });
  }

  const toggleButton = document.getElementById('btn-toggle');
  if (toggleButton && SIDEBAR_EL) {
    toggleButton.addEventListener('click', (event) => {
      event.preventDefault();
      SIDEBAR_EL.classList.toggle('toggled');
      updatePoppersTimeout();
    });
  }

  if (OVERLAY_EL && SIDEBAR_EL) {
    OVERLAY_EL.addEventListener('click', () => {
      SIDEBAR_EL.classList.remove('toggled');
    });
  }

  const defaultOpenMenus = document.querySelectorAll('.menu-item.sub-menu.open');
  defaultOpenMenus.forEach((element) => {
    const subMenu = element.lastElementChild;
    if (subMenu) {
      subMenu.style.display = 'block';
    }
  });

  FIRST_SUB_MENUS_BTN.forEach((element) => {
    element.addEventListener('click', (event) => {
      const subMenu = element.nextElementSibling;
      if (!subMenu) {
        return;
      }
      if (SIDEBAR_EL?.classList.contains('collapsed')) {
        event.preventDefault();
        PoppersInstance?.togglePopper(subMenu);
      } else {
        const parentMenu = element.closest('.menu.open-current-submenu');
        if (parentMenu) {
          parentMenu
            .querySelectorAll(':scope > ul > .menu-item.sub-menu > a')
            .forEach((anchor) => {
              const next = anchor.nextElementSibling;
              if (next && next !== subMenu && window.getComputedStyle(next).display !== 'none') {
                slideUp(next);
              }
            });
        }
        slideToggle(subMenu);
      }
    });
  });

  INNER_SUB_MENUS_BTN.forEach((element) => {
    element.addEventListener('click', (event) => {
      const subMenu = element.nextElementSibling;
      if (!subMenu) {
        return;
      }
      event.preventDefault();
      slideToggle(subMenu);
    });
  });

  const panelSections = document.querySelectorAll('[data-panel]');
  const panelLinks = document.querySelectorAll('[data-panel-target]');
  const menuItems = document.querySelectorAll('.menu .menu-item');
  const tabButtons = document.querySelectorAll('[data-orders-tab]');
  const tabPanels = document.querySelectorAll('[data-orders-panel]');
  const runTabButtons = document.querySelectorAll('[data-run-tab]');
  const runTabPanels = document.querySelectorAll('[data-run-panel]');

  const customerMapElement = document.getElementById('customer-locations-map');
  let customerMap = null;
  const customerMarkers = [];

  const activateMenuItem = (targetId) => {
    menuItems.forEach((item) => item.classList.remove('active'));
    panelLinks.forEach((link) => {
      const isActive = link.dataset.panelTarget === targetId;
      const parentItem = link.closest('.menu-item');
      if (!parentItem) {
        return;
      }
      if (isActive) {
        parentItem.classList.add('active');
        const parentSubMenu = parentItem.closest('.menu-item.sub-menu');
        if (parentSubMenu) {
          parentSubMenu.classList.add('active');
          const subList = parentSubMenu.querySelector(':scope > .sub-menu-list');
          if (subList && window.getComputedStyle(subList).display === 'none') {
            slideDown(subList, 200);
          }
        }
      } else if (parentItem.classList.contains('sub-menu')) {
        parentItem.classList.remove('active');
      }
    });
  };

  const setActivePanel = (panelId, { updateHash = true } = {}) => {
    if (!panelId) {
      return;
    }
    let targetPanel = document.getElementById(panelId);
    if (!targetPanel) {
      targetPanel = Array.from(panelSections).find((section) => section.id === panelId) || null;
    }
    if (!targetPanel) {
      return;
    }
    panelSections.forEach((section) => {
      section.classList.toggle('is-active', section === targetPanel);
    });
    activateMenuItem(panelId);
    if (updateHash && window.location.hash !== `#${panelId}`) {
      window.history.replaceState(null, '', `#${panelId}`);
    }
    if (SIDEBAR_EL?.classList.contains('toggled')) {
      SIDEBAR_EL.classList.remove('toggled');
    }
    closeAllPoppers();
    if (panelId === 'stores-admin' && window.L && typeof leafletMap?.invalidateSize === 'function') {
      setTimeout(() => leafletMap.invalidateSize(), ANIMATION_DURATION);
    }
    if (panelId === 'customers-insights' && window.L && typeof customerMap?.invalidateSize === 'function') {
      setTimeout(() => customerMap.invalidateSize(), ANIMATION_DURATION);
    }
  };

  panelLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = link.dataset.panelTarget;
      if (!target) {
        return;
      }
      event.preventDefault();
      setActivePanel(target);
    });
  });

  const handleHashNavigation = () => {
    const hash = window.location.hash.replace('#', '') || 'home-overview';
    setActivePanel(hash, { updateHash: false });
  };

  window.addEventListener('hashchange', handleHashNavigation);

  const activateTab = (tabId) => {
    if (!tabId) {
      return;
    }
    tabButtons.forEach((button) => {
      const isActive = button.dataset.ordersTab === tabId;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    tabPanels.forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.ordersPanel === tabId);
    });
  };

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activateTab(button.dataset.ordersTab);
    });
  });

  const activateRunTab = (tabId) => {
    if (!tabId) {
      return;
    }
    runTabButtons.forEach((button) => {
      const isActive = button.dataset.runTab === tabId;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    runTabPanels.forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.runPanel === tabId);
    });
  };

  runTabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activateRunTab(button.dataset.runTab);
    });
  });

  const initHomeChart = () => {
    const canvas = document.getElementById('home-sales-chart');
    if (!canvas || !window.Chart) {
      return;
    }
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'rgba(255, 129, 0, 0.45)');
    gradient.addColorStop(1, 'rgba(255, 129, 0, 0)');

    new window.Chart(canvas, {
      type: 'line',
      data: {
        labels: ['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'],
        datasets: [
          {
            label: 'Gross sales',
            data: [0, 0, 0, 0, 0, 0, 0],
            borderColor: '#ff8100',
            backgroundColor: gradient,
            tension: 0.35,
            fill: true,
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(4,14,30,0.9)',
            borderColor: 'rgba(255,129,0,0.6)',
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#cbd2e9' },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: {
              color: '#cbd2e9',
              callback: (value) => `$${Number(value).toFixed(2)}`,
            },
          },
        },
      },
    });
  };

  const menuContainer = document.getElementById('menu-admin-container');
  const menuStatus = document.getElementById('menu-admin-status');
  const storeStatus = document.getElementById('store-admin-status');
  const storeList = document.getElementById('store-list');
  const profilesList = document.getElementById('profiles-list');
  const profilesStatus = document.getElementById('profiles-status');
  const ordersStatus = document.getElementById('orders-status');
  const ordersTableBody = document.querySelector('#orders-table tbody');
  const profileDetail = document.getElementById('profile-detail');
  const profileDetailContent = document.getElementById('profile-detail-content');
  const profileDetailTitle = document.getElementById('profile-detail-title');
  const closeProfileDetailButton = document.getElementById('close-profile-detail');

  let activeProfileId = null;
  let leafletMap = null;
  const storeMarkers = new Map();
  let cachedStores = [];

  function formatCurrency(value) {
    if (!Number.isFinite(value)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  function formatNumber(value, { maximumFractionDigits = 0 } = {}) {
    if (!Number.isFinite(value)) {
      return '0';
    }
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits,
    }).format(value);
  }

  function formatDate(value) {
    if (!value) {
      return '—';
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleString();
  }

  function setStatus(element, message, variant = '') {
    if (!element) {
      return;
    }
    if (!message) {
      element.textContent = '';
      element.removeAttribute('data-status');
      return;
    }
    element.textContent = message;
    element.dataset.status = variant;
  }

  function resolveFetchUrl(url) {
    if (typeof url !== 'string') {
      return url;
    }

    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return url;
      }
    } catch (error) {
      // Ignore errors from invalid URLs so we can resolve relative paths below.
    }

    const backendOrigin =
      window.DELCO_BACKEND_BASE ||
      window.DANNYS_WOK_BACKEND_BASE ||
      window.DANNYSWOK_BACKEND_BASE ||
      window.location.origin;

    try {
      return new URL(url, backendOrigin).toString();
    } catch (error) {
      return url;
    }
  }

  async function fetchJson(url, options = {}) {
    const resolvedUrl = resolveFetchUrl(url);
    try {
      const response = await fetch(resolvedUrl, options);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const err = new Error(error.message || error.error || response.statusText || 'Request failed');
        err.status = response.status;
        throw err;
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async function loadMenuData() {
    const [menuData, overridesData] = await Promise.all([
      fetchJson('data/menu-data.json', { cache: 'no-store' }),
      fetchJson('/api/admin/menu/overrides', { cache: 'no-store' })
        .catch(() => fetchJson('/api/menu/overrides', { cache: 'no-store' }))
        .catch(() => ({ items: {} })),
    ]);
    const overrides = overridesData?.items || {};
    return menuData.map((category) => ({
      id: category.id,
      name: category.name,
      items: Array.isArray(category.items)
        ? category.items.map((item) => {
            const override = overrides[item.id] || null;
            const basePrice = Number(item.price);
            const effectivePrice = override?.price || basePrice || 0;
            return {
              id: item.id,
              name: item.name,
              description: item.description || '',
              basePrice: Number.isFinite(basePrice) ? basePrice : 0,
              currentPrice: Number.isFinite(effectivePrice) ? effectivePrice : 0,
              overridePrice: override?.price || null,
              overrideImage: override?.image || null,
            };
          })
        : [],
    }));
  }

  function createMenuItemCard(item) {
    const card = document.createElement('article');
    card.className = 'menu-item-card';

    const title = document.createElement('div');
    title.className = 'menu-item-card__title';
    const heading = document.createElement('h3');
    heading.textContent = item.name;
    const priceBadge = document.createElement('span');
    priceBadge.textContent = `Live price: ${formatCurrency(item.currentPrice)}`;
    title.appendChild(heading);
    title.appendChild(priceBadge);

    const preview = document.createElement('div');
    preview.className = 'menu-item-preview';
    if (item.overrideImage) {
      const img = document.createElement('img');
      img.src = item.overrideImage;
      img.alt = `${item.name} custom image`;
      preview.appendChild(img);
    }
    const previewMeta = document.createElement('div');
    previewMeta.className = 'menu-item-preview__meta';
    previewMeta.innerHTML = [
      `<strong>Base price:</strong> ${formatCurrency(item.basePrice)}`,
      item.overridePrice ? `<strong>Override price:</strong> ${formatCurrency(item.overridePrice)}` : '<em>No price override</em>',
      item.overrideImage ? '<strong>Photo:</strong> Custom image in use' : '<em>Using automatic imagery</em>',
    ].join('<br>');
    preview.appendChild(previewMeta);

    const form = document.createElement('form');
    form.className = 'menu-item-form';
    form.dataset.itemId = item.id;
    form.dataset.basePrice = item.basePrice;
    form.dataset.overridePrice = item.overridePrice ?? '';
    form.dataset.overrideImage = item.overrideImage || '';

    const priceLabel = document.createElement('label');
    priceLabel.textContent = 'Price override';
    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.min = '0';
    priceInput.step = '0.05';
    priceInput.placeholder = 'Leave blank to use base price';
    priceInput.value = item.overridePrice ?? '';
    priceInput.className = 'menu-item-price';
    priceLabel.appendChild(priceInput);

    const fileLabel = document.createElement('label');
    fileLabel.textContent = 'Upload photo';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'menu-item-photo';
    fileLabel.appendChild(fileInput);

    const removeWrapper = document.createElement('label');
    removeWrapper.className = 'menu-item-remove-wrapper';
    const removeInput = document.createElement('input');
    removeInput.type = 'checkbox';
    removeInput.className = 'menu-item-remove-photo';
    if (!item.overrideImage) {
      removeInput.disabled = true;
    }
    removeWrapper.appendChild(removeInput);
    removeWrapper.appendChild(document.createTextNode(' Remove custom photo'));

    const actions = document.createElement('div');
    actions.className = 'menu-item-actions';
    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.className = 'admin-button';
    saveButton.textContent = 'Save changes';
    const resetButton = document.createElement('button');
    resetButton.type = 'button';
    resetButton.className = 'admin-button admin-button--secondary';
    resetButton.textContent = 'Reset';
    const formStatus = document.createElement('span');
    formStatus.className = 'menu-item-status';
    formStatus.setAttribute('aria-live', 'polite');

    actions.appendChild(saveButton);
    actions.appendChild(resetButton);
    actions.appendChild(formStatus);

    form.appendChild(priceLabel);
    form.appendChild(fileLabel);
    form.appendChild(removeWrapper);
    form.appendChild(actions);

    form.addEventListener('submit', (event) => handleMenuFormSubmit(event, form, formStatus, { priceBadge, previewMeta, preview, removeInput }));
    resetButton.addEventListener('click', () => resetMenuForm(form, formStatus, { priceInput, fileInput, removeInput }));
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length && removeInput.disabled) {
        removeInput.disabled = false;
      }
    });

    card.appendChild(title);
    card.appendChild(preview);
    if (item.description) {
      const description = document.createElement('p');
      description.textContent = item.description;
      description.className = 'menu-item-description';
      card.appendChild(description);
    }
    card.appendChild(form);

    return card;
  }

  function resetMenuForm(form, statusElement, refs) {
    const overridePrice = form.dataset.overridePrice || '';
    refs.priceInput.value = overridePrice;
    refs.fileInput.value = '';
    if (form.dataset.overrideImage) {
      refs.removeInput.disabled = false;
      refs.removeInput.checked = false;
    } else {
      refs.removeInput.disabled = true;
      refs.removeInput.checked = false;
    }
    setStatus(statusElement, 'Changes reset');
  }

  function updatePreviewDisplay(cardElements, item) {
    cardElements.priceBadge.textContent = `Live price: ${formatCurrency(item.currentPrice)}`;
    cardElements.previewMeta.innerHTML = [
      `<strong>Base price:</strong> ${formatCurrency(item.basePrice)}`,
      item.overridePrice ? `<strong>Override price:</strong> ${formatCurrency(item.overridePrice)}` : '<em>No price override</em>',
      item.overrideImage ? '<strong>Photo:</strong> Custom image in use' : '<em>Using automatic imagery</em>',
    ].join('<br>');

    const preview = cardElements.preview;
    const existingImage = preview.querySelector('img');
    if (existingImage) {
      existingImage.remove();
    }
    if (item.overrideImage) {
      const img = document.createElement('img');
      img.src = item.overrideImage;
      img.alt = `${item.name} custom image`;
      preview.insertBefore(img, preview.firstChild);
    }
  }

  async function convertFileToBase64(file) {
    if (!file) {
      return null;
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve({ data: base64, type: file.type || 'image/jpeg' });
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async function handleMenuFormSubmit(event, form, statusElement, cardElements) {
    event.preventDefault();
    const itemId = form.dataset.itemId;
    if (!itemId) {
      return;
    }
    const priceInput = form.querySelector('.menu-item-price');
    const fileInput = form.querySelector('.menu-item-photo');
    const removeInput = form.querySelector('.menu-item-remove-photo');
    const saveButton = form.querySelector('button[type="submit"]');

    const payload = {};
    const priceValue = priceInput.value.trim();
    if (priceValue) {
      payload.price = priceValue;
    } else {
      payload.price = '';
    }
    if (removeInput && removeInput.checked) {
      payload.removeImage = true;
    }

    if (fileInput.files && fileInput.files.length) {
      try {
        const imagePayload = await convertFileToBase64(fileInput.files[0]);
        if (imagePayload) {
          payload.imageData = imagePayload.data;
          payload.imageType = imagePayload.type;
        }
      } catch (error) {
        setStatus(statusElement, error.message, 'error');
        return;
      }
    }

    saveButton.disabled = true;
    setStatus(statusElement, 'Saving…');

    try {
      const response = await fetchJson(`/api/admin/menu/items/${encodeURIComponent(itemId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const override = response?.override || null;
      form.dataset.overridePrice = override?.price ?? '';
      form.dataset.overrideImage = override?.image || '';
      if (removeInput) {
        removeInput.checked = false;
        removeInput.disabled = !override?.image;
      }
      priceInput.value = override?.price ?? '';
      fileInput.value = '';

      const updatedItem = {
        name: cardElements.priceBadge.closest('.menu-item-card').querySelector('h3').textContent,
        basePrice: Number(form.dataset.basePrice) || 0,
        overridePrice: override?.price || null,
        currentPrice: override?.price || Number(form.dataset.basePrice) || 0,
        overrideImage: override?.image || '',
      };
      updatePreviewDisplay(cardElements, updatedItem);
      setStatus(statusElement, 'Saved', 'success');
      setStatus(menuStatus, `Updated ${updatedItem.name}`, 'success');
    } catch (error) {
      setStatus(statusElement, error.message || 'Failed to save item', 'error');
      setStatus(menuStatus, error.message || 'Failed to save item', 'error');
    } finally {
      saveButton.disabled = false;
    }
  }

  function renderMenuManagement(categories) {
    menuContainer.innerHTML = '';
    categories.forEach((category, index) => {
      const details = document.createElement('details');
      details.className = 'menu-category';
      details.open = index === 0;

      const summary = document.createElement('summary');
      summary.textContent = `${category.name} (${category.items.length})`;
      details.appendChild(summary);

      const itemsWrapper = document.createElement('div');
      itemsWrapper.className = 'menu-category__items';
      category.items.forEach((item) => {
        const card = createMenuItemCard(item);
        itemsWrapper.appendChild(card);
      });

      details.appendChild(itemsWrapper);
      menuContainer.appendChild(details);
    });
  }

  function initializeMenu() {
    setStatus(menuStatus, 'Loading menu…');
    loadMenuData()
      .then((categories) => {
        renderMenuManagement(categories);
        setStatus(menuStatus, `Loaded ${categories.length} categories`, 'success');
      })
      .catch((error) => {
        setStatus(menuStatus, error.message || 'Failed to load menu', 'error');
      });
  }

  const defaultStoreRecords = [
    {
      id: 'southwest',
      label: 'Southwest',
      address: '5750 BALTIMORE AVE, PHILADELPHIA PA 19143',
      shortAddress: '5750 BALTIMORE AVE',
      phone: '215-471-9020',
      latitude: 39.94346,
      longitude: -75.23863,
    },
    {
      id: 'olney',
      label: 'One & Olney Plaza',
      address: '5675 N Front St Unit 280, PHILADELPHIA, PA, 19120',
      shortAddress: '5675 N FRONT',
      phone: '215-276-8885',
      latitude: 40.039947,
      longitude: -75.122995,
    },
    {
      id: 'hunting-park',
      label: 'Hunting Park',
      address: '4322 North Broad Street, Philadelphia, PA 19140',
      shortAddress: '4322 NORTH BROAD STREET',
      phone: '267-331-6699',
      latitude: 40.016985,
      longitude: -75.145408,
    },
  ];

  function normalizeStoreRecords(stores) {
    if (!Array.isArray(stores)) {
      return [];
    }
    return stores.map((store) => ({
      id: store.id,
      label: store.label || store.shortAddress || 'Store',
      address: store.address || store.shortAddress || '',
      phone: store.phone || '',
      latitude: Number(store.latitude),
      longitude: Number(store.longitude),
    }));
  }

  async function fetchStoreData() {
    const storeSources = [
      { url: '/api/admin/stores', label: 'api' },
      { url: '/api/menu/stores', label: 'api' },
      { url: 'data/stores.json', label: 'local' },
    ];

    for (const source of storeSources) {
      try {
        const data = await fetchJson(source.url, { cache: 'no-store' });
        const stores = normalizeStoreRecords(data?.stores);
        if (stores.length) {
          return { stores, source: source.label };
        }
      } catch (error) {
        // Try the next source.
      }
    }

    return { stores: normalizeStoreRecords(defaultStoreRecords), source: 'fallback' };
  }

  function renderStoreList(stores) {
    if (!storeList) {
      return;
    }
    storeList.innerHTML = '';
    stores.forEach((store) => {
      const card = document.createElement('div');
      card.className = 'store-admin-item';
      const heading = document.createElement('h4');
      heading.textContent = store.label;
      const address = document.createElement('p');
      address.textContent = store.address;
      const phone = document.createElement('p');
      phone.textContent = store.phone ? `Phone: ${store.phone}` : 'Phone: —';
      const coords = document.createElement('p');
      coords.className = 'coordinates';
      coords.dataset.storeId = store.id;
      const latText = Number.isFinite(store.latitude) ? store.latitude.toFixed(6) : '—';
      const lngText = Number.isFinite(store.longitude) ? store.longitude.toFixed(6) : '—';
      coords.textContent = `Lat: ${latText} · Lng: ${lngText}`;
      card.appendChild(heading);
      card.appendChild(address);
      card.appendChild(phone);
      card.appendChild(coords);
      storeList.appendChild(card);
    });
  }

  function renderCustomerLocations(stores) {
    if (!customerMapElement || !window.L) {
      return;
    }
    if (!customerMap) {
      customerMap = window.L.map(customerMapElement, {
        zoomControl: false,
        attributionControl: false,
      });
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(customerMap);
    }
    customerMarkers.splice(0, customerMarkers.length).forEach((marker) => marker.remove());
    const bounds = window.L.latLngBounds([]);
    stores.forEach((store) => {
      if (!Number.isFinite(store.latitude) || !Number.isFinite(store.longitude)) {
        return;
      }
      const marker = window.L.circleMarker([store.latitude, store.longitude], {
        radius: 7,
        color: '#ff8100',
        fillColor: '#ff8100',
        fillOpacity: 0.75,
        weight: 2,
      });
      marker.bindTooltip(store.label || 'Location', { direction: 'top' });
      marker.addTo(customerMap);
      customerMarkers.push(marker);
      bounds.extend([store.latitude, store.longitude]);
    });
    if (bounds.isValid()) {
      customerMap.fitBounds(bounds.pad(0.4));
    } else {
      customerMap.setView([39.9526, -75.1652], 12);
    }
    setTimeout(() => customerMap.invalidateSize(), ANIMATION_DURATION);
  }

  function updateStoreCoordinatesDisplay(storeId, lat, lng) {
    const coords = storeList?.querySelector(`.coordinates[data-store-id="${storeId}"]`);
    if (coords) {
      const latText = Number.isFinite(lat) ? lat.toFixed(6) : '—';
      const lngText = Number.isFinite(lng) ? lng.toFixed(6) : '—';
      coords.textContent = `Lat: ${latText} · Lng: ${lngText}`;
    }
  }

  async function updateStoreLocation(storeId, lat, lng) {
    setStatus(storeStatus, `Saving ${storeId}…`);
    try {
      await fetchJson(`/api/admin/stores/${encodeURIComponent(storeId)}/location`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
      updateStoreCoordinatesDisplay(storeId, lat, lng);
      cachedStores = cachedStores.map((store) =>
        store.id === storeId ? { ...store, latitude: lat, longitude: lng } : store
      );
      renderCustomerLocations(cachedStores);
      setStatus(storeStatus, `Updated ${storeId}`, 'success');
    } catch (error) {
      setStatus(storeStatus, error.message || 'Failed to update store', 'error');
    }
  }

  async function initializeStoreMap() {
    if (!document.getElementById('store-map')) {
      return;
    }
    try {
      const { stores, source } = await fetchStoreData();
      if (!stores.length) {
        setStatus(storeStatus, 'No stores configured', 'error');
        return;
      }
      cachedStores = stores;
      renderStoreList(stores);
      renderCustomerLocations(stores);
      if (!leafletMap) {
        leafletMap = L.map('store-map', { zoom: 12, scrollWheelZoom: true, attributionControl: false });
        const streetLayer = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          { maxZoom: 19 }
        );
        streetLayer.addTo(leafletMap);
      }
      storeMarkers.forEach((marker) => marker.remove());
      storeMarkers.clear();
      const bounds = L.latLngBounds([]);
      stores.forEach((store) => {
        if (!Number.isFinite(store.latitude) || !Number.isFinite(store.longitude)) {
          return;
        }
        const marker = L.marker([store.latitude, store.longitude], { draggable: true, title: store.label });
        marker.on('dragend', (event) => {
          const { lat, lng } = event.target.getLatLng();
          updateStoreLocation(store.id, lat, lng);
        });
        marker.addTo(leafletMap);
        storeMarkers.set(store.id, marker);
        bounds.extend([store.latitude, store.longitude]);
      });
      if (bounds.isValid()) {
        leafletMap.fitBounds(bounds.pad(0.25));
      }
      const statusNote =
        source === 'local'
          ? 'Loaded from local data. Connect to the admin API to sync live locations.'
          : source === 'fallback'
          ? 'Loaded from fallback data. Connect to the admin API to sync live locations.'
          : '';
      const message = [`Loaded ${stores.length} stores`, statusNote].filter(Boolean).join(' — ');
      setStatus(storeStatus, message, 'success');
    } catch (error) {
      setStatus(storeStatus, error.message || 'Unable to load stores', 'error');
    }
  }

  function renderProfiles(profiles) {
    profilesList.innerHTML = '';
    profiles.forEach((profile) => {
      const item = document.createElement('li');
      item.tabIndex = 0;
      item.dataset.trackingId = profile.trackingId;
      item.innerHTML = `
        <strong>${profile.trackingId}</strong><br>
        <span>Last seen: ${formatDate(profile.lastSeenAt)}</span><br>
        <span>Events: ${profile.metrics?.totalEvents || 0} · Purchases: ${profile.metrics?.purchases || 0}</span>
      `;
      item.addEventListener('click', () => showProfileDetail(profile.trackingId));
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          showProfileDetail(profile.trackingId);
        }
      });
      profilesList.appendChild(item);
    });
  }

  async function loadProfiles() {
    setStatus(profilesStatus, 'Loading profiles…');
    try {
      const data = await fetchJson('/api/admin/analytics/profiles?limit=50', { cache: 'no-store' })
        .catch((error) => {
          if (error && error.status === 404) {
            return fetchJson('/api/analytics/profiles?limit=50', { cache: 'no-store' });
          }
          throw error;
        });
      const profiles = Array.isArray(data.profiles) ? data.profiles : [];
      renderProfiles(profiles);
      setStatus(profilesStatus, `Loaded ${profiles.length} profiles`, 'success');
    } catch (error) {
      setStatus(profilesStatus, error.message || 'Failed to load profiles', 'error');
    }
  }

  function hideProfileDetail() {
    profileDetail.hidden = true;
    profileDetailContent.innerHTML = '';
    activeProfileId = null;
  }

  async function showProfileDetail(trackingId) {
    if (!trackingId) {
      return;
    }
    activeProfileId = trackingId;
    setStatus(profilesStatus, `Loading profile ${trackingId}…`);
    try {
      const data = await fetchJson(`/api/admin/analytics/profiles/${encodeURIComponent(trackingId)}?limit=80`, {
        cache: 'no-store',
      }).catch((error) => {
        if (error && error.status === 404) {
          return fetchJson(`/api/analytics/profiles/${encodeURIComponent(trackingId)}?limit=80`, {
            cache: 'no-store',
          });
        }
        throw error;
      });
      const { profile, events } = data;
      profileDetailTitle.textContent = `Profile ${profile?.trackingId || trackingId}`;
      const summary = document.createElement('div');
      summary.className = 'profile-summary';
      summary.innerHTML = `
        <p><strong>Theme:</strong> ${profile?.themeName || '—'}</p>
        <p><strong>Created:</strong> ${formatDate(profile?.createdAt)}</p>
        <p><strong>Last seen:</strong> ${formatDate(profile?.lastSeenAt)}</p>
        <p><strong>Cart adds:</strong> ${profile?.metrics?.cartAdds || 0} · <strong>Removals:</strong> ${profile?.metrics?.cartRemovals || 0} · <strong>Purchases:</strong> ${profile?.metrics?.purchases || 0}</p>
      `;
      const storeSelections = Array.isArray(profile?.storeSelections) ? profile.storeSelections : [];
      const selectionsList = document.createElement('ul');
      selectionsList.innerHTML = storeSelections
        .map((selection) => `<li>${selection.storeLabel || selection.storeId || 'Store'} · ${formatDate(selection.selectedAt)}</li>`)
        .join('');
      const eventsPre = document.createElement('pre');
      eventsPre.textContent = JSON.stringify(events || [], null, 2);

      profileDetailContent.innerHTML = '';
      profileDetailContent.appendChild(summary);
      if (storeSelections.length) {
        const heading = document.createElement('h4');
        heading.textContent = 'Recent store selections';
        profileDetailContent.appendChild(heading);
        profileDetailContent.appendChild(selectionsList);
      }
      const eventsHeading = document.createElement('h4');
      eventsHeading.textContent = 'Recent events';
      profileDetailContent.appendChild(eventsHeading);
      profileDetailContent.appendChild(eventsPre);
      profileDetail.hidden = false;
      setStatus(profilesStatus, `Loaded profile ${trackingId}`, 'success');
    } catch (error) {
      setStatus(profilesStatus, error.message || 'Failed to load profile', 'error');
    }
  }

  async function loadOrders() {
    setStatus(ordersStatus, 'Loading orders…');
    try {
      const data = await fetchJson('/api/admin/orders?limit=50', { cache: 'no-store' });
      const orders = Array.isArray(data.orders) ? data.orders : [];
      ordersTableBody.innerHTML = '';
      orders.forEach((order) => {
        const row = document.createElement('tr');
        const createdCell = document.createElement('td');
        createdCell.textContent = formatDate(order.createdAt);
        const fulfilmentCell = document.createElement('td');
        fulfilmentCell.textContent = order.fulfilment || (order.isDelivery ? 'delivery' : 'pickup');
        const totalCell = document.createElement('td');
        totalCell.textContent = formatCurrency(order.grandTotal ? Number(order.grandTotal) : (order.totalCents || 0) / 100);
        const itemsCell = document.createElement('td');
        const items = Array.isArray(order.items)
          ? order.items.map((item) => `${item.quantity || 0}× ${item.name || 'Item'}`).join(', ')
          : '—';
        itemsCell.textContent = items || '—';
        row.appendChild(createdCell);
        row.appendChild(fulfilmentCell);
        row.appendChild(totalCell);
        row.appendChild(itemsCell);
        ordersTableBody.appendChild(row);
      });
      setStatus(ordersStatus, `Loaded ${orders.length} orders`, 'success');
    } catch (error) {
      setStatus(ordersStatus, error.message || 'Failed to load orders', 'error');
    }
  }

  const rewardsSettings = {
    budgetPercent: 3.5,
    revenueBaseline: 50000,
    odds: {
      instant: '1:5',
      common: '1:25',
      rare: '1:200',
      legendary: '1:1000',
    },
  };

  const rewardsAutomation = {
    dynamicProbability: true,
    expiringPieces: true,
    flashEvents: true,
    skillChallenges: true,
    winSharing: true,
    rewardPoints: true,
  };

  let rewardsSummaryData = null;
  let rewardsEventsData = {
    flashEvents: [],
    expiringPieces: [],
    streakBoosts: [],
    marketingMoments: [],
  };
  let rewardsWinnersData = [];

  const rewardsBudgetRange = document.getElementById('rewardsBudgetRange');
  const rewardsBudgetValue = document.getElementById('rewardsBudgetValue');
  const rewardsBudgetDollars = document.getElementById('rewardsBudgetDollars');
  const saveRewardsBudgetButton = document.getElementById('saveRewardsBudget');
  const resetRewardsBudgetButton = document.getElementById('resetRewardsBudget');
  const rewardsBudgetStatus = document.getElementById('rewardsBudgetStatus');

  const rewardsOddsSummary = document.getElementById('rewardsOddsSummary');
  const saveRewardsOddsButton = document.getElementById('saveRewardsOdds');
  const rewardsOddsStatus = document.getElementById('rewardsOddsStatus');
  const instantWinOddsSelect = document.getElementById('instantWinOdds');
  const collectionCommonSelect = document.getElementById('collectionCommonOdds');
  const collectionRareSelect = document.getElementById('collectionRareOdds');
  const collectionLegendarySelect = document.getElementById('collectionLegendaryOdds');

  const rewardsAutomationSummary = document.getElementById('rewardsAutomationSummary');
  const rewardsAutomationBulletin = document.getElementById('rewardsAutomationBulletin');
  const rewardsAutomationStatus = document.getElementById('rewardsAutomationStatus');
  const saveRewardsAutomationButton = document.getElementById('saveRewardsAutomation');
  const rewardsDynamicProbabilityToggle = document.getElementById('rewardsDynamicProbability');
  const rewardsExpiringPiecesToggle = document.getElementById('rewardsExpiringPieces');
  const rewardsFlashEventsToggle = document.getElementById('rewardsFlashEvents');
  const rewardsSkillChallengesToggle = document.getElementById('rewardsSkillChallenges');
  const rewardsWinSharingToggle = document.getElementById('rewardsWinSharing');
  const rewardsRewardPointsToggle = document.getElementById('rewardsRewardPoints');

  const rewardsSummaryMetrics = document.getElementById('rewardsSummaryMetrics');
  const rewardsSummaryUpdatedAt = document.getElementById('rewardsSummaryUpdatedAt');
  const rewardsSummaryStatus = document.getElementById('rewardsSummaryStatus');
  const rewardsWinnersList = document.getElementById('rewardsWinnersList');
  const rewardsWinnersStatus = document.getElementById('rewardsWinnersStatus');
  const rewardsEventsList = document.getElementById('rewardsEventsList');
  const rewardsEventsStatus = document.getElementById('rewardsEventsStatus');

  function formatRewardPercent(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return '0.00%';
    }
    return `${numeric.toFixed(2)}%`;
  }

  function formatEventWindow(start, end) {
    const startText = formatDate(start);
    const endText = formatDate(end);
    if (startText !== '—' && endText !== '—') {
      return `${startText} → ${endText}`;
    }
    if (startText !== '—') {
      return startText;
    }
    if (endText !== '—') {
      return endText;
    }
    return '—';
  }

  function syncRewardsOddsInputs() {
    const mapping = [
      { element: instantWinOddsSelect, key: 'instant' },
      { element: collectionCommonSelect, key: 'common' },
      { element: collectionRareSelect, key: 'rare' },
      { element: collectionLegendarySelect, key: 'legendary' },
    ];
    mapping.forEach(({ element, key }) => {
      if (!element) {
        return;
      }
      if (rewardsSettings.odds && rewardsSettings.odds[key]) {
        element.value = rewardsSettings.odds[key];
      }
    });
  }

  function syncAutomationToggles() {
    const toggles = [
      { element: rewardsDynamicProbabilityToggle, key: 'dynamicProbability' },
      { element: rewardsExpiringPiecesToggle, key: 'expiringPieces' },
      { element: rewardsFlashEventsToggle, key: 'flashEvents' },
      { element: rewardsSkillChallengesToggle, key: 'skillChallenges' },
      { element: rewardsWinSharingToggle, key: 'winSharing' },
      { element: rewardsRewardPointsToggle, key: 'rewardPoints' },
    ];
    toggles.forEach(({ element, key }) => {
      if (element) {
        element.checked = !!rewardsAutomation[key];
      }
    });
  }

  function renderRewardsSummary() {
    if (!rewardsSummaryMetrics) {
      return;
    }
    const hasMetrics =
      rewardsSummaryData &&
      ['players', 'activeStreaks', 'instantWins', 'completedSets', 'totalPoints'].some((key) =>
        Number.isFinite(Number(rewardsSummaryData?.[key])),
      );

    if (!hasMetrics) {
      rewardsSummaryMetrics.innerHTML = '<p class="muted">No summary available yet.</p>';
      if (rewardsSummaryUpdatedAt) {
        rewardsSummaryUpdatedAt.textContent = '';
      }
      return;
    }
    const stats = [
      { label: 'Players', value: formatNumber(Number(rewardsSummaryData.players) || 0) },
      { label: 'Active streaks', value: formatNumber(Number(rewardsSummaryData.activeStreaks) || 0) },
      { label: 'Instant wins', value: formatNumber(Number(rewardsSummaryData.instantWins) || 0) },
      { label: 'Completed sets', value: formatNumber(Number(rewardsSummaryData.completedSets) || 0) },
      { label: 'Active collections', value: formatNumber(Number(rewardsSummaryData.activeCollections) || 0) },
      { label: 'Pieces collected', value: formatNumber(Number(rewardsSummaryData.collectionPieces) || 0) },
      { label: 'Total points', value: formatNumber(Number(rewardsSummaryData.totalPoints) || 0) },
      { label: 'Prize pool', value: formatCurrency(Number(rewardsSummaryData.prizeBudget?.pool) || 0) },
    ];
    rewardsSummaryMetrics.innerHTML = stats
      .map(
        (stat) => `
          <div class="rewards-summary__stat">
            <span class="rewards-summary__value">${stat.value}</span>
            <span class="rewards-summary__label">${stat.label}</span>
          </div>
        `,
      )
      .join('');
    if (rewardsSummaryUpdatedAt) {
      const budgetPercent = rewardsSummaryData.prizeBudget?.percent ?? rewardsSettings.budgetPercent;
      const budgetBaseline = rewardsSummaryData.prizeBudget?.baseline ?? rewardsSettings.revenueBaseline;
      const piecesText = `Prize allocation ${formatRewardPercent(budgetPercent)} of ${formatCurrency(
        Number(budgetBaseline) || 0,
      )} baseline.`;
      const updatedText = rewardsSummaryData.updatedAt && rewardsSummaryData.updatedAt !== '—'
        ? `Summary refreshed ${formatDate(rewardsSummaryData.updatedAt)}.`
        : '';
      rewardsSummaryUpdatedAt.textContent = `${updatedText} ${piecesText}`.trim();
    }
  }

  function renderRewardsWinners() {
    if (!rewardsWinnersList) {
      return;
    }
    if (!rewardsWinnersData || !rewardsWinnersData.length) {
      rewardsWinnersList.innerHTML = '<li class="muted">No winners announced yet.</li>';
      return;
    }
    rewardsWinnersList.innerHTML = rewardsWinnersData.slice(0, 10)
      .map((winner) => {
        const announcedAt = formatDate(winner?.announcedAt);
        const location = winner?.location ? `<span>${winner.location}</span>` : '';
        const variant = winner?.variant ? `<span>${winner.variant}</span>` : '';
        const userId = winner?.userId ? `<span>#${winner.userId}</span>` : '';
        const note = winner?.shareCard
          ? `<p class="rewards-winner__note">${winner.shareCard}</p>`
          : '';
        return `
          <li class="rewards-winner">
            <strong>${winner?.prize || 'Reward winner'}</strong>
            <div class="rewards-winner__meta">
              ${variant}
              <span>${announcedAt}</span>
              ${location}
              ${userId}
            </div>
            ${note}
          </li>
        `;
      })
      .join('');
  }

  function renderRewardEvents() {
    if (!rewardsEventsList) {
      return;
    }
    const groups = [
      {
        key: 'flashEvents',
        label: 'Flash events',
        empty: 'No flash events scheduled.',
        format: (event) => {
          const multiplier = Number(event?.multiplier);
          const multiplierText = Number.isFinite(multiplier) && multiplier > 1 ? ` · ${multiplier}× odds` : '';
          const set = event?.setId ? ` · ${event.setId}` : '';
          return `
            <li class="rewards-event">
              <span class="rewards-event__title">${event?.title || 'Flash event'}</span>
              <span class="rewards-event__meta">${formatEventWindow(event?.startsAt, event?.endsAt)}${multiplierText}${set}</span>
              ${event?.description ? `<span class="rewards-event__note">${event.description}</span>` : ''}
            </li>
          `;
        },
      },
      {
        key: 'expiringPieces',
        label: 'Expiring pieces',
        empty: 'No pieces expiring this week.',
        format: (event) => {
          const label = event?.label || 'Collection piece';
          const set = event?.setId ? ` · ${event.setId}` : '';
          return `
            <li class="rewards-event">
              <span class="rewards-event__title">${label}</span>
              <span class="rewards-event__meta">Expires ${formatDate(event?.expiresAt)}${set}</span>
              ${event?.reminder ? `<span class="rewards-event__note">${event.reminder}</span>` : ''}
            </li>
          `;
        },
      },
      {
        key: 'streakBoosts',
        label: 'Streak boosts',
        empty: 'No streak boosts active.',
        format: (event) => {
          const minDays = Number(event?.minimumDays);
          const requirement = Number.isFinite(minDays) && minDays > 0 ? `${minDays}-day streak` : 'Streak bonus';
          return `
            <li class="rewards-event">
              <span class="rewards-event__title">${requirement}</span>
              <span class="rewards-event__meta">${event?.reward || 'Bonus reward'}</span>
              ${event?.description ? `<span class="rewards-event__note">${event.description}</span>` : ''}
            </li>
          `;
        },
      },
      {
        key: 'marketingMoments',
        label: 'Marketing moments',
        empty: 'No marketing pushes scheduled.',
        format: (event) => `
          <li class="rewards-event">
            <span class="rewards-event__title">${event?.headline || 'Marketing moment'}</span>
            ${event?.callToAction ? `<span class="rewards-event__note">${event.callToAction}</span>` : ''}
          </li>
        `,
      },
    ];

    rewardsEventsList.innerHTML = groups
      .map((group) => {
        const items = Array.isArray(rewardsEventsData?.[group.key]) ? rewardsEventsData[group.key] : [];
        if (!items.length) {
          return `
            <div class="rewards-event-group">
              <h3>${group.label}</h3>
              <p class="muted">${group.empty}</p>
            </div>
          `;
        }
        const list = items
          .slice(0, 3)
          .map((item) => group.format(item))
          .join('');
        return `
          <div class="rewards-event-group">
            <h3>${group.label}</h3>
            <ul class="rewards-event-list">${list}</ul>
          </div>
        `;
      })
      .join('');
  }

  function buildAutomationPayload() {
    return {
      dynamicProbability: Boolean(rewardsAutomation.dynamicProbability),
      expiringPieces: Boolean(rewardsAutomation.expiringPieces),
      flashEvents: Boolean(rewardsAutomation.flashEvents),
      skillChallenges: Boolean(rewardsAutomation.skillChallenges),
      winSharing: Boolean(rewardsAutomation.winSharing),
      rewardPoints: Boolean(rewardsAutomation.rewardPoints),
    };
  }

  function updateBudgetSummary() {
    const percent = Number(rewardsSettings.budgetPercent) || 0;
    if (rewardsBudgetRange) {
      rewardsBudgetRange.value = percent;
    }
    if (rewardsBudgetValue) {
      rewardsBudgetValue.textContent = formatRewardPercent(percent);
    }
    if (rewardsBudgetDollars) {
      const baseline = Number(rewardsSettings.revenueBaseline) || 0;
      const pool = (baseline * percent) / 100;
      rewardsBudgetDollars.textContent = formatCurrency(pool);
    }
  }

  if (rewardsBudgetRange) {
    rewardsBudgetRange.addEventListener('input', () => {
      rewardsSettings.budgetPercent = Number(rewardsBudgetRange.value);
      updateBudgetSummary();
      setStatus(rewardsBudgetStatus, '');
    });
    updateBudgetSummary();
  }

  if (saveRewardsBudgetButton) {
    saveRewardsBudgetButton.addEventListener('click', async () => {
      updateBudgetSummary();
      setStatus(rewardsBudgetStatus, 'Saving budget…');
      try {
        const payload = {
          budgetPercent: Number(rewardsSettings.budgetPercent),
          updatedBy: 'admin-dashboard',
        };
        const response = await fetchJson('/api/rewards/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const updated = response?.settings;
        if (!updated) {
          throw new Error('Rewards service returned an unexpected response.');
        }
        rewardsSettings.budgetPercent = Number(updated.budgetPercent ?? rewardsSettings.budgetPercent);
        rewardsSettings.revenueBaseline = Number(updated.revenueBaseline ?? rewardsSettings.revenueBaseline);
        rewardsSettings.odds = { ...rewardsSettings.odds, ...(updated.odds || {}) };
        updateBudgetSummary();
        syncRewardsOddsInputs();
        updateOddsSummary();
        if (!Number.isNaN(Number(updated.budgetPool))) {
          rewardsSummaryData = rewardsSummaryData || {};
          rewardsSummaryData.prizeBudget = {
            percent: rewardsSettings.budgetPercent,
            baseline: rewardsSettings.revenueBaseline,
            pool: Number(updated.budgetPool),
          };
          renderRewardsSummary();
        }
        const message = `Budget locked at ${formatRewardPercent(rewardsSettings.budgetPercent)} of promo revenue.`;
        setStatus(rewardsBudgetStatus, message, 'success');
      } catch (error) {
        setStatus(rewardsBudgetStatus, error.message || 'Failed to save budget.', 'error');
      }
    });
  }

  if (resetRewardsBudgetButton) {
    resetRewardsBudgetButton.addEventListener('click', () => {
      rewardsSettings.budgetPercent = 3.5;
      updateBudgetSummary();
      setStatus(rewardsBudgetStatus, 'Reset to recommended 3.5% allocation.', 'success');
    });
  }

  function updateOddsSummary() {
    if (!rewardsOddsSummary) {
      return;
    }
    const summary = [
      `<strong>Instant wins:</strong> ${rewardsSettings.odds.instant || '1:5'}`,
      `<strong>Common sets:</strong> ${rewardsSettings.odds.common || '1:25'}`,
      `<strong>Rare sets:</strong> ${rewardsSettings.odds.rare || '1:200'}`,
      `<strong>Legendary:</strong> ${rewardsSettings.odds.legendary || '1:1000'}`,
    ];
    rewardsOddsSummary.innerHTML = `${summary.map((line) => `<p>${line}</p>`).join('')}<p class="muted">Odds auto-adjust for loyalty tiers and safeguard the monthly budget.</p>`;
  }

  const rewardsOddsInputs = [
    { element: instantWinOddsSelect, key: 'instant' },
    { element: collectionCommonSelect, key: 'common' },
    { element: collectionRareSelect, key: 'rare' },
    { element: collectionLegendarySelect, key: 'legendary' },
  ];

  rewardsOddsInputs.forEach(({ element, key }) => {
    if (!element) {
      return;
    }
    element.addEventListener('change', () => {
      rewardsSettings.odds[key] = element.value;
      updateOddsSummary();
      setStatus(rewardsOddsStatus, '');
    });
  });

  syncRewardsOddsInputs();
  if (saveRewardsOddsButton) {
    saveRewardsOddsButton.addEventListener('click', async () => {
      updateOddsSummary();
      setStatus(rewardsOddsStatus, 'Updating drop rates…');
      try {
        const payload = {
          odds: { ...rewardsSettings.odds },
          updatedBy: 'admin-dashboard',
        };
        const response = await fetchJson('/api/rewards/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const updated = response?.settings;
        if (!updated || !updated.odds) {
          throw new Error('Rewards service did not return updated odds.');
        }
        rewardsSettings.odds = { ...rewardsSettings.odds, ...updated.odds };
        syncRewardsOddsInputs();
        updateOddsSummary();
        setStatus(rewardsOddsStatus, 'Drop rates updated. Changes go live within 5 minutes.', 'success');
      } catch (error) {
        setStatus(rewardsOddsStatus, error.message || 'Failed to update drop rates.', 'error');
      }
    });
  }

  updateOddsSummary();

  function updateAutomationSummary() {
    if (!rewardsAutomationSummary) {
      return;
    }
    const activePrograms = [
      rewardsAutomation.dynamicProbability && 'Dynamic probability',
      rewardsAutomation.expiringPieces && 'Expiring pieces',
      rewardsAutomation.flashEvents && 'Flash mini-events',
      rewardsAutomation.skillChallenges && 'Skill challenges',
      rewardsAutomation.winSharing && 'Win-sharing cards',
      rewardsAutomation.rewardPoints && 'Reward points crossover',
    ].filter(Boolean);

    if (!activePrograms.length) {
      rewardsAutomationSummary.textContent = 'No automations active. Players see baseline odds only.';
      return;
    }

    rewardsAutomationSummary.textContent = `Active programs: ${activePrograms.join(' · ')}`;
  }

  function updateAutomationBulletin() {
    if (!rewardsAutomationBulletin) {
      return;
    }
    const bulletLines = [];
    if (rewardsAutomation.flashEvents) {
      const upcoming = Array.isArray(rewardsEventsData?.flashEvents) ? rewardsEventsData.flashEvents[0] : null;
      if (upcoming) {
        bulletLines.push(
          `Flash event: ${upcoming.title || 'Flash event'} · ${formatEventWindow(upcoming.startsAt, upcoming.endsAt)}.`,
        );
      } else {
        bulletLines.push('Flash events enabled — schedule the next boost to drive urgency.');
      }
    } else {
      bulletLines.push('Flash events paused.');
    }

    if (rewardsAutomation.expiringPieces) {
      const expiring = Array.isArray(rewardsEventsData?.expiringPieces) ? rewardsEventsData.expiringPieces[0] : null;
      if (expiring) {
        bulletLines.push(
          `Expiry alert: ${expiring.label || 'Collection piece'} expires ${formatDate(expiring.expiresAt)}.`,
        );
      } else {
        bulletLines.push('Expiring pieces enabled — no expirations queued.');
      }
    } else {
      bulletLines.push('Expiry nudges paused.');
    }

    if (rewardsAutomation.dynamicProbability) {
      bulletLines.push('Dynamic probability live for streak tiers.');
    } else {
      bulletLines.push('Dynamic probability paused — baseline odds only.');
    }

    if (rewardsAutomation.skillChallenges) {
      bulletLines.push("Skill challenges enabled — rotate tonight’s prompt for +XP.");
    } else {
      bulletLines.push('Skill challenges paused.');
    }

    if (rewardsAutomation.winSharing) {
      const topWinner = rewardsWinnersData?.[0];
      if (topWinner?.shareCard) {
        bulletLines.push(`Latest share card: “${topWinner.shareCard}”.`);
      } else {
        bulletLines.push('Win-sharing enabled — publish the latest winner highlight.');
      }
    } else {
      bulletLines.push('Win-sharing cards disabled.');
    }

    if (rewardsAutomation.rewardPoints) {
      bulletLines.push('Rewards wallet sync active — instant wins post automatically.');
    } else {
      bulletLines.push('Rewards wallet sync paused.');
    }

    const lines = bulletLines.filter(Boolean).slice(0, 6);
    if (!lines.length) {
      rewardsAutomationBulletin.innerHTML = '<p class="muted">No automated pushes scheduled.</p>';
      return;
    }

    rewardsAutomationBulletin.innerHTML = `<ul>${lines.map((line) => `<li>${line}</li>`).join('')}</ul>`;
  }

  async function loadRewardsOverview() {
    if (rewardsBudgetStatus) {
      setStatus(rewardsBudgetStatus, 'Loading settings…');
    }
    if (rewardsOddsStatus) {
      setStatus(rewardsOddsStatus, 'Loading drop rates…');
    }
    if (rewardsAutomationStatus) {
      setStatus(rewardsAutomationStatus, 'Loading automations…');
    }
    if (rewardsSummaryStatus) {
      setStatus(rewardsSummaryStatus, 'Loading summary…');
    }
    if (rewardsWinnersStatus) {
      setStatus(rewardsWinnersStatus, 'Loading winners…');
    }
    if (rewardsEventsStatus) {
      setStatus(rewardsEventsStatus, 'Loading events…');
    }

    try {
      const [settingsResult, winnersResult, eventsResult] = await Promise.allSettled([
        fetchJson('/api/rewards/settings', { cache: 'no-store' }),
        fetchJson('/api/rewards/winners', { cache: 'no-store' }),
        fetchJson('/api/rewards/events', { cache: 'no-store' }),
      ]);

      if (settingsResult.status === 'fulfilled') {
        const payload = settingsResult.value || {};
        const settings = payload.settings || null;
        const automation = payload.automation || null;
        const summary = payload.summary || null;

        if (settings) {
          rewardsSettings.budgetPercent = Number(settings.budgetPercent ?? rewardsSettings.budgetPercent);
          rewardsSettings.revenueBaseline = Number(settings.revenueBaseline ?? rewardsSettings.revenueBaseline);
          rewardsSettings.odds = { ...rewardsSettings.odds, ...(settings.odds || {}) };
          updateBudgetSummary();
          syncRewardsOddsInputs();
          updateOddsSummary();
          const budgetMessage = settings.updatedAt
            ? `Synced ${formatDate(settings.updatedAt)} by ${settings.updatedBy || 'system'}.`
            : 'Loaded reward settings.';
          setStatus(rewardsBudgetStatus, budgetMessage, 'success');
          setStatus(rewardsOddsStatus, 'Drop rates synced from Rewards service.', 'success');
        } else {
          setStatus(rewardsBudgetStatus, 'No reward settings available.', 'error');
          setStatus(rewardsOddsStatus, 'No drop rates available.', 'error');
        }

        if (automation) {
          Object.assign(rewardsAutomation, automation);
          syncAutomationToggles();
          updateAutomationSummary();
          updateAutomationBulletin();
          const automationMessage = automation.updatedAt
            ? `Synced ${formatDate(automation.updatedAt)} by ${automation.updatedBy || 'system'}.`
            : 'Automation defaults loaded.';
          setStatus(rewardsAutomationStatus, automationMessage, 'success');
        } else {
          setStatus(rewardsAutomationStatus, 'No automation configuration available.', 'error');
        }

        if (summary) {
          const baseline = Number(summary.prizeBudget?.baseline ?? rewardsSettings.revenueBaseline);
          const percent = Number(summary.prizeBudget?.percent ?? rewardsSettings.budgetPercent);
          const pool = Number(summary.prizeBudget?.pool ?? (baseline * percent) / 100);
          rewardsSummaryData = {
            ...summary,
            prizeBudget: {
              baseline,
              percent,
              pool,
            },
          };
          renderRewardsSummary();
          const summaryMessage = summary.updatedAt
            ? `Summary refreshed ${formatDate(summary.updatedAt)}.`
            : 'Summary loaded.';
          setStatus(rewardsSummaryStatus, summaryMessage, 'success');
          if (!rewardsWinnersData.length && Array.isArray(summary.latestWinners)) {
            rewardsWinnersData = summary.latestWinners;
            renderRewardsWinners();
          }
        } else {
          setStatus(rewardsSummaryStatus, 'No summary data returned.', 'error');
        }
      } else {
        const message = settingsResult.reason?.message || 'Unable to load reward settings.';
        setStatus(rewardsBudgetStatus, message, 'error');
        setStatus(rewardsOddsStatus, message, 'error');
        setStatus(rewardsAutomationStatus, message, 'error');
        setStatus(rewardsSummaryStatus, message, 'error');
      }

      if (winnersResult.status === 'fulfilled') {
        const winners = Array.isArray(winnersResult.value?.winners) ? winnersResult.value.winners : [];
        rewardsWinnersData = winners;
        renderRewardsWinners();
        if (winners.length) {
          setStatus(rewardsWinnersStatus, `Loaded ${winners.length} winners.`, 'success');
        } else {
          setStatus(rewardsWinnersStatus, 'No winners recorded yet.', '');
        }
        updateAutomationBulletin();
      } else {
        if (!rewardsWinnersData.length && rewardsSummaryData?.latestWinners?.length) {
          rewardsWinnersData = rewardsSummaryData.latestWinners;
          renderRewardsWinners();
          updateAutomationBulletin();
        }
        const message = winnersResult.reason?.message || 'Unable to load winners.';
        setStatus(rewardsWinnersStatus, message, 'error');
      }

      if (eventsResult.status === 'fulfilled') {
        const eventsPayload = eventsResult.value?.events || {};
        rewardsEventsData = {
          flashEvents: Array.isArray(eventsPayload.flashEvents) ? eventsPayload.flashEvents : [],
          expiringPieces: Array.isArray(eventsPayload.expiringPieces) ? eventsPayload.expiringPieces : [],
          streakBoosts: Array.isArray(eventsPayload.streakBoosts) ? eventsPayload.streakBoosts : [],
          marketingMoments: Array.isArray(eventsPayload.marketingMoments) ? eventsPayload.marketingMoments : [],
        };
        renderRewardEvents();
        updateAutomationBulletin();
        const totalEvents =
          rewardsEventsData.flashEvents.length +
          rewardsEventsData.expiringPieces.length +
          rewardsEventsData.streakBoosts.length +
          rewardsEventsData.marketingMoments.length;
        const eventsMessage = totalEvents
          ? `Loaded ${totalEvents} active event${totalEvents === 1 ? '' : 's'}.`
          : 'No active reward events.';
        setStatus(rewardsEventsStatus, eventsMessage, totalEvents ? 'success' : '');
      } else {
        const message = eventsResult.reason?.message || 'Unable to load reward events.';
        setStatus(rewardsEventsStatus, message, 'error');
      }
    } catch (error) {
      const message = error.message || 'Unable to load rewards data.';
      setStatus(rewardsBudgetStatus, message, 'error');
      setStatus(rewardsOddsStatus, message, 'error');
      setStatus(rewardsAutomationStatus, message, 'error');
      setStatus(rewardsSummaryStatus, message, 'error');
      setStatus(rewardsWinnersStatus, message, 'error');
      setStatus(rewardsEventsStatus, message, 'error');
    }
  }

  const automationToggles = [
    { element: rewardsDynamicProbabilityToggle, key: 'dynamicProbability' },
    { element: rewardsExpiringPiecesToggle, key: 'expiringPieces' },
    { element: rewardsFlashEventsToggle, key: 'flashEvents' },
    { element: rewardsSkillChallengesToggle, key: 'skillChallenges' },
    { element: rewardsWinSharingToggle, key: 'winSharing' },
    { element: rewardsRewardPointsToggle, key: 'rewardPoints' },
  ];

  automationToggles.forEach(({ element, key }) => {
    if (!element) {
      return;
    }
    element.addEventListener('change', () => {
      rewardsAutomation[key] = element.checked;
      updateAutomationSummary();
      updateAutomationBulletin();
      setStatus(rewardsAutomationStatus, '');
    });
  });

  syncAutomationToggles();
  if (saveRewardsAutomationButton) {
    saveRewardsAutomationButton.addEventListener('click', async () => {
      setStatus(rewardsAutomationStatus, 'Saving automations…');
      try {
        const payload = {
          ...buildAutomationPayload(),
          updatedBy: 'admin-dashboard',
        };
        const response = await fetchJson('/api/rewards/automation', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const updated = response?.automation;
        if (!updated) {
          throw new Error('Rewards service did not return updated automation settings.');
        }
        Object.assign(rewardsAutomation, updated);
        syncAutomationToggles();
        updateAutomationSummary();
        updateAutomationBulletin();
        const activeCount = Object.values(buildAutomationPayload()).filter(Boolean).length;
        const message = activeCount
          ? `Saved. ${activeCount} engagement program${activeCount === 1 ? '' : 's'} are now scheduled.`
          : 'Saved. All automations paused.';
        setStatus(rewardsAutomationStatus, message, 'success');
      } catch (error) {
        setStatus(rewardsAutomationStatus, error.message || 'Failed to save automations.', 'error');
      }
    });
  }

  updateAutomationSummary();
  updateAutomationBulletin();

  if (closeProfileDetailButton) {
    closeProfileDetailButton.addEventListener('click', hideProfileDetail);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !profileDetail.hidden) {
      hideProfileDetail();
    }
  });

  activateTab(document.querySelector('[data-orders-tab].is-active')?.dataset.ordersTab || 'active');
  activateRunTab(document.querySelector('[data-run-tab].is-active')?.dataset.runTab || 'marketplace');
  initHomeChart();
  handleHashNavigation();

  initializeMenu();
  initializeStoreMap();
  loadRewardsOverview();
  loadProfiles();
  loadOrders();
})();
