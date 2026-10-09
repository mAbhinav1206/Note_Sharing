import { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { browseNotes } from '../../api/notes';
import { useToast } from '../../context/ToastContext';
import FilterBar from '../../components/FilterBar';
import NoteCard from '../../components/NoteCard';
import Pagination from '../../components/Pagination';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import useQueryParams from '../../hooks/useQueryParams';

/**
 * Browse page - the main search screen.
 * Filters live in the URL (?keyword=...&course=...), so results are
 * shareable and the back button works as users expect.
 */
export default function Browse() {
  const { params, setParams, clearParams } = useQueryParams();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch whenever ANY URL filter changes.
  useEffect(() => {
    let active = true;
    setLoading(true);
    browseNotes({ ...params, limit: 12 })
      .then((res) => active && setData(res.data))
      .catch(() => active && toast.error('Could not load notes'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
        <div>
          <h4 className="mb-0">Browse Notes</h4>
          <small className="text-muted">Approved notes from every course</small>
        </div>
      </div>

      <FilterBar params={params} setParams={setParams} onClear={clearParams} />

      {loading ? (
        <Loader label="Searching notes…" />
      ) : !data || data.notes.length === 0 ? (
        <EmptyState
          title="No notes match your filters"
          message="Try a different keyword or clear some filters."
          actionLabel="Clear filters"
          onAction={clearParams}
        />
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <small className="text-muted">
              {data.pagination.total} note{data.pagination.total === 1 ? '' : 's'} found
              {params.keyword && <> for “{params.keyword}”</>}
            </small>
          </div>
          <Row xs={1} sm={2} lg={3} xl={4} className="g-3">
            {data.notes.map((note) => (
              <Col key={note._id}>
                <NoteCard note={note} />
              </Col>
            ))}
          </Row>
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            onChange={(page) => {
              setParams({ page });
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>
      )}
    </Container>
  );
}
