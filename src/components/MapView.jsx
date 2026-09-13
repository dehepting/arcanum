import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import useStore from '../store/useStore';
import { createPlace, loadPlaces } from '../lib/places';

export default function MapView() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);

  const currentProject = useStore((state) => state.currentProject);
  const places = useStore((state) => state.places);
  const setPlaces = useStore((state) => state.setPlaces);
  const addPlace = useStore((state) => state.addPlace);
  const pinPlacementMode = useStore((state) => state.pinPlacementMode);
  const pendingPinAnnotationId = useStore((state) => state.pendingPinAnnotationId);
  const cancelPinPlacement = useStore((state) => state.cancelPinPlacement);

  useEffect(() => {
    if (map.current) return; // Initialize only once

    const centerLng = currentProject?.map_center_lng || -20;
    const centerLat = currentProject?.map_center_lat || 36;
    const zoom = currentProject?.map_zoom || 3.4;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: [centerLng, centerLat],
      zoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapReady(true);
    });

    // Click handler for adding pins
    map.current.on('click', async (e) => {
      const state = useStore.getState();

      // Check if in pin placement mode
      if (!state.pinPlacementMode || !state.pendingPinAnnotationId) return;

      const name = prompt('Name for this location?', 'Untitled Location');
      if (name === null) {
        state.cancelPinPlacement();
        return;
      }

      try {
        const place = await createPlace(
          {
            project_id: currentProject.id,
            name: name || 'Untitled Location',
            lng: e.lngLat.lng,
            lat: e.lngLat.lat,
            note: '',
          },
          state.pendingPinAnnotationId
        );

        state.addPlace(place);
        state.cancelPinPlacement();

        // Fly to the new pin
        map.current.flyTo({ center: [e.lngLat.lng, e.lngLat.lat], zoom: 8 });
      } catch (err) {
        console.error('Failed to create place:', err);
        alert(`Failed to create pin: ${err.message}`);
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [currentProject]);

  // Load places when project changes
  useEffect(() => {
    if (!currentProject?.id) return;

    const fetchPlaces = async () => {
      try {
        const loadedPlaces = await loadPlaces(currentProject.id);
        setPlaces(loadedPlaces);
      } catch (err) {
        console.error('Failed to load places:', err);
      }
    };

    fetchPlaces();
  }, [currentProject, setPlaces]);

  // Update markers when places change
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for all places
    places.forEach((place) => {
      const el = document.createElement('div');
      el.style.cssText = `
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #e8b86d;
        border: 2px solid #0e0f12;
        box-shadow: 0 0 0 1px #c45c4a;
        cursor: pointer;
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([place.lng, place.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 12 }).setHTML(
            `<strong>${place.name}</strong>${place.note ? `<div style="margin-top:4px;color:#8b8f99">${place.note}</div>` : ''}`
          )
        )
        .addTo(map.current);

      // Click marker to navigate to linked annotation
      el.addEventListener('click', async () => {
        // TODO: Navigate to annotation
        console.log('Navigate to annotation for place:', place.id);
      });

      markersRef.current.push(marker);
    });
  }, [places, mapReady]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Pin placement mode banner */}
      {pinPlacementMode && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: 'var(--accent)',
          color: '#fff',
          padding: '10px 16px',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}>
          <span>📍 Click on the map to place a pin</span>
          <button
            onClick={cancelPinPlacement}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
