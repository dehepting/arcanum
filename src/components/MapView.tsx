import { useEffect, useRef, useState } from 'react';
import {
  Map,
  NavigationControl,
  Marker,
  Popup,
  setWorkerUrl,
  type MapMouseEvent,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { invoke } from '@tauri-apps/api/core';
import useStore from '../store/useStore';
import { UPDATE_COMMANDS_CAMEL } from '../config/entityCommands';
import { createPlace, loadPlaces } from '../lib/places';
import { loadOverlays } from '../lib/overlays';
import OverlayGeoreference from './OverlayGeoreference';
import ModeBanner from './ModeBanner';
import EntityTypeFilterPanel from './EntityTypeFilterPanel';
import type {
  EntityType,
  Person,
  Event,
  Theory,
  Place as PlaceEntity,
  Artifact,
} from '../types/entities';

interface EntityTypeFilters {
  place: boolean;
  person: boolean;
  event: boolean;
  theory: boolean;
  artifact: boolean;
}

type EntityWithLocation = Person | Event | Theory | PlaceEntity | Artifact;

// Configure MapLibre GL worker for Vite compatibility
// Using ?worker&url ensures proper bundling in both dev and production
// See: https://github.com/openwatersio/openwaters.io/pull/122
setWorkerUrl(workerUrl);

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [entityTypeFilters, setEntityTypeFilters] = useState<EntityTypeFilters>({
    place: true,
    person: true,
    event: true,
    theory: true,
    artifact: true,
  });

  const currentProject = useStore((state) => state.currentProject);
  const places = useStore((state) => state.places);
  const setPlaces = useStore((state) => state.setPlaces);
  const people = useStore((state) => state.people);
  const setPeople = useStore((state) => state.setPeople);
  const events = useStore((state) => state.events);
  const setEvents = useStore((state) => state.setEvents);
  const theories = useStore((state) => state.theories);
  const setTheories = useStore((state) => state.setTheories);
  const artifacts = useStore((state) => state.artifacts);
  const setArtifacts = useStore((state) => state.setArtifacts);
  const pinPlacementMode = useStore((state) => state.pinPlacementMode);
  const cancelPinPlacement = useStore((state) => state.cancelPinPlacement);
  const locationPlacementMode = useStore((state) => state.locationPlacementMode);
  const pendingLocationEntity = useStore((state) => state.pendingLocationEntity);
  const cancelLocationPlacement = useStore((state) => state.cancelLocationPlacement);
  const mapOverlays = useStore((state) => state.mapOverlays);
  const setMapOverlays = useStore((state) => state.setMapOverlays);
  const overlayMode = useStore((state) => state.overlayMode);
  const openOverlayMode = useStore((state) => state.openOverlayMode);

  useEffect(() => {
    if (map.current) return; // Initialize only once

    if (!mapContainer.current) {
      console.error('Map container ref is null!');
      return;
    }

    const centerLng = currentProject?.map_center_lng || -20;
    const centerLat = currentProject?.map_center_lat || 36;
    const zoom = currentProject?.map_zoom || 3.4;

    try {
      map.current = new Map({
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

      map.current.addControl(new NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setMapReady(true);
        // Force resize after load to ensure proper rendering
        setTimeout(() => {
          map.current?.resize();
        }, 100);
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
      });

      // Click handler for adding pins and georeferencing overlays
      map.current.on('click', async (e: MapMouseEvent) => {
        const state = useStore.getState();

        // Check if in overlay georeferencing mode
        if (state.overlayMode && state.onOverlayMapClick) {
          state.onOverlayMapClick(e.lngLat);
          return;
        }

        // Check if in location placement mode
        if (state.locationPlacementMode && state.pendingLocationEntity) {
          const { entityId, entityType, entityName } = state.pendingLocationEntity;

          try {
            // Update entity coordinates based on type
            const updateCommandMap = UPDATE_COMMANDS_CAMEL;

            const config = updateCommandMap[entityType];
            if (config) {
              await invoke(config.command, {
                [config.param]: entityId,
                input: {
                  lng: e.lngLat.lng,
                  lat: e.lngLat.lat,
                },
              });

              // Update in local state
              const updateFunctions = {
                person: state.updatePerson,
                event: state.updateEvent,
                theory: state.updateTheory,
                place: state.updatePlace,
                artifact: state.updateArtifact,
              };

              const updateFn = updateFunctions[entityType];
              if (updateFn) {
                updateFn(entityId, {
                  lng: e.lngLat.lng,
                  lat: e.lngLat.lat,
                });
              }

              state.cancelLocationPlacement();

              // Fly to the new location
              map.current?.flyTo({ center: [e.lngLat.lng, e.lngLat.lat], zoom: 8 });

              console.log(`✓ Location updated for ${entityName}`);
            }
          } catch (err) {
            console.error('Failed to update location:', err);
          }
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
              project_id: currentProject!.id,
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
          map.current?.flyTo({ center: [e.lngLat.lng, e.lngLat.lat], zoom: 8 });
        } catch (err) {
          console.error('Failed to create place:', err);
          alert(`Failed to create pin: ${(err as Error).message}`);
        }
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [currentProject]);

  // Handle container resize
  useEffect(() => {
    if (!map.current || !mapContainer.current) return;

    const resizeObserver = new ResizeObserver(() => {
      map.current?.resize();
    });

    resizeObserver.observe(mapContainer.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [mapReady]);

  // Load all entities and overlays when project changes
  useEffect(() => {
    if (!currentProject?.id) return;

    const fetchData = async () => {
      try {
        const [
          loadedPlaces,
          loadedOverlays,
          loadedPeople,
          loadedEvents,
          loadedTheories,
          loadedArtifacts,
        ] = await Promise.all([
          loadPlaces(currentProject.id),
          loadOverlays(currentProject.id),
          invoke<Person[]>('list_people', { projectId: currentProject.id }),
          invoke<Event[]>('list_events', { projectId: currentProject.id }),
          invoke<Theory[]>('list_theories', { projectId: currentProject.id }),
          invoke<Artifact[]>('list_artifacts', { projectId: currentProject.id }),
        ]);
        setPlaces(loadedPlaces);
        setMapOverlays(loadedOverlays);
        setPeople(loadedPeople);
        setEvents(loadedEvents);
        setTheories(loadedTheories);
        setArtifacts(loadedArtifacts);
      } catch (err) {
        console.error('Failed to load map data:', err);
      }
    };

    fetchData();
  }, [currentProject, setPlaces, setMapOverlays, setPeople, setEvents, setTheories, setArtifacts]);

  // Handle flyTo when navigating from annotation
  useEffect(() => {
    const flyToPlace = (useStore.getState() as any).flyToPlace;
    if (flyToPlace && map.current && mapReady) {
      map.current.flyTo({
        center: [flyToPlace.lng, flyToPlace.lat],
        zoom: 8,
      });
      // Clear the flyTo state
      (useStore.getState() as any).flyToPlace = null;
    }
  }, [mapReady]);

  // Update markers when any entity changes
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Entity type colors and icons
    const entityTypeConfig = {
      place: { color: '#e8b86d', borderColor: '#c45c4a', icon: '📍', label: 'Place' },
      person: { color: '#60a5fa', borderColor: '#3b82f6', icon: '👤', label: 'Person' },
      event: { color: '#f87171', borderColor: '#dc2626', icon: '📅', label: 'Event' },
      theory: { color: '#c084fc', borderColor: '#9333ea', icon: '💡', label: 'Theory' },
      artifact: { color: '#34d399', borderColor: '#059669', icon: '🏺', label: 'Artifact' },
    };

    // Helper function to create marker for any entity
    const createEntityMarker = (entity: EntityWithLocation, entityType: EntityType) => {
      // Skip if entity doesn't have coordinates
      if (!entity.lng || !entity.lat) return;

      // Skip if this entity type is filtered out
      if (!entityTypeFilters[entityType]) return;

      const config = entityTypeConfig[entityType] as {
        color: string;
        borderColor: string;
        icon: string;
        label: string;
      };
      const el = document.createElement('div');
      el.style.cssText = `
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: ${config.color};
        border: 2px solid #0e0f12;
        box-shadow: 0 0 0 1px ${config.borderColor};
        cursor: pointer;
      `;

      // Build popup content based on entity type
      let additionalInfo = '';
      if (entityType === 'place' && 'place_type' in entity && entity.place_type) {
        additionalInfo = `<div style="margin-bottom: 6px; color: #59636e; font-size: 12px; font-weight: 500;">📍 ${entity.place_type}</div>`;
      } else if (entityType === 'person' && 'occupation' in entity && entity.occupation) {
        additionalInfo = `<div style="margin-bottom: 6px; color: #59636e; font-size: 12px; font-weight: 500;">💼 ${entity.occupation}</div>`;
      } else if (entityType === 'event' && 'event_date' in entity && entity.event_date) {
        additionalInfo = `<div style="margin-bottom: 6px; color: #59636e; font-size: 12px; font-weight: 500;">📅 ${entity.event_date}</div>`;
      } else if (entityType === 'artifact' && 'category' in entity && entity.category) {
        additionalInfo = `<div style="margin-bottom: 6px; color: #59636e; font-size: 12px; font-weight: 500;">🏺 ${entity.category}</div>`;
      }

      const popupHTML = `
        <div style="min-width: 200px; max-width: 300px; color: #24292f;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
            <span style="font-size: 16px;">${config.icon}</span>
            <div style="font-weight: 600; font-size: 14px; color: #1f2328;">${entity.name}</div>
          </div>
          <div style="margin-bottom: 6px; color: #59636e; font-size: 11px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">${config.label}</div>
          ${additionalInfo}
          ${entity.description ? `<div style="margin-bottom: 8px; color: #59636e; font-size: 13px; line-height: 1.5;">${entity.description}</div>` : ''}
          ${entity.metadata ? `<div style="margin-bottom: 8px; padding: 6px 8px; background: #f6f8fa; border-radius: 4px; font-size: 12px; color: #59636e;">${entity.metadata}</div>` : ''}
          <div style="display: flex; gap: 4px; font-size: 11px; color: #8b949e; margin-bottom: 8px;">
            <span>📍 ${entity.lat.toFixed(4)}, ${entity.lng.toFixed(4)}</span>
          </div>
          <button
            id="view-${entityType}-${entity.id}"
            style="
              width: 100%;
              padding: 6px 12px;
              background: ${config.borderColor};
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 13px;
              font-weight: 500;
              cursor: pointer;
              margin-top: 4px;
              transition: background 0.2s;
            "
            onmouseover="this.style.opacity='0.9'"
            onmouseout="this.style.opacity='1'"
          >
            View Full Page →
          </button>
        </div>
      `;

      const popup = new Popup({ offset: 12 }).setHTML(popupHTML);

      const marker = new Marker({ element: el })
        .setLngLat([entity.lng, entity.lat])
        .setPopup(popup)
        .addTo(map.current!);

      // Add click handler for the button after popup opens
      popup.on('open', () => {
        const button = document.getElementById(`view-${entityType}-${entity.id}`);
        if (button) {
          button.addEventListener('click', () => {
            const addTab = useStore.getState().addTab;
            addTab({
              type: entityType,
              title: entity.name,
              data: {
                entityId: entity.id,
                entityType: entityType,
              },
            });
            popup.remove(); // Close popup after opening page
          });
        }
      });

      markersRef.current.push(marker);
    };

    // Add markers for all entity types
    places.forEach((place) => createEntityMarker(place, 'place'));
    people.forEach((person) => createEntityMarker(person, 'person'));
    events.forEach((event) => createEntityMarker(event, 'event'));
    theories.forEach((theory) => createEntityMarker(theory, 'theory'));
    artifacts.forEach((artifact) => createEntityMarker(artifact, 'artifact'));
  }, [places, people, events, theories, artifacts, mapReady, entityTypeFilters]);

  // Render map overlays
  useEffect(() => {
    if (!map.current || !mapReady) return;

    // Remove existing overlay sources and layers
    mapOverlays.forEach((overlay) => {
      const layerId = `overlay-${overlay.id}`;
      if (map.current!.getLayer(layerId)) {
        map.current!.removeLayer(layerId);
      }
      if (map.current!.getSource(layerId)) {
        map.current!.removeSource(layerId);
      }
    });

    // Add overlay sources and layers
    mapOverlays
      .filter((overlay) => overlay.visible)
      .forEach((overlay) => {
        const layerId = `overlay-${overlay.id}`;

        // Add image source with corner coordinates
        map.current!.addSource(layerId, {
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
        map.current!.addLayer({
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
    <div
      style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
      }}
    >
      {/* Location placement mode banner */}
      {locationPlacementMode && pendingLocationEntity && (
        <ModeBanner
          message={`📍 Click on the map to set location for ${pendingLocationEntity.entityName}`}
          variant="primary"
          onCancel={cancelLocationPlacement}
        />
      )}

      {/* Pin placement mode banner */}
      {!locationPlacementMode && pinPlacementMode && (
        <ModeBanner
          message="📍 Click on the map to place a pin"
          variant="primary"
          onCancel={cancelPinPlacement}
        />
      )}

      {/* Overlay mode banner */}
      {overlayMode && (
        <ModeBanner
          message="🗺️ Georeferencing Mode: Click on the map to place corner markers"
          variant="secondary"
        />
      )}

      {/* Entity type filters */}
      {!pinPlacementMode && !overlayMode && !locationPlacementMode && (
        <EntityTypeFilterPanel
          filters={entityTypeFilters}
          onFilterChange={(type, checked) =>
            setEntityTypeFilters((prev) => ({
              ...prev,
              [type]: checked,
            }))
          }
        />
      )}

      {/* Add overlay button */}
      {!pinPlacementMode && !overlayMode && !locationPlacementMode && (
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

      <div
        ref={mapContainer}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
        }}
      />

      {/* Overlay georeferencing UI */}
      <OverlayGeoreference />
    </div>
  );
}
