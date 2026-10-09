import { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getApiError } from '../../api/client';
import { getCourses } from '../../api/catalog';
import { updateProfile, changePassword, uploadAvatar, avatarUrl } from '../../api/user';

/** Profile: edit name/course/semester, change password, upload avatar. */
export default function Profile() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm();

  const {
    register: pwRegister,
    handleSubmit: pwSubmit,
    reset: pwReset,
    formState: { errors: pwErrors, isSubmitting: pwBusy },
    setError: pwSetError,
  } = useForm();

  useEffect(() => {
    getCourses().then((r) => setCourses(r.data.courses)).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      reset({ name: user.name, course: user.course || '', semester: user.semester ? String(user.semester) : '' });
    }
  }, [user, reset]);

  const onProfile = async (values) => {
    try {
      await updateProfile({
        ...values,
        semester: values.semester ? Number(values.semester) : null,
      });
      await refreshUser();
      toast.success('Profile updated');
    } catch (err) {
      const api = getApiError(err);
      toast.error(api.message);
      api.errors.forEach((e) => setError(e.field, { type: 'server', message: e.message }));
    }
  };

  const onPassword = async (values) => {
    try {
      await changePassword(values);
      pwReset();
      toast.success('Password changed');
    } catch (err) {
      const api = getApiError(err);
      toast.error(api.message);
      api.errors.forEach((e) => pwSetError(e.field, { type: 'server', message: e.message }));
    }
  };

  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG or WEBP images are allowed');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Avatar must be under 2 MB');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await uploadAvatar(formData);
      await refreshUser();
      setAvatarPreview(Date.now()); // bust the browser cache
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setUploading(false);
    }
  };

  if (!user) return null;

  return (
    <Container className="py-4" style={{ maxWidth: 900 }}>
      <h4 className="mb-3">My Profile</h4>
      <Row className="g-3">
        <Col md={4}>
          <Card className="shadow-sm text-center">
            <Card.Body>
              {user.avatar ? (
                <img
                  key={avatarPreview || user._id}
                  src={`${avatarUrl(user._id)}?t=${avatarPreview || ''}`}
                  alt={user.name}
                  className="rounded-circle mb-2"
                  style={{ width: 96, height: 96, objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-2"
                  style={{ width: 96, height: 96, fontSize: 40 }}
                >
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="fw-semibold">{user.name}</div>
              <div className="small text-muted">{user.email}</div>
              <div className="small text-muted mt-1 text-capitalize">Role: {user.role}</div>

              <Form.Label className="btn btn-outline-primary btn-sm mt-3 d-block">
                {uploading ? 'Uploading…' : 'Change photo'}
                <Form.Control type="file" className="d-none" accept="image/jpeg,image/png,image/webp" onChange={onAvatar} disabled={uploading} />
              </Form.Label>
              <div className="small text-muted">JPG / PNG / WEBP, max 2 MB</div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card className="shadow-sm mb-3">
            <Card.Header className="fw-semibold">Account details</Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit(onProfile)} noValidate>
                <Row>
                  <Col sm={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control isInvalid={Boolean(errors.name)} {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Too short' } })} />
                      <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col sm={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Semester</Form.Label>
                      <Form.Select {...register('semester')} isInvalid={Boolean(errors.semester)}>
                        <option value="">Not set</option>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                          <option key={s} value={String(s)}>{s}</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.semester?.message}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Course</Form.Label>
                  <Form.Select {...register('course')} isInvalid={Boolean(errors.course)}>
                    <option value="">Not set</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">{errors.course?.message}</Form.Control.Feedback>
                </Form.Group>

                <div className="small text-muted mb-3">Email: {user.email} (cannot be changed)</div>

                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : 'Save profile'}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          <Card className="shadow-sm">
            <Card.Header className="fw-semibold">Change password</Card.Header>
            <Card.Body>
              <Form onSubmit={pwSubmit(onPassword)} noValidate>
                <Row>
                  <Col sm={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Current password</Form.Label>
                      <Form.Control type="password" isInvalid={Boolean(pwErrors.currentPassword)} {...pwRegister('currentPassword', { required: 'Required' })} />
                      <Form.Control.Feedback type="invalid">{pwErrors.currentPassword?.message}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col sm={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>New password</Form.Label>
                      <Form.Control type="password" isInvalid={Boolean(pwErrors.newPassword)} {...pwRegister('newPassword', { required: 'Required', minLength: { value: 6, message: 'Min 6 characters' } })} />
                      <Form.Control.Feedback type="invalid">{pwErrors.newPassword?.message}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col sm={4} className="d-flex align-items-end">
                    <Button type="submit" variant="outline-primary" size="sm" className="mb-3" disabled={pwBusy}>
                      {pwBusy ? 'Changing…' : 'Change password'}
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
