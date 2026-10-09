import { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../api/client';
import { getMyNote, updateNote } from '../../api/notes';
import { getCourses, getSubjects, getCategories } from '../../api/catalog';
import Loader from '../../components/Loader';

/** Edit note metadata (title, description, classification). The file stays as-is. */
export default function EditNote() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [notFound, setNotFound] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();

  const selectedCourse = watch('course');
  const selectedSemester = watch('semester');

  useEffect(() => {
    Promise.all([getMyNote(id), getCourses(), getCategories()])
      .then(([noteRes, courseRes, catRes]) => {
        const n = noteRes.data.note;
        reset({
          title: n.title,
          description: n.description,
          course: n.course?._id || n.course,
          semester: String(n.semester),
          subject: n.subject?._id || n.subject,
          category: n.category?._id || n.category,
        });
        setCourses(courseRes.data.courses);
        setCategories(catRes.data.categories);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, reset]);

  useEffect(() => {
    if (!selectedCourse || !selectedSemester) return;
    getSubjects({ course: selectedCourse, semester: selectedSemester })
      .then((r) => setSubjects(r.data.subjects))
      .catch(() => setSubjects([]));
  }, [selectedCourse, selectedSemester]);

  const onSubmit = async (values) => {
    try {
      await updateNote(id, values);
      toast.success('Note updated - it will be reviewed again by an admin.');
      navigate('/my-notes');
    } catch (err) {
      const api = getApiError(err);
      toast.error(api.message);
      api.errors.forEach((e) => setError(e.field, { type: 'server', message: e.message }));
    }
  };

  if (loading) return <Loader label="Loading note…" />;
  if (notFound) {
    return (
      <Container className="py-5 text-center">
        <h5>Note not found</h5>
        <Button as={Link} to="/my-notes" variant="primary" size="sm">Back to my notes</Button>
      </Container>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: 720 }}>
      <h4 className="mb-3">Edit Note</h4>
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                isInvalid={Boolean(errors.title)}
                {...register('title', { required: 'Title is required', minLength: { value: 3, message: 'At least 3 characters' } })}
              />
              <Form.Control.Feedback type="invalid">{errors.title?.message}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} {...register('description')} />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Course</Form.Label>
                  <Form.Select {...register('course', { required: 'Course is required' })} isInvalid={Boolean(errors.course)}>
                    <option value="">Select</option>
                    {courses.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.course?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Semester</Form.Label>
                  <Form.Select {...register('semester', { required: 'Semester is required' })} isInvalid={Boolean(errors.semester)}>
                    <option value="">Select</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => <option key={s} value={String(s)}>{s}</option>)}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.semester?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject</Form.Label>
                  <Form.Select {...register('subject', { required: 'Subject is required' })} isInvalid={Boolean(errors.subject)}>
                    <option value="">Select</option>
                    {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.subject?.message}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select {...register('category', { required: 'Category is required' })} isInvalid={Boolean(errors.category)}>
                <option value="">Select</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.category?.message}</Form.Control.Feedback>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </Button>
              <Button as={Link} to="/my-notes" variant="outline-secondary">Cancel</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
