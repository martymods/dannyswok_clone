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

  async function fetchJson(url, options = {}) {
    try {
      const response = await fetch(url, options);
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

  async function fetchStoreData() {
    const data = await fetchJson('/api/admin/stores', { cache: 'no-store' })
      .catch(() => fetchJson('/api/menu/stores', { cache: 'no-store' }))
      .catch(() => ({ stores: [] }));
    return Array.isArray(data.stores)
      ? data.stores.map((store) => ({
          id: store.id,
          label: store.label || store.shortAddress || 'Store',
          address: store.address || store.shortAddress || '',
          phone: store.phone || '',
          latitude: Number(store.latitude),
          longitude: Number(store.longitude),
        }))
      : [];
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
      const stores = await fetchStoreData();
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
      setStatus(storeStatus, `Loaded ${stores.length} stores`, 'success');
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
  loadProfiles();
  loadOrders();
})();
