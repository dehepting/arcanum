import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useStore from './useStore';

describe('useStore', () => {
  beforeEach(() => {
    // Reset store to initial state by calling setters directly
    const state = useStore.getState();
    state.setCurrentProject(null);
    state.setSources([]);
    state.setActiveSource(null);
    state.setPlaces([]);
    state.setArtifacts([]);
    state.setPeople([]);
    state.setEvents([]);
    state.setTheories([]);
    state.setEntityPages([]);
    state.setEntityLinks([]);
    state.setMapOverlays([]);
    state.setSelectedArtifact(null);
    state.closeAdvancedSearch();
    state.closeOverlayMode();

    // Reset tabs to initial state (remove all except default map tab)
    const tabs = state.tabs.slice();
    tabs.forEach((tab) => {
      if (tab.id !== 'default-map') {
        state.removeTab(tab.id);
      }
    });
    state.setActiveTab('default-map');
  });

  describe('Project Management', () => {
    it('initializes with no current project', () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.currentProject).toBeNull();
    });

    it('sets current project', () => {
      const { result } = renderHook(() => useStore());
      const project = { id: '1', name: 'Test Project' };

      act(() => {
        result.current.setCurrentProject(project);
      });

      expect(result.current.currentProject).toEqual(project);
    });

    it('clears current project', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setCurrentProject({ id: '1', name: 'Test' });
        result.current.setCurrentProject(null);
      });

      expect(result.current.currentProject).toBeNull();
    });
  });

  describe('Sources Management', () => {
    it('initializes with empty sources', () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.sources).toEqual([]);
      expect(result.current.activeSourceId).toBeNull();
    });

    it('adds source and sets it as active', () => {
      const { result } = renderHook(() => useStore());
      const source = { id: 's1', name: 'Document.pdf' };

      act(() => {
        result.current.addSource(source);
      });

      expect(result.current.sources).toHaveLength(1);
      expect(result.current.sources[0]).toEqual(source);
      expect(result.current.activeSourceId).toBe('s1');
    });

    it('adds multiple sources', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addSource({ id: 's1', name: 'Doc1.pdf' });
        result.current.addSource({ id: 's2', name: 'Doc2.pdf' });
      });

      expect(result.current.sources).toHaveLength(2);
      expect(result.current.activeSourceId).toBe('s2');
    });

    it('removes source', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addSource({ id: 's1', name: 'Doc1.pdf' });
        result.current.addSource({ id: 's2', name: 'Doc2.pdf' });
        result.current.removeSource('s1');
      });

      expect(result.current.sources).toHaveLength(1);
      expect(result.current.sources[0].id).toBe('s2');
    });

    it('clears active source when removing active source', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addSource({ id: 's1', name: 'Doc1.pdf' });
        result.current.removeSource('s1');
      });

      expect(result.current.activeSourceId).toBeNull();
    });

    it('keeps active source when removing different source', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addSource({ id: 's1', name: 'Doc1.pdf' });
        result.current.addSource({ id: 's2', name: 'Doc2.pdf' });
        result.current.setActiveSource('s1');
        result.current.removeSource('s2');
      });

      expect(result.current.activeSourceId).toBe('s1');
    });

    it('sets active source', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addSource({ id: 's1', name: 'Doc1.pdf' });
        result.current.addSource({ id: 's2', name: 'Doc2.pdf' });
        result.current.setActiveSource('s1');
      });

      expect(result.current.activeSourceId).toBe('s1');
    });

    it('sets sources array', () => {
      const { result } = renderHook(() => useStore());
      const sources = [
        { id: 's1', name: 'Doc1.pdf' },
        { id: 's2', name: 'Doc2.pdf' },
      ];

      act(() => {
        result.current.setSources(sources);
      });

      expect(result.current.sources).toEqual(sources);
    });
  });

  describe('PDF Viewer State', () => {
    it('initializes with default page and scale', () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.currentPage).toBe(1);
      expect(result.current.pdfScale).toBe(1.2);
    });

    it('sets current page', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setCurrentPage(5);
      });

      expect(result.current.currentPage).toBe(5);
    });

    it('sets PDF scale', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setScale(1.5);
      });

      expect(result.current.pdfScale).toBe(1.5);
    });
  });

  describe('Tabs Management', () => {
    it('initializes with default map tab', () => {
      const { result } = renderHook(() => useStore());

      expect(result.current.tabs).toHaveLength(1);
      expect(result.current.tabs[0].type).toBe('map');
      expect(result.current.tabs[0].title).toBe('Map');
      expect(result.current.activeTabId).toBe('default-map');
    });

    it('adds new tab', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addTab({
          type: 'person',
          title: 'Plato',
          data: { entityId: '1' },
        });
      });

      expect(result.current.tabs).toHaveLength(2);
      expect(result.current.tabs[1].type).toBe('person');
      expect(result.current.tabs[1].title).toBe('Plato');
    });

    it('generates tab ID if not provided', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addTab({
          type: 'person',
          title: 'Test',
        });
      });

      expect(result.current.tabs[1].id).toBeDefined();
      expect(result.current.tabs[1].id).toMatch(/^tab-/);
    });

    it('uses provided tab ID', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addTab({
          id: 'custom-id',
          type: 'person',
          title: 'Test',
        });
      });

      expect(result.current.tabs[1].id).toBe('custom-id');
    });

    it('sets new tab as active when added', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addTab({
          id: 'tab-1',
          type: 'person',
          title: 'Test',
        });
      });

      expect(result.current.activeTabId).toBe('tab-1');
    });

    it('removes tab', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addTab({ id: 'tab-1', type: 'person', title: 'Test 1' });
        result.current.addTab({ id: 'tab-2', type: 'person', title: 'Test 2' });
        result.current.removeTab('tab-1');
      });

      expect(result.current.tabs).toHaveLength(2);
      expect(result.current.tabs.find((t) => t.id === 'tab-1')).toBeUndefined();
    });

    it('does not remove last tab', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.removeTab('default-map');
      });

      expect(result.current.tabs).toHaveLength(1);
    });

    it('switches to previous tab when removing active tab', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addTab({ id: 'tab-1', type: 'person', title: 'Test 1' });
        result.current.addTab({ id: 'tab-2', type: 'person', title: 'Test 2' });
        result.current.removeTab('tab-2');
      });

      expect(result.current.activeTabId).toBe('tab-1');
    });

    it('keeps active tab when removing different tab', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addTab({ id: 'tab-1', type: 'person', title: 'Test 1' });
        result.current.addTab({ id: 'tab-2', type: 'person', title: 'Test 2' });
        result.current.setActiveTab('tab-1');
        result.current.removeTab('tab-2');
      });

      expect(result.current.activeTabId).toBe('tab-1');
    });

    it('sets active tab', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addTab({ id: 'tab-1', type: 'person', title: 'Test' });
        result.current.setActiveTab('default-map');
      });

      expect(result.current.activeTabId).toBe('default-map');
    });

    it('updates tab', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addTab({ id: 'tab-1', type: 'person', title: 'Old Title' });
        result.current.updateTab('tab-1', { title: 'New Title', isDirty: true });
      });

      const updatedTab = result.current.tabs.find((t) => t.id === 'tab-1');
      expect(updatedTab.title).toBe('New Title');
      expect(updatedTab.isDirty).toBe(true);
    });
  });

  describe('Places (Pins)', () => {
    it('initializes with empty places', () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.places).toEqual([]);
    });

    it('adds place', () => {
      const { result } = renderHook(() => useStore());
      const place = { id: 'p1', name: 'Athens', lat: 37.9838, lng: 23.7275 };

      act(() => {
        result.current.addPlace(place);
      });

      expect(result.current.places).toHaveLength(1);
      expect(result.current.places[0]).toEqual(place);
    });

    it('updates place', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addPlace({ id: 'p1', name: 'Athens', lat: 37.9838, lng: 23.7275 });
        result.current.updatePlace('p1', { name: 'Athens, Greece' });
      });

      expect(result.current.places[0].name).toBe('Athens, Greece');
      expect(result.current.places[0].lat).toBe(37.9838);
    });

    it('removes place', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addPlace({ id: 'p1', name: 'Place 1' });
        result.current.addPlace({ id: 'p2', name: 'Place 2' });
        result.current.removePlace('p1');
      });

      expect(result.current.places).toHaveLength(1);
      expect(result.current.places[0].id).toBe('p2');
    });

    it('sets places array', () => {
      const { result } = renderHook(() => useStore());
      const places = [
        { id: 'p1', name: 'Place 1' },
        { id: 'p2', name: 'Place 2' },
      ];

      act(() => {
        result.current.setPlaces(places);
      });

      expect(result.current.places).toEqual(places);
    });
  });

  describe('Modals', () => {
    it('advanced search modal starts closed', () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.advancedSearchModalOpen).toBe(false);
    });

    it('opens advanced search modal', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.openAdvancedSearch();
      });

      expect(result.current.advancedSearchModalOpen).toBe(true);
    });

    it('closes advanced search modal', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.openAdvancedSearch();
        result.current.closeAdvancedSearch();
      });

      expect(result.current.advancedSearchModalOpen).toBe(false);
    });
  });

  describe('Artifacts', () => {
    it('initializes with empty artifacts', () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.artifacts).toEqual([]);
      expect(result.current.selectedArtifact).toBeNull();
    });

    it('adds artifact', () => {
      const { result } = renderHook(() => useStore());
      const artifact = { id: 'art1', name: 'Manuscript' };

      act(() => {
        result.current.addArtifact(artifact);
      });

      expect(result.current.artifacts).toHaveLength(1);
      expect(result.current.artifacts[0]).toEqual(artifact);
    });

    it('updates artifact', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addArtifact({ id: 'art1', name: 'Old Name' });
        result.current.updateArtifact('art1', { name: 'New Name' });
      });

      expect(result.current.artifacts[0].name).toBe('New Name');
    });

    it('removes artifact', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addArtifact({ id: 'art1', name: 'Artifact 1' });
        result.current.addArtifact({ id: 'art2', name: 'Artifact 2' });
        result.current.removeArtifact('art1');
      });

      expect(result.current.artifacts).toHaveLength(1);
      expect(result.current.artifacts[0].id).toBe('art2');
    });

    it('sets selected artifact', () => {
      const { result } = renderHook(() => useStore());
      const artifact = { id: 'art1', name: 'Test' };

      act(() => {
        result.current.setSelectedArtifact(artifact);
      });

      expect(result.current.selectedArtifact).toEqual(artifact);
    });

    it('sets artifacts array', () => {
      const { result } = renderHook(() => useStore());
      const artifacts = [
        { id: 'art1', name: 'Artifact 1' },
        { id: 'art2', name: 'Artifact 2' },
      ];

      act(() => {
        result.current.setArtifacts(artifacts);
      });

      expect(result.current.artifacts).toEqual(artifacts);
    });
  });

  describe('Map Overlays', () => {
    it('initializes with empty overlays', () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.mapOverlays).toEqual([]);
    });

    it('adds map overlay', () => {
      const { result } = renderHook(() => useStore());
      const overlay = { id: 'o1', url: 'map.png' };

      act(() => {
        result.current.addMapOverlay(overlay);
      });

      expect(result.current.mapOverlays).toHaveLength(1);
      expect(result.current.mapOverlays[0]).toEqual(overlay);
    });

    it('sets overlays array', () => {
      const { result } = renderHook(() => useStore());
      const overlays = [{ id: 'o1' }, { id: 'o2' }];

      act(() => {
        result.current.setMapOverlays(overlays);
      });

      expect(result.current.mapOverlays).toEqual(overlays);
    });

    it('overlay mode starts closed', () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.overlayMode).toBe(false);
    });

    it('opens overlay mode', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.openOverlayMode();
      });

      expect(result.current.overlayMode).toBe(true);
    });

    it('closes overlay mode', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.openOverlayMode();
        result.current.closeOverlayMode();
      });

      expect(result.current.overlayMode).toBe(false);
    });
  });

  describe('People (Knowledge Graph)', () => {
    it('initializes with empty people', () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.people).toEqual([]);
    });

    it('adds person', () => {
      const { result } = renderHook(() => useStore());
      const person = { id: 'p1', name: 'Plato' };

      act(() => {
        result.current.addPerson(person);
      });

      expect(result.current.people).toHaveLength(1);
      expect(result.current.people[0]).toEqual(person);
    });

    it('updates person', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addPerson({ id: 'p1', name: 'Plato', occupation: 'Philosopher' });
        result.current.updatePerson('p1', { occupation: 'Greek Philosopher' });
      });

      expect(result.current.people[0].occupation).toBe('Greek Philosopher');
    });

    it('removes person', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addPerson({ id: 'p1', name: 'Person 1' });
        result.current.addPerson({ id: 'p2', name: 'Person 2' });
        result.current.removePerson('p1');
      });

      expect(result.current.people).toHaveLength(1);
      expect(result.current.people[0].id).toBe('p2');
    });

    it('sets people array', () => {
      const { result } = renderHook(() => useStore());
      const people = [
        { id: 'p1', name: 'Person 1' },
        { id: 'p2', name: 'Person 2' },
      ];

      act(() => {
        result.current.setPeople(people);
      });

      expect(result.current.people).toEqual(people);
    });
  });

  describe('Events (Knowledge Graph)', () => {
    it('initializes with empty events', () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.events).toEqual([]);
    });

    it('adds event', () => {
      const { result } = renderHook(() => useStore());
      const event = { id: 'e1', name: 'Battle of Marathon' };

      act(() => {
        result.current.addEvent(event);
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0]).toEqual(event);
    });

    it('updates event', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addEvent({ id: 'e1', name: 'Event', date: '490 BC' });
        result.current.updateEvent('e1', { date: '490 BCE' });
      });

      expect(result.current.events[0].date).toBe('490 BCE');
    });

    it('removes event', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addEvent({ id: 'e1', name: 'Event 1' });
        result.current.addEvent({ id: 'e2', name: 'Event 2' });
        result.current.removeEvent('e1');
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0].id).toBe('e2');
    });

    it('sets events array', () => {
      const { result } = renderHook(() => useStore());
      const events = [
        { id: 'e1', name: 'Event 1' },
        { id: 'e2', name: 'Event 2' },
      ];

      act(() => {
        result.current.setEvents(events);
      });

      expect(result.current.events).toEqual(events);
    });
  });

  describe('Theories (Knowledge Graph)', () => {
    it('initializes with empty theories', () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.theories).toEqual([]);
    });

    it('adds theory', () => {
      const { result } = renderHook(() => useStore());
      const theory = { id: 't1', name: 'Theory of Forms' };

      act(() => {
        result.current.addTheory(theory);
      });

      expect(result.current.theories).toHaveLength(1);
      expect(result.current.theories[0]).toEqual(theory);
    });

    it('updates theory', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addTheory({ id: 't1', name: 'Theory', description: 'Old' });
        result.current.updateTheory('t1', { description: 'New' });
      });

      expect(result.current.theories[0].description).toBe('New');
    });

    it('removes theory', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addTheory({ id: 't1', name: 'Theory 1' });
        result.current.addTheory({ id: 't2', name: 'Theory 2' });
        result.current.removeTheory('t1');
      });

      expect(result.current.theories).toHaveLength(1);
      expect(result.current.theories[0].id).toBe('t2');
    });

    it('sets theories array', () => {
      const { result } = renderHook(() => useStore());
      const theories = [
        { id: 't1', name: 'Theory 1' },
        { id: 't2', name: 'Theory 2' },
      ];

      act(() => {
        result.current.setTheories(theories);
      });

      expect(result.current.theories).toEqual(theories);
    });
  });

  describe('Entity Pages', () => {
    it('initializes with empty entity pages', () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.entityPages).toEqual([]);
    });

    it('adds entity page', () => {
      const { result } = renderHook(() => useStore());
      const page = { entity_id: 'e1', content: 'Page content' };

      act(() => {
        result.current.addEntityPage(page);
      });

      expect(result.current.entityPages).toHaveLength(1);
      expect(result.current.entityPages[0]).toEqual(page);
    });

    it('updates entity page', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addEntityPage({ entity_id: 'e1', content: 'Old' });
        result.current.updateEntityPageInStore('e1', { content: 'New' });
      });

      expect(result.current.entityPages[0].content).toBe('New');
    });

    it('removes entity page', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addEntityPage({ entity_id: 'e1', content: 'Page 1' });
        result.current.addEntityPage({ entity_id: 'e2', content: 'Page 2' });
        result.current.removeEntityPage('e1');
      });

      expect(result.current.entityPages).toHaveLength(1);
      expect(result.current.entityPages[0].entity_id).toBe('e2');
    });

    it('sets entity pages array', () => {
      const { result } = renderHook(() => useStore());
      const pages = [
        { entity_id: 'e1', content: 'Page 1' },
        { entity_id: 'e2', content: 'Page 2' },
      ];

      act(() => {
        result.current.setEntityPages(pages);
      });

      expect(result.current.entityPages).toEqual(pages);
    });
  });

  describe('Entity Links', () => {
    it('initializes with empty entity links', () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.entityLinks).toEqual([]);
    });

    it('adds entity link', () => {
      const { result } = renderHook(() => useStore());
      const link = { id: 'l1', from: 'p1', to: 'e1', type: 'participated_in' };

      act(() => {
        result.current.addEntityLink(link);
      });

      expect(result.current.entityLinks).toHaveLength(1);
      expect(result.current.entityLinks[0]).toEqual(link);
    });

    it('removes entity link', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.addEntityLink({ id: 'l1', from: 'p1', to: 'e1' });
        result.current.addEntityLink({ id: 'l2', from: 'p2', to: 'e2' });
        result.current.removeEntityLink('l1');
      });

      expect(result.current.entityLinks).toHaveLength(1);
      expect(result.current.entityLinks[0].id).toBe('l2');
    });

    it('sets entity links array', () => {
      const { result } = renderHook(() => useStore());
      const links = [
        { id: 'l1', from: 'p1', to: 'e1' },
        { id: 'l2', from: 'p2', to: 'e2' },
      ];

      act(() => {
        result.current.setEntityLinks(links);
      });

      expect(result.current.entityLinks).toEqual(links);
    });
  });

  describe('Map View (Deprecated)', () => {
    it('initializes with map view', () => {
      const { result } = renderHook(() => useStore());
      expect(result.current.mapView).toBe('map');
    });

    it('sets map view', () => {
      const { result } = renderHook(() => useStore());

      act(() => {
        result.current.setMapView('source');
      });

      expect(result.current.mapView).toBe('source');
    });
  });
});
