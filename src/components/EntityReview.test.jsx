import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EntityReview from './EntityReview';
import * as peopleLib from '../lib/people';
import * as eventsLib from '../lib/events';
import * as theoriesLib from '../lib/theories';
import * as placesLib from '../lib/places';

// Mock the libraries
vi.mock('../lib/people');
vi.mock('../lib/events');
vi.mock('../lib/theories');
vi.mock('../lib/places');

// Mock useStore
vi.mock('../store/useStore', () => ({
  default: vi.fn((selector) => {
    const state = {
      currentProject: { id: 'project-1', name: 'Test Project' },
      addPerson: vi.fn(),
      addEvent: vi.fn(),
      addTheory: vi.fn(),
      addPlace: vi.fn(),
    };
    return selector(state);
  }),
}));

describe('EntityReview', () => {
  const mockOnClose = vi.fn();
  const mockOnApproved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render empty entity review modal', () => {
      render(
        <EntityReview
          annotationId="ann-1"
          annotationText="Test annotation text"
          onClose={mockOnClose}
          onApproved={mockOnApproved}
        />
      );

      expect(screen.getByText('Review Entities')).toBeInTheDocument();
      expect(screen.getByText('From annotation:')).toBeInTheDocument();
      expect(screen.getByText(/Test annotation text/)).toBeInTheDocument();
    });

    it('should render with initial entities', () => {
      const initialEntities = {
        people: [{ name: 'Plato', role: 'historical_figure', relationship_type: 'mentions' }],
        events: [
          { name: 'Battle of Marathon', event_type: 'battle', relationship_type: 'describes' },
        ],
        theories: [{ name: 'Atlantis Theory', status: 'active', relationship_type: 'supports' }],
        places: [{ name: 'Athens', lng: 23.7, lat: 37.9 }],
      };

      render(
        <EntityReview
          annotationId="ann-1"
          initialEntities={initialEntities}
          onClose={mockOnClose}
          onApproved={mockOnApproved}
        />
      );

      expect(screen.getByDisplayValue('Plato')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Battle of Marathon')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Atlantis Theory')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Athens')).toBeInTheDocument();
    });

    it('should show entity counts', () => {
      const initialEntities = {
        people: [{ name: 'Plato', role: 'author', relationship_type: 'mentions' }],
        events: [],
        theories: [],
        places: [],
      };

      render(
        <EntityReview
          annotationId="ann-1"
          initialEntities={initialEntities}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('People (1)')).toBeInTheDocument();
      expect(screen.getByText('Events (0)')).toBeInTheDocument();
    });
  });

  describe('Adding Entities', () => {
    it('should add a new person', () => {
      render(<EntityReview annotationId="ann-1" onClose={mockOnClose} />);

      const addButton = screen.getByText('+ Add Person');
      fireEvent.click(addButton);

      const nameInputs = screen.getAllByPlaceholderText('Name');
      expect(nameInputs.length).toBeGreaterThan(0);
    });

    it('should add a new event', () => {
      render(<EntityReview annotationId="ann-1" onClose={mockOnClose} />);

      const addButton = screen.getByText('+ Add Event');
      fireEvent.click(addButton);

      const nameInputs = screen.getAllByPlaceholderText('Event Name');
      expect(nameInputs.length).toBeGreaterThan(0);
    });

    it('should add a new theory', () => {
      render(<EntityReview annotationId="ann-1" onClose={mockOnClose} />);

      const addButton = screen.getByText('+ Add Theory');
      fireEvent.click(addButton);

      const nameInputs = screen.getAllByPlaceholderText('Theory Name');
      expect(nameInputs.length).toBeGreaterThan(0);
    });

    it('should add a new place', () => {
      render(<EntityReview annotationId="ann-1" onClose={mockOnClose} />);

      const addButton = screen.getByText('+ Add Place');
      fireEvent.click(addButton);

      const nameInputs = screen.getAllByPlaceholderText('Place Name');
      expect(nameInputs.length).toBeGreaterThan(0);
    });
  });

  describe('Editing Entities', () => {
    it('should update person name', () => {
      const initialEntities = {
        people: [{ name: 'Plato', role: 'author', relationship_type: 'mentions' }],
        events: [],
        theories: [],
        places: [],
      };

      render(
        <EntityReview
          annotationId="ann-1"
          initialEntities={initialEntities}
          onClose={mockOnClose}
        />
      );

      const nameInput = screen.getByDisplayValue('Plato');
      fireEvent.change(nameInput, { target: { value: 'Socrates' } });

      expect(screen.getByDisplayValue('Socrates')).toBeInTheDocument();
    });

    it('should update event type', () => {
      const initialEntities = {
        people: [],
        events: [{ name: 'Discovery', event_type: 'discovery', relationship_type: 'mentions' }],
        theories: [],
        places: [],
      };

      render(
        <EntityReview
          annotationId="ann-1"
          initialEntities={initialEntities}
          onClose={mockOnClose}
        />
      );

      const typeSelect = screen.getAllByRole('combobox')[0]; // First select in event
      fireEvent.change(typeSelect, { target: { value: 'battle' } });

      expect(typeSelect.value).toBe('battle');
    });
  });

  describe('Removing Entities', () => {
    it('should remove a person', () => {
      const initialEntities = {
        people: [{ name: 'Plato', role: 'author', relationship_type: 'mentions' }],
        events: [],
        theories: [],
        places: [],
      };

      render(
        <EntityReview
          annotationId="ann-1"
          initialEntities={initialEntities}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByDisplayValue('Plato')).toBeInTheDocument();

      const removeButtons = screen.getAllByText('Remove');
      fireEvent.click(removeButtons[0]);

      expect(screen.queryByDisplayValue('Plato')).not.toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should auto-select all entities on load', () => {
      const initialEntities = {
        people: [{ name: 'Plato', role: 'author', relationship_type: 'mentions' }],
        events: [{ name: 'Battle', event_type: 'battle', relationship_type: 'describes' }],
        theories: [],
        places: [],
      };

      render(
        <EntityReview
          annotationId="ann-1"
          initialEntities={initialEntities}
          onClose={mockOnClose}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).toBeChecked();
    });

    it('should toggle entity selection', () => {
      const initialEntities = {
        people: [{ name: 'Plato', role: 'author', relationship_type: 'mentions' }],
        events: [],
        theories: [],
        places: [],
      };

      render(
        <EntityReview
          annotationId="ann-1"
          initialEntities={initialEntities}
          onClose={mockOnClose}
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('should show selection count', () => {
      const initialEntities = {
        people: [{ name: 'Plato', role: 'author', relationship_type: 'mentions' }],
        events: [{ name: 'Battle', event_type: 'battle', relationship_type: 'describes' }],
        theories: [],
        places: [],
      };

      render(
        <EntityReview
          annotationId="ann-1"
          initialEntities={initialEntities}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('2 entities selected')).toBeInTheDocument();
    });
  });

  describe('Creating Entities', () => {
    it('should create selected entities', async () => {
      peopleLib.createPerson = vi.fn().mockResolvedValue({ id: 'person-1', name: 'Plato' });
      eventsLib.createEvent = vi.fn().mockResolvedValue({ id: 'event-1', name: 'Battle' });

      const initialEntities = {
        people: [{ name: 'Plato', role: 'author', bio: '', relationship_type: 'mentions' }],
        events: [{ name: 'Battle', event_type: 'battle', relationship_type: 'describes' }],
        theories: [],
        places: [],
      };

      render(
        <EntityReview
          annotationId="ann-1"
          initialEntities={initialEntities}
          onClose={mockOnClose}
          onApproved={mockOnApproved}
        />
      );

      const approveButton = screen.getByText('Create 2 Entities');
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(peopleLib.createPerson).toHaveBeenCalled();
        expect(eventsLib.createEvent).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockOnApproved).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should skip empty entities', async () => {
      peopleLib.createPerson = vi.fn();

      const initialEntities = {
        people: [{ name: '', role: 'author', relationship_type: 'mentions' }],
        events: [],
        theories: [],
        places: [],
      };

      render(
        <EntityReview
          annotationId="ann-1"
          initialEntities={initialEntities}
          onClose={mockOnClose}
        />
      );

      const approveButton = screen.getByText('Create 1 Entity');
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(peopleLib.createPerson).not.toHaveBeenCalled();
      });
    });

    it('should handle creation errors', async () => {
      peopleLib.createPerson = vi.fn().mockRejectedValue(new Error('Database error'));

      const initialEntities = {
        people: [{ name: 'Plato', role: 'author', relationship_type: 'mentions' }],
        events: [],
        theories: [],
        places: [],
      };

      render(
        <EntityReview
          annotationId="ann-1"
          initialEntities={initialEntities}
          onClose={mockOnClose}
        />
      );

      const approveButton = screen.getByText('Create 1 Entity');
      fireEvent.click(approveButton);

      await waitFor(() => {
        expect(screen.getByText('Database error')).toBeInTheDocument();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Modal Interactions', () => {
    it('should close on close button click', () => {
      render(<EntityReview annotationId="ann-1" onClose={mockOnClose} />);

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close on cancel button click', () => {
      render(<EntityReview annotationId="ann-1" onClose={mockOnClose} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close on overlay click', () => {
      render(<EntityReview annotationId="ann-1" onClose={mockOnClose} />);

      const overlay = screen.getByText('Review Entities').closest('.entity-review-overlay');
      fireEvent.click(overlay);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not close on modal content click', () => {
      render(<EntityReview annotationId="ann-1" onClose={mockOnClose} />);

      const modal = screen.getByText('Review Entities').closest('.entity-review-modal');
      fireEvent.click(modal);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
