import { useState } from 'react';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../api/client';

/** Login page - email + password, restores the intended page afterwards. */
export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '' } });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      // Send admins to the admin panel, students to their dashboard.
      const target = location.state?.from || (user.role === 'admin' ? '/admin' : '/dashboard');
      navigate(target, { replace: true });
    } catch (err) {
      const api = getApiError(err);
      setServerError(api.message);
    }
  };

  return (
    <Container className="py-5" style={{ maxWidth: 440 }}>
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <h4 className="mb-3 text-center">Login</h4>

          {serverError && <div className="alert alert-danger py-2 small">{serverError}</div>}

          <Form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="you@college.edu"
                isInvalid={Boolean(errors.email)}
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
              />
              <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="••••••••"
                isInvalid={Boolean(errors.password)}
                {...register('password', { required: 'Password is required' })}
              />
              <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
            </Form.Group>

            <Button type="submit" variant="primary" className="w-100" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in…' : 'Login'}
            </Button>
          </Form>

          <div className="text-center mt-3 small text-muted">
            No account? <Link to="/register">Register here</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
