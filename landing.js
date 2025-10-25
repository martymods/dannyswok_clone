(function () {
  const mapElement = document.getElementById('store-map');
  if (!mapElement) {
    return;
  }

  const loadingScreen = document.getElementById('loading-screen');
  const storeButtons = Array.from(document.querySelectorAll('.store-card'));
  const enterMenuLink = document.getElementById('enter-menu-link');
  const storeLocations = storeButtons
    .map((button) => {
      const lat = Number(button.dataset.lat);
      const lng = Number(button.dataset.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return null;
      }
      return [lat, lng];
    })
    .filter(Boolean);

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
      return;
    }
    loadingHidden = true;
    loadingScreen.classList.add('is-hidden');
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

  let activeMarker = null;
  let selectedButton = null;

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

  function selectStore(button) {
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

    const target = [lat, lng];

    map.flyTo(target, 17, {
      duration: 1.2,
    });

    if (activeMarker) {
      activeMarker.remove();
    }

    activeMarker = L.marker(target, {
      icon: markerIcon,
      interactive: false,
      keyboard: false,
      riseOnHover: false,
    }).addTo(map);

    updateMenuLink(label, id);
  }

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
