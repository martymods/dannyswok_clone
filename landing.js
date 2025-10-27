(async function () {
  const hoverSound = typeof Audio === 'function' ? new Audio('audio/scroll_hover_over_sound.mp3') : null;
  const storeSelectSound = typeof Audio === 'function' ? new Audio('audio/ui_map_nav.mp3') : null;
  const analyticsApi = window.DannysAnalytics || null;

  const DEFAULT_STORES = [
    {
      id: 'southwest',
      label: 'Southwest',
      address: "5750 BALTIMORE AVE, PHILADELPHIA PA 19143",
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

  function normalizeStoreRecord(store) {
    const id = String(store.id || store.label || '').trim().toLowerCase();
    return {
      id: id || 'store',
      label: store.label || store.shortAddress || store.address || 'Store',
      address: store.address || store.shortAddress || store.label || '',
      shortAddress: store.shortAddress || store.address || store.label || '',
      phone: store.phone || '',
      latitude: Number(store.latitude),
      longitude: Number(store.longitude),
    };
  }

  async function loadStoreData() {
    try {
      const response = await fetch('/api/menu/stores', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.stores) && data.stores.length) {
          return data.stores.map((store) => normalizeStoreRecord(store));
        }
      }
    } catch (error) {
      // Ignore fetch errors and fall back to default store data.
    }
    return DEFAULT_STORES.map((store) => normalizeStoreRecord(store));
  }

  function renderStoreCards(stores, container) {
    if (!container) {
      return [];
    }
    container.innerHTML = '';
    const records = stores.map((store) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'store-card';
      button.setAttribute('role', 'listitem');
      button.dataset.id = store.id;
      button.dataset.label = store.label;
      button.dataset.lat = String(store.latitude);
      button.dataset.lng = String(store.longitude);

      const heading = document.createElement('h2');
      heading.textContent = store.address;

      const tag = document.createElement('p');
      tag.className = 'store-card__tag';
      tag.textContent = `(${store.label})`;

      const phone = document.createElement('p');
      phone.className = 'store-card__phone';
      phone.innerHTML = 'Phone: <span></span>';
      const phoneSpan = phone.querySelector('span');
      if (phoneSpan) {
        phoneSpan.textContent = store.phone || '—';
      }

      const cta = document.createElement('span');
      cta.className = 'store-card__cta';
      cta.textContent = 'Enter »»';

      button.appendChild(heading);
      button.appendChild(tag);
      button.appendChild(phone);
      button.appendChild(cta);

      container.appendChild(button);

      return { ...store, button };
    });
    return records;
  }

  if (analyticsApi) {
    analyticsApi.sendEvent('page_view', { page: 'landing' }, { keepalive: true });
  }

  if (hoverSound) {
    hoverSound.preload = 'auto';
  }

  if (storeSelectSound) {
    storeSelectSound.preload = 'auto';
  }

  function playSoundEffect(audioElement) {
    if (!audioElement) {
      return;
    }

    try {
      audioElement.currentTime = 0;
      const playPromise = audioElement.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    } catch (error) {
      // Ignore playback errors (e.g. browser autoplay policies).
    }
  }

  function handleButtonHover(event) {
    const button = event.target.closest('button');
    if (!button || !document.contains(button)) {
      return;
    }

    if (event.relatedTarget && button.contains(event.relatedTarget)) {
      return;
    }

    playSoundEffect(hoverSound);
  }

  document.addEventListener('mouseover', handleButtonHover);

  const pageBody = document.body;
  if (pageBody) {
    pageBody.classList.remove('is-map-ready');
  }

  const easternTimeZone = 'America/New_York';
  const minutesPerHour = 60;
  const storeStatusUpdateInterval = 60 * 1000;

  const storeHoursByDay = {
    0: { open: 11 * minutesPerHour + 30, close: 22 * minutesPerHour + 30 },
    1: { open: 11 * minutesPerHour, close: 22 * minutesPerHour + 30 },
    2: { open: 11 * minutesPerHour, close: 22 * minutesPerHour + 30 },
    3: { open: 11 * minutesPerHour, close: 22 * minutesPerHour + 30 },
    4: { open: 11 * minutesPerHour, close: 22 * minutesPerHour + 30 },
    5: { open: 11 * minutesPerHour, close: 23 * minutesPerHour + 30 },
    6: { open: 11 * minutesPerHour, close: 23 * minutesPerHour + 30 },
  };

  function getEasternNow() {
    const localeString = new Date().toLocaleString('en-US', { timeZone: easternTimeZone });
    return new Date(localeString);
  }

  function calculateStoreStatus() {
    const now = getEasternNow();
    const day = now.getDay();
    const currentMinutes = now.getHours() * minutesPerHour + now.getMinutes();
    const hours = storeHoursByDay[day];

    if (!hours) {
      return {
        isOpen: false,
        text: 'Closed · Order ahead for pickup',
        state: 'closed',
      };
    }

    const isOpen = currentMinutes >= hours.open && currentMinutes < hours.close;

    return {
      isOpen,
      text: isOpen ? 'Open' : 'Closed · Order ahead for pickup',
      state: isOpen ? 'open' : 'closed',
    };
  }

  function applyStatusToElement(element) {
    if (!element) {
      return;
    }

    const status = calculateStoreStatus();
    element.textContent = status.text;
    element.setAttribute('data-status', status.state);

    element.classList.toggle('store-photo-card__status--open', status.isOpen);
    element.classList.toggle('store-photo-card__status--closed', !status.isOpen);
  }

  const mapElement = document.getElementById('store-map');
  if (!mapElement) {
    if (pageBody) {
      pageBody.classList.add('is-map-ready');
    }
    return;
  }

  const loadingScreen = document.getElementById('loading-screen');
  const mapWrapper = document.querySelector('.store-map-wrapper');
  if (!loadingScreen && pageBody) {
    pageBody.classList.add('is-map-ready');
  }
  const storeListElement = document.getElementById('store-list');
  const enterMenuLink = document.getElementById('enter-menu-link');
  const stores = await loadStoreData();
  const storeRecords = renderStoreCards(stores, storeListElement);
  const storeButtons = storeRecords.map((record) => record.button);
  const storeData = storeRecords
    .map((record) => ({
      id: record.id,
      label: record.label,
      lat: record.latitude,
      lng: record.longitude,
      button: record.button,
      address: record.address,
      phone: record.phone,
    }))
    .filter((record) => Number.isFinite(record.lat) && Number.isFinite(record.lng));
  const storePhotoData = {
    southwest: {
      src: 'images/baltimore_store.png',
      alt: "Street view of Danny's Wok Southwest location.",
    },
    olney: {
      src: 'images/front_store.png',
      alt: "Front view of Danny's Wok at One & Olney Plaza.",
    },
    'hunting-park': {
      src: 'images/broad_store.png',
      alt: "Street view of Danny's Wok on North Broad Street.",
    },
  };
  const storeLocations = storeData.map(({ lat, lng }) => [lat, lng]);

  if (mapElement) {
    mapElement.addEventListener('click', handlePhotoCardInteraction);
    mapElement.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        handlePhotoCardInteraction(event);
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closePhotoOverlay();
    }
  });

  const map = L.map(mapElement, {
    zoom: 12,
    zoomControl: true,
    scrollWheelZoom: true,
    attributionControl: false,
  });

  const streetLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 19,
      zIndex: 1,
    }
  );

  streetLayer.addTo(map);

  const imageryLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 19,
      opacity: 0.7,
      zIndex: 2,
    }
  );

  imageryLayer.addTo(map);

  if (storeLocations.length) {
    const bounds = L.latLngBounds(storeLocations);
    map.fitBounds(bounds, { padding: [48, 48] });
  } else {
    map.setView([39.988, -75.162], 12);
  }

  let baseLayerLoaded = false;
  let minimumDelayMet = false;
  let loadingHidden = false;

  function hideLoadingScreen() {
    if (loadingHidden || !loadingScreen) {
      if (pageBody) {
        pageBody.classList.add('is-map-ready');
      }
      return;
    }
    loadingHidden = true;
    loadingScreen.classList.add('is-hidden');
    if (pageBody) {
      pageBody.classList.add('is-map-ready');
    }
    setTimeout(() => {
      loadingScreen.remove();
      map.invalidateSize();
    }, 400);
  }

  function tryHideLoadingScreen() {
    if (baseLayerLoaded && minimumDelayMet) {
      hideLoadingScreen();
    }
  }

  streetLayer.on('load', () => {
    baseLayerLoaded = true;
    tryHideLoadingScreen();
  });

  imageryLayer.on('load', () => {
    map.invalidateSize();
  });

  setTimeout(() => {
    minimumDelayMet = true;
    tryHideLoadingScreen();
  }, 2000);

  // Fallback: ensure the loading screen disappears even if tiles are slow.
  setTimeout(() => {
    if (!loadingHidden) {
      hideLoadingScreen();
    }
  }, 6000);

  const markerIcon = L.divIcon({
    html: `
      <div class="store-marker">
        <div class="store-marker__pulse"></div>
        <div class="store-marker__pulse store-marker__pulse--delay"></div>
        <div class="store-marker__badge">
          <img src="images/logos6.png" alt="Danny's Wok logo pin">
        </div>
      </div>
    `,
    className: 'store-marker-wrapper',
    iconSize: [96, 96],
    iconAnchor: [48, 78],
    popupAnchor: [0, -48],
  });

  const markersById = new Map();
  let activeMarkerId = null;
  let photoMarker = null;
  let selectedButton = null;
  let photoOverlayState = null;
  let lastPhotoTrigger = null;
  let pendingPhotoPlacementTimer = null;
  let storeStatusIntervalId = null;
  const markerRepositionClass = 'is-repositioned';

  function updateMarkerSelection(storeId, options = {}) {
    const { focusMarker = false } = options;

    if (activeMarkerId && markersById.has(activeMarkerId)) {
      const previousMarker = markersById.get(activeMarkerId);
      const previousElement = previousMarker && previousMarker.getElement();
      if (previousElement) {
        previousElement.classList.remove('is-active');
        previousElement.classList.remove(markerRepositionClass);
        previousElement.setAttribute('aria-pressed', 'false');
      }
    }

    activeMarkerId = storeId;

    const nextMarker = markersById.get(storeId);
    if (nextMarker) {
      const nextElement = nextMarker.getElement();
      if (nextElement) {
        nextElement.classList.add('is-active');
        nextElement.classList.add(markerRepositionClass);
        nextElement.setAttribute('aria-pressed', 'true');

        if (focusMarker) {
          nextElement.focus({ preventScroll: true });
        }
      }
    }
  }

  function updateMenuLink(label, id) {
    if (!enterMenuLink) {
      return;
    }

    const nextHref = `menu.html?store=${encodeURIComponent(id)}`;
    enterMenuLink.href = nextHref;
    enterMenuLink.textContent = `Enter the ${label} location >>`;
    enterMenuLink.classList.remove('is-disabled');
    enterMenuLink.setAttribute('aria-disabled', 'false');
    enterMenuLink.removeAttribute('tabindex');
  }

  function ensurePhotoOverlayElements() {
    if (!mapWrapper) {
      return null;
    }

    if (photoOverlayState) {
      return photoOverlayState;
    }

    const overlay = document.createElement('div');
    overlay.className = 'store-photo-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'true');

    overlay.innerHTML = `
      <div class="store-photo-overlay__backdrop" data-overlay-dismiss="true"></div>
      <div class="store-photo-overlay__content">
        <img class="store-photo-overlay__image" alt="" />
        <div class="store-photo-overlay__controls">
          <button type="button" class="store-photo-overlay__close" aria-label="Close photo view">
            <span aria-hidden="true">&times;</span>
          </button>
          <a class="store-photo-overlay__cta" href="menu.html">
            Enter the location &raquo;&raquo;
          </a>
        </div>
      </div>
    `;

    mapWrapper.appendChild(overlay);

    const image = overlay.querySelector('.store-photo-overlay__image');
    const closeButton = overlay.querySelector('.store-photo-overlay__close');
    const ctaLink = overlay.querySelector('.store-photo-overlay__cta');

    const state = {
      element: overlay,
      image,
      closeButton,
      ctaLink,
    };

    function handleOverlayClick(event) {
      const dismissTrigger = event.target.closest('[data-overlay-dismiss]');
      const isOutsideContent = !event.target.closest('.store-photo-overlay__content');
      if (dismissTrigger || isOutsideContent) {
        closePhotoOverlay();
      }
    }

    overlay.addEventListener('click', handleOverlayClick);

    if (closeButton) {
      closeButton.addEventListener('click', (event) => {
        event.preventDefault();
        closePhotoOverlay();
      });
    }

    photoOverlayState = state;
    return state;
  }

  function closePhotoOverlay() {
    if (!photoOverlayState) {
      return;
    }

    const { element } = photoOverlayState;
    if (element) {
      element.classList.remove('is-visible');
      element.setAttribute('aria-hidden', 'true');
    }

    if (lastPhotoTrigger && document.body.contains(lastPhotoTrigger)) {
      lastPhotoTrigger.focus({ preventScroll: true });
    }

    lastPhotoTrigger = null;
  }

  function openPhotoOverlay(storeId, label, info) {
    const overlayElements = ensurePhotoOverlayElements();
    if (!overlayElements || !info) {
      return;
    }

    const { element, image, ctaLink, closeButton } = overlayElements;

    if (image) {
      image.src = info.src;
      image.alt = info.alt;
    }

    if (ctaLink) {
      ctaLink.textContent = `Enter the ${label} location >>`;
      ctaLink.href = `menu.html?store=${encodeURIComponent(storeId)}`;
      ctaLink.setAttribute('aria-label', `Enter the ${label} location`);
    }

    if (element) {
      element.classList.add('is-visible');
      element.setAttribute('aria-hidden', 'false');
      element.setAttribute(
        'aria-label',
        `${label} Danny's Wok location street view photo`
      );
    }

    if (closeButton) {
      closeButton.focus({ preventScroll: true });
    }
  }

  function handlePhotoCardInteraction(event) {
    const card = event.target.closest('.store-photo-card');
    if (!card) {
      return;
    }

    const storeId = card.dataset.storeId;
    const storeLabel = card.dataset.storeLabel;
    if (!storeId || !storeLabel) {
      return;
    }

    const info = storePhotoData[storeId];
    if (!info) {
      return;
    }

    event.preventDefault();
    lastPhotoTrigger = card;
    openPhotoOverlay(storeId, storeLabel, info);
  }

  function clearPendingPhotoPlacement() {
    if (pendingPhotoPlacementTimer) {
      clearTimeout(pendingPhotoPlacementTimer);
      pendingPhotoPlacementTimer = null;
    }
  }

  function calculatePhotoMarkerLatLng(baseLatLng, zoomLevel = map.getZoom()) {
    const mapSize = map.getSize();
    const horizontalOffset = Math.min(176, Math.max(108, Math.round(mapSize.x * 0.22)));
    const verticalOffset = Math.min(140, Math.max(76, Math.round(mapSize.y * 0.22)));
    const projectedPoint = map.project(baseLatLng, zoomLevel);
    const offsetPoint = projectedPoint.add(L.point(-horizontalOffset, -verticalOffset));

    return map.unproject(offsetPoint, zoomLevel);
  }

  function calculateFocusedViewCenter(baseLatLng, zoomLevel) {
    const targetLatLng = L.latLng(baseLatLng);
    const mapSize = map.getSize();
    const mapWidth = mapSize.x;
    const mapHeight = mapSize.y;
    const markerAnchorX = 112;
    const markerAnchorY = 120;
    let minMarkerX = Math.max(markerAnchorX + 24, 24);
    let maxMarkerX = mapWidth - 16;
    if (maxMarkerX < minMarkerX) {
      minMarkerX = maxMarkerX;
    }
    const baselineMarkerX = Math.round(mapWidth * 0.6);
    const desiredMarkerX = Math.min(
      Math.max(baselineMarkerX, minMarkerX),
      maxMarkerX
    );
    let minMarkerY = Math.max(markerAnchorY + 20, 40);
    let maxMarkerY = mapHeight - 64;
    if (maxMarkerY < minMarkerY) {
      minMarkerY = maxMarkerY;
    }
    const baselineMarkerY = Math.round(mapHeight * 0.52);
    const desiredMarkerY = Math.min(
      Math.max(baselineMarkerY, minMarkerY),
      maxMarkerY
    );
    const targetPoint = map.project(targetLatLng, zoomLevel);
    const centerPoint = L.point(
      targetPoint.x + mapWidth / 2 - desiredMarkerX,
      targetPoint.y + mapHeight / 2 - desiredMarkerY
    );

    return map.unproject(centerPoint, zoomLevel);
  }

  function addPhotoMarker(target, id, label) {
    const info = storePhotoData[id];
    if (!info) {
      return;
    }

    const displayLatLng = calculatePhotoMarkerLatLng(target);

    const photoIcon = L.divIcon({
      html: `
        <button
          type="button"
          class="store-photo-card"
          data-store-id="${id}"
          data-store-label="${label}"
          aria-label="View a photo of the ${label} Danny's Wok location"
        >
          <span class="store-photo-card__preview" aria-hidden="true">
            <img src="${info.src}" alt="">
          </span>
          <span class="store-photo-card__hint" aria-hidden="true">Enter</span>
          <span class="store-photo-card__status" aria-live="polite"></span>
        </button>
      `,
      className: 'store-photo-card-wrapper',
      iconSize: [132, 148],
      iconAnchor: [112, 120],
      popupAnchor: [0, -96],
    });

    photoMarker = L.marker(displayLatLng, {
      icon: photoIcon,
      interactive: true,
      keyboard: false,
      riseOnHover: true,
      zIndexOffset: 350,
    }).addTo(map);

    const refreshStoreStatus = () => {
      if (!photoMarker) {
        return;
      }

      const markerElement = photoMarker.getElement();
      if (!markerElement) {
        return;
      }

      const statusElement = markerElement.querySelector('.store-photo-card__status');
      applyStatusToElement(statusElement);
    };

    if (storeStatusIntervalId) {
      clearInterval(storeStatusIntervalId);
      storeStatusIntervalId = null;
    }

    requestAnimationFrame(() => {
      refreshStoreStatus();
      storeStatusIntervalId = window.setInterval(refreshStoreStatus, storeStatusUpdateInterval);
    });
  }

  function selectStore(button, options = {}) {
    const { focusMarker = false, source = 'list' } = options;
    const lat = Number(button.dataset.lat);
    const lng = Number(button.dataset.lng);
    const label = button.dataset.label || 'selected';
    const id = button.dataset.id || label.toLowerCase();

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    if (selectedButton) {
      selectedButton.classList.remove('is-selected');
    }

    selectedButton = button;
    selectedButton.classList.add('is-selected');

    playSoundEffect(storeSelectSound);

    const target = L.latLng(lat, lng);
    const focusZoomLevel = 16.1;
    const focusedCenter = calculateFocusedViewCenter(target, focusZoomLevel);

    map.flyTo(focusedCenter, focusZoomLevel, {
      duration: 1.2,
      easeLinearity: 0.25,
    });

    const placePhotoMarker = () => {
      clearPendingPhotoPlacement();
      addPhotoMarker(target, id, label);
    };

    clearPendingPhotoPlacement();
    pendingPhotoPlacementTimer = setTimeout(placePhotoMarker, 2200);

    map.once('moveend', placePhotoMarker);

    if (photoMarker) {
      if (storeStatusIntervalId) {
        clearInterval(storeStatusIntervalId);
        storeStatusIntervalId = null;
      }

      photoMarker.remove();
      photoMarker = null;
    }

    closePhotoOverlay();

    updateMarkerSelection(id, { focusMarker });

    updateMenuLink(label, id);

    if (analyticsApi) {
      analyticsApi.ensureProfile({ storeId: id, storeLabel: label, storeLat: lat, storeLng: lng });
      analyticsApi.sendEvent(
        'store_selected',
        {
          storeId: id,
          storeLabel: label,
          latitude: lat,
          longitude: lng,
          source,
        },
        { ensureProfile: true }
      );
    }
  }

  storeData.forEach((store) => {
    const marker = L.marker([store.lat, store.lng], {
      icon: markerIcon,
      interactive: true,
      keyboard: true,
      title: store.label,
      riseOnHover: true,
      zIndexOffset: 420,
    }).addTo(map);

    markersById.set(store.id, marker);

    marker.on('click', () => {
      selectStore(store.button, { focusMarker: true, source: 'map' });
    });

    marker.on('add', () => {
      const element = marker.getElement();
      if (!element) {
        return;
      }

      element.setAttribute('tabindex', '0');
      element.setAttribute('role', 'button');
      element.setAttribute(
        'aria-label',
        `${store.label} Danny's Wok location`
      );
      element.setAttribute('aria-pressed', 'false');
      element.dataset.storeMarkerId = store.id;

      if (!element.dataset.storeMarkerInteractive) {
        element.dataset.storeMarkerInteractive = 'true';

        element.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectStore(store.button, { focusMarker: true });
          }
        });
      }
    });
  });

  storeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      selectStore(button, { source: 'list' });
    });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectStore(button, { source: 'keyboard' });
      }
    });
  });

  if (enterMenuLink && analyticsApi) {
    enterMenuLink.addEventListener('click', () => {
      const url = new URL(enterMenuLink.href, window.location.origin);
      analyticsApi.sendEvent(
        'menu_cta_clicked',
        { href: url.pathname + url.search },
        { keepalive: true }
      );
    });
  }

  window.addEventListener('resize', () => {
    map.invalidateSize();
  });
})();
