import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import useStore from '../store/useStore';

export default function MapView() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const currentProject = useStore((state) => state.currentProject);
  const places = useStore((state) => state.places);

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

    // Click handler for adding pins
    map.current.on('click', (e) => {
      const selectedAnnotationId = useStore.getState().selectedAnnotationId;
      if (!selectedAnnotationId) return;

      const name = prompt('Place name for this pin?');
      if (!name) return;

      // TODO: Save pin to Supabase and link to annotation
      console.log('Add pin:', { lng: e.lngLat.lng, lat: e.lngLat.lat, name });
    });

    return () => {
      map.current?.remove();
    };
  }, [currentProject]);

  // Update markers when places change
  useEffect(() => {
    if (!map.current) return;

    // TODO: Add/update markers for places
    // For now, just log
    console.log('Places updated:', places);
  }, [places]);

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
}
