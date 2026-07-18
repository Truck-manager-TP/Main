(function () {
  const statusEl = document.getElementById('status');
  const loginPanel = document.getElementById('login-panel');
  const routeList = document.getElementById('route-list');
  const relayList = document.getElementById('relay-list');

  let authHeader = null;
  let map;
  let stompClient;
  const truckMarkers = new Map();
  const routeLayers = new Map();
  const relayMarkers = [];

  const truckIcon = L.divIcon({
    className: 'truck-marker',
    html: '🚛',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  const relayIcon = L.divIcon({
    className: 'relay-marker',
    html: '📍',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function authFetch(url) {
    return fetch(url, { headers: { Authorization: authHeader } });
  }

  function initMap() {
    map = L.map('map').setView([33.57, -7.59], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
  }

  function upsertTruck(truck) {
    const key = truck.routeId;
    const latLng = [truck.latitude, truck.longitude];
    if (truckMarkers.has(key)) {
      truckMarkers.get(key).setLatLng(latLng);
    } else {
      const marker = L.marker(latLng, { icon: truckIcon })
        .bindPopup(`<b>Route #${truck.routeId}</b><br>${truck.origin} → ${truck.destination}<br><em>${truck.scope}</em>`)
        .addTo(map);
      truckMarkers.set(key, marker);
    }
    renderRouteListItem(truck);
  }

  function renderRouteListItem(truck) {
    let item = document.querySelector(`#route-list li[data-route-id="${truck.routeId}"]`);
    if (!item) {
      item = document.createElement('li');
      item.dataset.routeId = truck.routeId;
      item.addEventListener('click', () => showTrajectory(truck.routeId));
      routeList.appendChild(item);
    }
    item.textContent = `#${truck.routeId} ${truck.origin} → ${truck.destination} (${truck.scope})`;
  }

  async function showTrajectory(routeId) {
    const res = await authFetch(`/api/v1/map/routes/${routeId}/trajectory`);
    if (!res.ok) return;
    const data = await res.json();
    if (routeLayers.has(routeId)) {
      map.removeLayer(routeLayers.get(routeId));
    }
    const group = L.layerGroup();
    if (data.planned && data.planned.length > 1) {
      L.polyline(data.planned.map(p => [p.latitude, p.longitude]), {
        color: '#94a3b8', dashArray: '6 8', weight: 3
      }).addTo(group);
    }
    if (data.actual && data.actual.length > 1) {
      L.polyline(data.actual.map(p => [p.latitude, p.longitude]), {
        color: '#2563eb', weight: 4
      }).addTo(group);
    }
    group.addTo(map);
    routeLayers.set(routeId, group);
    const truck = truckMarkers.get(routeId);
    if (truck) map.fitBounds(group.getBounds().extend(truck.getLatLng()), { padding: [40, 40] });
  }

  async function loadLiveFleet() {
    const res = await authFetch('/api/v1/map/live');
    if (!res.ok) throw new Error('Failed to load live fleet');
    const trucks = await res.json();
    trucks.forEach(upsertTruck);
    setStatus(`Live — ${trucks.length} truck(s) in transit`);
  }

  async function loadRelayPoints() {
    const res = await authFetch('/api/v1/map/relay-points');
    if (!res.ok) return;
    const points = await res.json();
    points.forEach(p => {
      const marker = L.marker([p.latitude, p.longitude], { icon: relayIcon })
        .bindPopup(`<b>${p.name}</b><br>${p.type}<br>${p.address || ''}`)
        .addTo(map);
      relayMarkers.push(marker);
      const li = document.createElement('li');
      li.textContent = `${p.code} — ${p.name}`;
      li.addEventListener('click', () => map.setView([p.latitude, p.longitude], 10));
      relayList.appendChild(li);
    });
  }

  function connectWebSocket() {
    const socket = new SockJS('/ws/tracking');
    stompClient = Stomp.over(socket);
    stompClient.debug = () => {};
    stompClient.connect(
      { Authorization: authHeader },
      function () {
        stompClient.subscribe('/topic/fleet/live', function (message) {
          const update = JSON.parse(message.body);
          upsertTruck(update);
          setStatus(`Live — last update route #${update.routeId} at ${new Date(update.recordedAt).toLocaleTimeString()}`);
        });
        setStatus('WebSocket connected — receiving live GPS updates');
      },
      function () {
        setStatus('WebSocket disconnected — retrying in 5s');
        setTimeout(connectWebSocket, 5000);
      }
    );
  }

  document.getElementById('login-btn').addEventListener('click', async function () {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    authHeader = 'Basic ' + btoa(user + ':' + pass);
    try {
      const probe = await authFetch('/api/v1/map/live');
      if (probe.status === 401) {
        alert('Invalid admin credentials');
        return;
      }
      loginPanel.classList.add('hidden');
      initMap();
      await loadLiveFleet();
      await loadRelayPoints();
      connectWebSocket();
    } catch (e) {
      alert('Unable to reach map API: ' + e.message);
    }
  });
})();
