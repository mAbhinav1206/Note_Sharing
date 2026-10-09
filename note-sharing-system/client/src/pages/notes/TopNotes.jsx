import { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import { getTopNotes } from '../../api/notes';
import { useToast } from '../../context/ToastContext';
import NoteCard from '../../components/NoteCard';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';

/** "Top Notes" - most downloaded and highest rated approved notes. */
export default function TopNotes() {
  const [tab, setTab] = useState('downloads');
  const [notes, setNotes] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    getTopNotes({ by: tab, limit: 12 })
      .then((res) => setNotes(res.data.notes))
      .catch(() => toast.error('Could not load top notes'))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <Container className="py-4">
      <h4 className="mb-1">Top Notes</h4>
      <p className="text-muted">The most loved notes on the platform.</p>

      <Tabs activeKey={tab} onSelect={setTab} className="mb-3">
        <Tab eventKey="downloads" title="⬇ Most Downloaded" />
        <Tab eventKey="rating" title="⭐ Top Rated" />
      </Tabs>

      {loading ? (
        <Loader label="Loading…" />
      ) : !notes || notes.length === 0 ? (
        <EmptyState title="Nothing here yet" message="No rated notes yet - be the first to rate one!" />
      ) : (
        <Row xs={1} sm={2} lg={3} xl={4} className="g-3">
          {notes.map((note) => (
            <Col key={note._id}>
              <NoteCard note={note} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}
