import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Test Dialog',
    message: 'Test message',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} isOpen={false} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders dialog when isOpen is true', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('uses default title when not provided', () => {
    const { title: _title, ...propsWithoutTitle } = defaultProps;
    render(<ConfirmDialog {...propsWithoutTitle} />);

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
  });

  it('uses default message when not provided', () => {
    const { message: _message, ...propsWithoutMessage } = defaultProps;
    render(<ConfirmDialog {...propsWithoutMessage} />);

    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('uses default confirm text', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('uses custom confirm text when provided', () => {
    render(<ConfirmDialog {...defaultProps} confirmText="Delete" />);

    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('uses default cancel text', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('uses custom cancel text when provided', () => {
    render(<ConfirmDialog {...defaultProps} cancelText="Go Back" />);

    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('calls onConfirm and onClose when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} onClose={onClose} />);

    const confirmButton = screen.getByText('Confirm');
    await user.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { container } = render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

    const overlay = container.querySelector('.confirm-overlay');
    await user.click(overlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when dialog content is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { container } = render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

    const dialog = container.querySelector('.confirm-dialog');
    await user.click(dialog);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('applies danger variant class', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} variant="danger" />);

    const confirmButton = container.querySelector('.confirm-danger');
    expect(confirmButton).toBeInTheDocument();
  });

  it('applies warning variant class', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} variant="warning" />);

    const confirmButton = container.querySelector('.confirm-warning');
    expect(confirmButton).toBeInTheDocument();
  });

  it('applies primary variant class', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} variant="primary" />);

    const confirmButton = container.querySelector('.confirm-primary');
    expect(confirmButton).toBeInTheDocument();
  });

  it('uses danger variant by default', () => {
    const { container } = render(<ConfirmDialog {...defaultProps} />);

    const confirmButton = container.querySelector('.confirm-danger');
    expect(confirmButton).toBeInTheDocument();
  });

  it('closes on Escape key press', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const { container } = render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

    const overlay = container.querySelector('.confirm-overlay');
    await user.click(overlay); // Focus the overlay
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  it('confirms on Enter key press', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    const { container } = render(
      <ConfirmDialog {...defaultProps} onConfirm={onConfirm} onClose={onClose} />
    );

    const overlay = container.querySelector('.confirm-overlay');
    // Trigger keydown event directly
    overlay.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders with all custom props', () => {
    render(
      <ConfirmDialog
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete User"
        message="This action cannot be undone. Are you sure?"
        confirmText="Delete Forever"
        cancelText="Keep User"
        variant="danger"
      />
    );

    expect(screen.getByText('Delete User')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone. Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('Delete Forever')).toBeInTheDocument();
    expect(screen.getByText('Keep User')).toBeInTheDocument();
  });
});
