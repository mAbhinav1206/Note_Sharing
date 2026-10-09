import { useEffect, useState } from 'react';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import useDebounce from '../hooks/useDebounce';
import { getCourses, getSubjects, getCategories } from '../api/catalog';

/**
 * FilterBar - keyword search + course / semester / subject / category / sort.
 *
 *  - the search box is DEBOUNCED (400 ms) before calling the API
 *  - all values live in the URL (parent passes params/setParams)
 *  - subjects reload whenever course or semester changes
 */
export default function FilterBar({ params, setParams, onClear }) {
  const [keyword, setKeyword] = useState(params.keyword || '');
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);

  const debouncedKeyword = useDebounce(keyword, 400);

  // Push the debounced keyword into the URL (this triggers the fetch).
  useEffect(() => {
    if ((params.keyword || '') !== debouncedKeyword) {
      setParams({ keyword: debouncedKeyword });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword]);

  // Keep the input in sync when the URL changes elsewhere (back button).
  useEffect(() => setKeyword(params.keyword || ''), [params.keyword]);

  // Dropdown data (loaded once).
  useEffect(() => {
    getCourses().then((r) => setCourses(r.data.courses)).catch(() => setCourses([]));
    getCategories().then((r) => setCategories(r.data.categories)).catch(() => setCategories([]));
  }, []);

  // Subjects depend on the selected course + semester.
  useEffect(() => {
    const query = {};
    if (params.course) query.course = params.course;
    if (params.semester) query.semester = params.semester;
    getSubjects(query)
      .then((r) => setSubjects(r.data.subjects))
      .catch(() => setSubjects([]));
  }, [params.course, params.semester]);

  const semesters = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="border rounded p-3 bg-light mb-4">
      <Row className="g-2 align-items-end">
        <Col md={4} sm={12}>
          <Form.Label className="small fw-semibold">Search</Form.Label>
          <InputGroup>
            <Form.Control
              placeholder="e.g. Normalization…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              aria-label="Search notes"
            />
            {keyword && (
              <Button variant="outline-secondary" onClick={() => setKeyword('')}>
                ✕
              </Button>
            )}
          </InputGroup>
        </Col>

        <Col md={2} sm={6}>
          <Form.Label className="small fw-semibold">Course</Form.Label>
          <Form.Select
            value={params.course || ''}
            onChange={(e) => setParams({ course: e.target.value, subject: '' })}
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </Form.Select>
        </Col>

        <Col md={2} sm={6}>
          <Form.Label className="small fw-semibold">Semester</Form.Label>
          <Form.Select
            value={params.semester || ''}
            onChange={(e) => setParams({ semester: e.target.value, subject: '' })}
          >
            <option value="">All semesters</option>
            {semesters.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Form.Select>
        </Col>

        <Col md={2} sm={6}>
          <Form.Label className="small fw-semibold">Subject</Form.Label>
          <Form.Select value={params.subject || ''} onChange={(e) => setParams({ subject: e.target.value })}>
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </Form.Select>
        </Col>

        <Col md={2} sm={6}>
          <Form.Label className="small fw-semibold">Category</Form.Label>
          <Form.Select value={params.category || ''} onChange={(e) => setParams({ category: e.target.value })}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      <Row className="g-2 mt-1">
        <Col md={3} sm={6}>
          <Form.Select
            aria-label="Sort by"
            value={params.sort || ''}
            onChange={(e) => setParams({ sort: e.target.value })}
          >
            <option value="">Sort: Newest first</option>
            <option value="downloads">Most downloaded</option>
            <option value="rating">Top rated</option>
            <option value="relevance">Relevance (search)</option>
          </Form.Select>
        </Col>
        <Col md={3} sm={6} className="d-grid">
          <Button variant="outline-secondary" size="sm" onClick={onClear}>
            Clear all filters
          </Button>
        </Col>
      </Row>
    </div>
  );
}
