(function () {
  const hoverSound = typeof Audio === 'function' ? new Audio('audio/scroll_hover_over_sound.mp3') : null;
  const storeSelectSound = typeof Audio === 'function' ? new Audio('audio/ui_map_nav.mp3') : null;

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
  const storeButtons = Array.from(document.querySelectorAll('.store-card'));
  const enterMenuLink = document.getElementById('enter-menu-link');
  const storeData = storeButtons
    .map((button) => {
      const lat = Number(button.dataset.lat);
      const lng = Number(button.dataset.lng);
      const label = button.dataset.label || button.textContent.trim();
      const id = button.dataset.id || label.toLowerCase();

      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !id) {
        return null;
      }

      return {
        id,
        label,
        lat,
        lng,
        button,
      };
    })
    .filter(Boolean);
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
  }

  function selectStore(button, options = {}) {
    const { focusMarker = false } = options;
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
      photoMarker.remove();
      photoMarker = null;
    }

    closePhotoOverlay();

    updateMarkerSelection(id, { focusMarker });

    updateMenuLink(label, id);
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
      selectStore(store.button, { focusMarker: true });
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
      selectStore(button);
    });
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectStore(button);
      }
    });
  });

  window.addEventListener('resize', () => {
    map.invalidateSize();
  });
})();
