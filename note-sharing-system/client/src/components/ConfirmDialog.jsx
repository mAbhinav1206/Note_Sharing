import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

/** Reusable confirmation dialog (delete actions, admin decisions). */
export default function ConfirmDialog({ show, title, message, confirmLabel = 'Confirm', variant = 'danger', onConfirm, onClose, busy }) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="fs-6">{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant={variant} size="sm" onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
