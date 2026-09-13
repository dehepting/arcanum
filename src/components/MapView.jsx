import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import useStore from '../store/useStore';
import { createPlace, loadPlaces, getAnnotationsForPlace } from '../lib/places';
import { loadOverlays } from '../lib/overlays';
import OverlayGeoreference from './OverlayGeoreference';

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
  const setMapView = useStore((state) => state.setMapView);
  const setActiveSource = useStore((state) => state.setActiveSource);
  const setCurrentPage = useStore((state) => state.setCurrentPage);
  const sources = useStore((state) => state.sources);
  const mapOverlays = useStore((state) => state.mapOverlays);
  const setMapOverlays = useStore((state) => state.setMapOverlays);
  const overlayMode = useStore((state) => state.overlayMode);
  const openOverlayMode = useStore((state) => state.openOverlayMode);

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

    // Click handler for adding pins and georeferencing overlays
    map.current.on('click', async (e) => {
      const state = useStore.getState();

      // Check if in overlay georeferencing mode
      if (state.overlayMode && state.onOverlayMapClick) {
        state.onOverlayMapClick(e.lngLat);
        return;
      }

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

  // Load places and overlays when project changes
  useEffect(() => {
    if (!currentProject?.id) return;

    const fetchData = async () => {
      try {
        const [loadedPlaces, loadedOverlays] = await Promise.all([
          loadPlaces(currentProject.id),
          loadOverlays(currentProject.id),
        ]);
        setPlaces(loadedPlaces);
        setMapOverlays(loadedOverlays);
      } catch (err) {
        console.error('Failed to load map data:', err);
      }
    };

    fetchData();
  }, [currentProject, setPlaces, setMapOverlays]);

  // Handle flyTo when navigating from annotation
  useEffect(() => {
    const flyToPlace = useStore.getState().flyToPlace;
    if (flyToPlace && map.current && mapReady) {
      map.current.flyTo({
        center: [flyToPlace.lng, flyToPlace.lat],
        zoom: 8,
      });
      // Clear the flyTo state
      useStore.getState().flyToPlace = null;
    }
  }, [mapReady]);

  // Update markers when places change
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
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
      el.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          const annotations = await getAnnotationsForPlace(place.id);
          if (annotations && annotations.length > 0) {
            const annotation = annotations[0]; // Use first linked annotation
            // Find the source
            const source = sources.find((s) => s.id === annotation.source_id);
            if (source) {
              // Switch to PDF view
              setMapView('source');
              setActiveSource(source.id);
              setCurrentPage(annotation.page_number);
            }
          }
        } catch (err) {
          console.error('Failed to navigate to annotation:', err);
        }
      });

      markersRef.current.push(marker);
    });
  }, [places, mapReady]);

  // Render map overlays
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Remove existing overlay sources and layers
    mapOverlays.forEach((overlay) => {
      const layerId = `overlay-${overlay.id}`;
      if (map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
      if (map.current.getSource(layerId)) {
        map.current.removeSource(layerId);
      }
    });

    // Add overlay sources and layers
    mapOverlays
      .filter((overlay) => overlay.visible)
      .forEach((overlay) => {
        const layerId = `overlay-${overlay.id}`;

        // Add image source with corner coordinates
        map.current.addSource(layerId, {
          type: 'image',
          url: overlay.image_url,
          coordinates: [
            [overlay.top_left_lng, overlay.top_left_lat], // top-left
            [overlay.top_right_lng, overlay.top_right_lat], // top-right
            [overlay.bottom_right_lng, overlay.bottom_right_lat], // bottom-right
            [overlay.bottom_left_lng, overlay.bottom_left_lat], // bottom-left
          ],
        });

        // Add raster layer
        map.current.addLayer({
          id: layerId,
          type: 'raster',
          source: layerId,
          paint: {
            'raster-opacity': overlay.opacity || 0.7,
          },
        });
      });
  }, [mapOverlays, mapReady]);

  return (
    <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Pin placement mode banner */}
      {pinPlacementMode && (
        <div
          style={{
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
          }}
        >
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

      {/* Overlay mode banner */}
      {overlayMode && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'var(--accent-2)',
            color: '#0e0f12',
            padding: '10px 16px',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            fontWeight: 500,
          }}
        >
          🗺️ Georeferencing Mode: Click on the map to place corner markers
        </div>
      )}

      {/* Add overlay button */}
      {!pinPlacementMode && !overlayMode && (
        <button
          onClick={openOverlayMode}
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            background: 'var(--accent-2)',
            color: '#0e0f12',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          title="Add historic map overlay"
        >
          <span>🗺️</span>
          <span>Add Map Overlay</span>
        </button>
      )}

      <div ref={mapContainer} style={{ flex: 1, width: '100%' }} />

      {/* Overlay georeferencing UI */}
      <OverlayGeoreference />
    </div>
  );
}
