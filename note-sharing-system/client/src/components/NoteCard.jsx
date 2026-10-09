import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import { Link } from 'react-router-dom';
import RatingStars from './RatingStars';
import { getFileType, formatBytes, formatDate } from '../utils/format';

/**
 * NoteCard - the reusable grid card showing:
 * title, subject, course/semester, uploader, average rating,
 * download count and a coloured file-type icon.
 */
export default function NoteCard({ note }) {
  const file = getFileType(note.file?.originalName || note.title);

  return (
    <Card className="h-100 shadow-sm note-card hover-shadow">
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <span
            className="rounded d-inline-flex align-items-center justify-content-center text-white fw-bold"
            style={{ width: 44, height: 44, backgroundColor: file.color, fontSize: 11 }}
            title={file.label}
          >
            {file.label}
          </span>
          {note.category?.name && <Badge bg="light" text="dark">{note.category.name}</Badge>}
        </div>

        <Card.Title as="h6" className="mb-1">
          <Link to={`/notes/${note._id}`} className="text-decoration-none">
            {note.title}
          </Link>
        </Card.Title>

        <div className="text-muted small mb-2">
          {note.subject?.name} · Semester {note.semester} · {note.course?.name}
        </div>

        {note.description && (
          <Card.Text className="small text-muted flex-grow-1" style={{ minHeight: 40 }}>
            {note.description.length > 90 ? `${note.description.slice(0, 90)}…` : note.description}
          </Card.Text>
        )}

        <div className="border-top pt-2 mt-2 d-flex justify-content-between align-items-center">
          <div>
            <RatingStars value={note.avgRating || 0} count={note.ratingCount} size="0.95rem" />
            <div className="text-muted" style={{ fontSize: 12 }}>
              ⬇ {note.downloadCount} downloads
            </div>
          </div>
          <div className="text-end text-muted" style={{ fontSize: 12 }}>
            <div>{note.uploadedBy?.name}</div>
            <div>{formatDate(note.createdAt)}</div>
          </div>
        </div>
        <div className="text-muted mt-1" style={{ fontSize: 11 }}>
          {formatBytes(note.file?.size)}
        </div>
      </Card.Body>
    </Card>
  );
}
