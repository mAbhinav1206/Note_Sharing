import { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../api/client';
import { getCourses } from '../../api/catalog';

/** Registration page - creates a student account and logs them in. */
export default function Register() {
  const { register: registerUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [courses, setCourses] = useState([]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: '', email: '', password: '', course: '', semester: '' } });

  useEffect(() => {
    getCourses().then((r) => setCourses(r.data.courses)).catch(() => {});
  }, []);

  const onSubmit = async (values) => {
    setFormError('');
    setServerErrors({});
    try {
      const payload = { ...values, semester: values.semester ? Number(values.semester) : null };
      const user = await registerUser(payload);
      toast.success(`Welcome, ${user.name.split(' ')[0]}! Your account is ready.`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const api = getApiError(err);
      setFormError(api.message);
      // Show field errors from the server under the right inputs.
      api.errors.forEach((e) => setError(e.field, { type: 'server', message: e.message }));
    }
  };

  const fieldError = (name) =>
    errors[name]?.message || serverErrors[name]?.message;

  return (
    <Container className="py-5" style={{ maxWidth: 560 }}>
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <h4 className="mb-3 text-center">Student Registration</h4>

          {formError && <div className="alert alert-danger py-2 small">{formError}</div>}

          <Form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Form.Group className="mb-3">
              <Form.Label>Full name</Form.Label>
              <Form.Control
                isInvalid={Boolean(fieldError('name'))}
                {...register('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                })}
              />
              <Form.Control.Feedback type="invalid">{fieldError('name')}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                isInvalid={Boolean(fieldError('email'))}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
              />
              <Form.Control.Feedback type="invalid">{fieldError('email')}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                isInvalid={Boolean(fieldError('password'))}
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                })}
              />
              <Form.Control.Feedback type="invalid">{fieldError('password')}</Form.Control.Feedback>
            </Form.Group>

            <Row>
              <Col sm={7}>
                <Form.Group className="mb-3">
                  <Form.Label>Course</Form.Label>
                  <Form.Select isInvalid={Boolean(fieldError('course'))} {...register('course')}>
                    <option value="">Select course (optional)</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{fieldError('course')}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col sm={5}>
                <Form.Group className="mb-3">
                  <Form.Label>Semester</Form.Label>
                  <Form.Select isInvalid={Boolean(fieldError('semester'))} {...register('semester')}>
                    <option value="">Select</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{fieldError('semester')}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Button type="submit" variant="primary" className="w-100" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Register'}
            </Button>
          </Form>

          <div className="text-center mt-3 small text-muted">
            Already registered? <Link to="/login">Login here</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
