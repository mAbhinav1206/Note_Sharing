import { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../api/client';
import { getCourses, getSubjects, getCategories } from '../../api/catalog';
import { createNote } from '../../api/notes';
import { MAX_SIZE_LABEL, ALLOWED_LABEL } from '../../utils/uploadConstants';

/**
 * Upload page.
 *  - dependent dropdowns: course -> semester -> subjects
 *  - client-side file checks mirror the server rules (10 MB, whitelist)
 *  - axios onUploadProgress drives the progress bar
 */
export default function Upload() {
  const toast = useToast();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [progress, setProgress] = useState(0);
  const [serverErrors, setServerErrors] = useState({});

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { title: '', description: '', course: '', semester: '', subject: '', category: '' } });

  const selectedCourse = watch('course');
  const selectedSemester = watch('semester');

  useEffect(() => {
    getCourses().then((r) => setCourses(r.data.courses)).catch(() => {});
    getCategories().then((r) => setCategories(r.data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCourse || !selectedSemester) {
      setSubjects([]);
      return;
    }
    getSubjects({ course: selectedCourse, semester: selectedSemester })
      .then((r) => setSubjects(r.data.subjects))
      .catch(() => setSubjects([]));
  }, [selectedCourse, selectedSemester]);

  const onFileChange = (e) => {
    const chosen = e.target.files?.[0];
    setFileError('');
    if (!chosen) {
      setFile(null);
      return;
    }
    // Client-side pre-checks (the server checks again - never trust the client).
    const ext = '.' + chosen.name.split('.').pop().toLowerCase();
    if (!ALLOWED_LABEL.includes(ext)) {
      setFileError(`File type ${ext} is not allowed`);
      setFile(null);
      return;
    }
    if (chosen.size > 10 * 1024 * 1024) {
      setFileError('File is larger than 10 MB');
      setFile(null);
      return;
    }
    setFile(chosen);
  };

  const onSubmit = async (values) => {
    setServerErrors({});
    if (!file) {
      setFileError('Please choose a file to upload');
      return;
    }

    const formData = new FormData();
    Object.entries(values).forEach(([k, v]) => formData.append(k, v));
    formData.append('file', file);

    try {
      const res = await createNote(formData, (event) => {
        if (event.total) setProgress(Math.round((event.loaded * 100) / event.total));
      });
      toast.success(res.message);
      reset();
      setFile(null);
      setProgress(0);
      navigate('/my-notes');
    } catch (err) {
      const api = getApiError(err);
      toast.error(api.message);
      api.errors.forEach((e) => setError(e.field, { type: 'server', message: e.message }));
      setServerErrors(Object.fromEntries(api.errors.map((e) => [e.field, e.message])));
      setProgress(0);
    }
  };

  const fieldError = (name) => errors[name]?.message || serverErrors[name];

  return (
    <Container className="py-4" style={{ maxWidth: 760 }}>
      <h4 className="mb-3">Upload Notes</h4>
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <Form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                placeholder="e.g. DBMS Unit 1 Notes"
                isInvalid={Boolean(fieldError('title'))}
                {...register('title', {
                  required: 'Title is required',
                  minLength: { value: 3, message: 'At least 3 characters' },
                })}
              />
              <Form.Control.Feedback type="invalid">{fieldError('title')}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="What does this note cover?"
                isInvalid={Boolean(fieldError('description'))}
                {...register('description')}
              />
              <Form.Control.Feedback type="invalid">{fieldError('description')}</Form.Control.Feedback>
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Course *</Form.Label>
                  <Form.Select isInvalid={Boolean(fieldError('course'))} {...register('course', { required: 'Course is required' })}>
                    <option value="">Select course</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{fieldError('course')}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Semester *</Form.Label>
                  <Form.Select isInvalid={Boolean(fieldError('semester'))} {...register('semester', { required: 'Semester is required' })}>
                    <option value="">Select</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{fieldError('semester')}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Subject *</Form.Label>
                  <Form.Select isInvalid={Boolean(fieldError('subject'))} {...register('subject', { required: 'Subject is required' })}>
                    <option value="">
                      {selectedCourse && selectedSemester ? 'Select subject' : 'Pick course & semester first'}
                    </option>
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{fieldError('subject')}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Category *</Form.Label>
              <Form.Select isInvalid={Boolean(fieldError('category'))} {...register('category', { required: 'Category is required' })}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{fieldError('category')}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>File * ({ALLOWED_LABEL}, max {MAX_SIZE_LABEL})</Form.Label>
              <Form.Control type="file" onChange={onFileChange} isInvalid={Boolean(fileError)} accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp" />
              <Form.Control.Feedback type="invalid">{fileError}</Form.Control.Feedback>
              {file && (
                <div className="small text-muted mt-1">
                  {file.name} · {(file.size / 1024).toFixed(1)} KB
                </div>
              )}
            </Form.Group>

            {(progress > 0 || isSubmitting) && (
              <div className="mb-3">
                <ProgressBar now={progress} label={`${progress}%`} animated={progress < 100} />
                <div className="small text-muted mt-1">
                  {progress < 100 ? 'Uploading…' : 'Processing…'}
                </div>
              </div>
            )}

            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Uploading…' : 'Upload note'}
            </Button>
            <div className="small text-muted mt-2">
              Your note will appear in search results after an admin approves it.
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
