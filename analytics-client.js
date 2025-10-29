(function (global) {
  const TRACKING_STORAGE_KEY = 'dwkTrackingId';
  const LOCATION_STORAGE_KEY = 'dwkUserLocation';
  const LAST_ORDER_STORAGE_KEY = 'dwkLastOrderSummary';
  const ORDER_HISTORY_STORAGE_KEY = 'dwkOrderHistory';
  const PROFILE_ENDPOINT = '/api/analytics/profile';
  const EVENTS_ENDPOINT = '/api/analytics/events';
  const MAX_EVENT_PAYLOAD_LENGTH = 10000;

  function getStoredJson(key) {
    try {
      const raw = global.localStorage ? global.localStorage.getItem(key) : null;
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function setStoredJson(key, value) {
    try {
      if (!global.localStorage) {
        return;
      }
      if (value === null || value === undefined) {
        global.localStorage.removeItem(key);
      } else {
        global.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      // Ignore storage errors (e.g. Safari private mode)
    }
  }

  function getTrackingId() {
    if (!global.localStorage) {
      return null;
    }
    return global.localStorage.getItem(TRACKING_STORAGE_KEY);
  }

  function setTrackingId(id) {
    try {
      if (!global.localStorage) {
        return;
      }
      if (!id) {
        global.localStorage.removeItem(TRACKING_STORAGE_KEY);
      } else {
        global.localStorage.setItem(TRACKING_STORAGE_KEY, id);
      }
    } catch (error) {
      // Ignore storage errors
    }
  }

  async function ensureProfile(details = {}) {
    const trackingId = getTrackingId();
    const payload = { ...details };
    if (trackingId) {
      payload.trackingId = trackingId;
    }
    let response;
    try {
      response = await fetch(PROFILE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
    } catch (error) {
      return null;
    }
    if (!response.ok) {
      return null;
    }
    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      return null;
    }
    if (!data || typeof data.trackingId !== 'string' || !data.trackingId.trim()) {
      return null;
    }
    setTrackingId(data.trackingId.trim());
    return data;
  }

  function truncatePayload(payload) {
    if (!payload) {
      return payload;
    }
    try {
      const json = JSON.stringify(payload);
      if (json.length <= MAX_EVENT_PAYLOAD_LENGTH) {
        return payload;
      }
      return {
        truncated: true,
        preview: json.slice(0, MAX_EVENT_PAYLOAD_LENGTH),
      };
    } catch (error) {
      return { truncated: true };
    }
  }

  async function sendEvent(type, payload = {}, options = {}) {
    const trackingId = getTrackingId();
    if (!type || typeof type !== 'string') {
      return null;
    }
    if (!trackingId && options.ensureProfile) {
      await ensureProfile(options.profileDetails || {});
    }
    const resolvedTrackingId = getTrackingId();
    if (!resolvedTrackingId) {
      return null;
    }
    const eventPayload = truncatePayload(payload);
    const body = {
      trackingId: resolvedTrackingId,
      events: [
        {
          type,
          payload: eventPayload,
          timestamp: options.timestamp || new Date().toISOString(),
        },
      ],
    };
    try {
      const response = await fetch(EVENTS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
        keepalive: Boolean(options.keepalive),
      });
      if (!response.ok) {
        return null;
      }
      return true;
    } catch (error) {
      return null;
    }
  }

  function getOrderHistory() {
    const stored = getStoredJson(ORDER_HISTORY_STORAGE_KEY);
    return Array.isArray(stored) ? stored : [];
  }

  function setOrderHistory(history) {
    if (!Array.isArray(history)) {
      setStoredJson(ORDER_HISTORY_STORAGE_KEY, []);
      return;
    }
    setStoredJson(ORDER_HISTORY_STORAGE_KEY, history);
  }

  const api = {
    ensureProfile,
    sendEvent,
    getTrackingId,
    setTrackingId,
    getStoredJson,
    setStoredJson,
    getOrderHistory,
    setOrderHistory,
    storageKeys: {
      tracking: TRACKING_STORAGE_KEY,
      location: LOCATION_STORAGE_KEY,
      lastOrder: LAST_ORDER_STORAGE_KEY,
      orderHistory: ORDER_HISTORY_STORAGE_KEY,
    },
  };

  global.DannysAnalytics = api;
})(typeof window !== 'undefined' ? window : globalThis);
