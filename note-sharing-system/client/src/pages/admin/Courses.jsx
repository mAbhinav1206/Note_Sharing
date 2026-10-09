import { useEffect, useState, useCallback } from 'react';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../../api/catalog';
import { useToast } from '../../context/ToastContext';
import Loader from '../../components/Loader';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';

/**
 * Generic CRUD page used by Courses, Subjects and Categories so the three
 * admin screens behave exactly the same way.
 *
 * Props
 *  title / singular   - headings
 *  listFn             - GET list  -> envelope { data: { <key>: [...] } }
 *  unwrap             - extracts the array from the envelope
 *  createFn/updateFn/deleteFn
 *  formFields         - describes the create/edit form:
 *      { key, label, type: 'text'|'number'|'select', required, options }
 *      for type 'select', `options` is an async fn returning an array
 *      of { _id, name } choices (loaded once when the page opens).
 */
export function SimpleCrudPage({ title, singular, listFn, unwrap, createFn, updateFn, deleteFn, formFields }) {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [choices, setChoices] = useState({}); // select key -> option list
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    listFn()
      .then((res) => setItems(unwrap(res.data)))
      .catch(() => toast.error('Could not load list'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load dropdown options (e.g. courses for the subject form) once.
  useEffect(() => {
    load();
    formFields
      .filter((f) => f.type === 'select' && f.options)
      .forEach((f) => {
        f.options()
          .then((opts) => setChoices((c) => ({ ...c, [f.key]: opts })))
          .catch(() => {});
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm({});
    setEditId(null);
  };

  const startEdit = (item) => {
    const values = {};
    formFields.forEach((f) => {
      const v = item[f.key];
      // select values are objects in the API response -> keep only the id
      values[f.key] = v && typeof v === 'object' ? v._id : v ?? '';
    });
    setForm(values);
    setEditId(item._id);
  };

  const submit = async (e) => {
    e.preventDefault();
    const missing = formFields.find((f) => f.required && !String(form[f.key] ?? '').trim());
    if (missing) {
      toast.warning(`${missing.label} is required`);
      return;
    }
    setBusy(true);
    try {
      const payload = { ...form };
      // Numbers are sent as numbers so validators like toInt() are happy.
      formFields.forEach((f) => {
        if (f.type === 'number' && payload[f.key] !== '') payload[f.key] = Number(payload[f.key]);
      });
      if (editId) {
        await updateFn(editId, payload);
        toast.success(`${singular} updated`);
      } else {
        await createFn(payload);
        toast.success(`${singular} created`);
      }
      resetForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await deleteFn(toDelete._id);
      toast.success(`${singular} deleted`);
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  };

  const display = (item, key) => {
    const v = item[key];
    if (v && typeof v === 'object') return v.name;
    return v ?? '-';
  };

  return (
    <div>
      <h4 className="mb-3">{title}</h4>

      <Card className="shadow-sm mb-3">
        <Card.Header className="fw-semibold">
          {editId ? `Edit ${singular.toLowerCase()}` : `Add ${singular.toLowerCase()}`}
        </Card.Header>
        <Card.Body>
          <Form onSubmit={submit} className="d-flex gap-2 flex-wrap align-items-end">
            {formFields.map((f) => (
              <Form.Group key={f.key} style={{ minWidth: 180 }}>
                <Form.Label className="small mb-1">
                  {f.label} {f.required && <span className="text-danger">*</span>}
                </Form.Label>

                {f.type === 'select' ? (
                  <Form.Select
                    value={form[f.key] || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  >
                    <option value="">Select…</option>
                    {(choices[f.key] || []).map((opt) => (
                      <option key={opt._id} value={opt._id}>{opt.name}</option>
                    ))}
                  </Form.Select>
                ) : (
                  <Form.Control
                    type={f.type === 'number' ? 'number' : 'text'}
                    min={f.min}
                    max={f.max}
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder || f.label}
                  />
                )}
              </Form.Group>
            ))}

            <Button type="submit" size="sm" disabled={busy}>
              {busy ? 'Saving…' : editId ? 'Update' : 'Create'}
            </Button>
            {editId && (
              <Button type="button" size="sm" variant="outline-secondary" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </Form>
        </Card.Body>
      </Card>

      {loading ? (
        <Loader />
      ) : !items || items.length === 0 ? (
        <EmptyState title={`No ${title.toLowerCase()} yet`} />
      ) : (
        <Card className="shadow-sm">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                {formFields.map((f) => (
                  <th key={f.key}>{f.label}</th>
                ))}
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  {formFields.map((f) => (
                    <td key={f.key} className={f.key === 'name' ? 'fw-semibold' : 'small'}>
                      {display(item, f.key)}
                    </td>
                  ))}
                  <td className="text-end text-nowrap">
                    <Button size="sm" variant="outline-primary" className="me-1" onClick={() => startEdit(item)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => setToDelete(item)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <ConfirmDialog
        show={Boolean(toDelete)}
        title={`Delete ${singular.toLowerCase()}?`}
        message={<>Delete <strong>{toDelete && toDelete.name}</strong>? Notes keep their own copies of the name.</>}
        confirmLabel="Delete"
        busy={busy}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}

/** Admin: courses list + create/edit/delete. */
export default function AdminCourses() {
  return (
    <SimpleCrudPage
      title="Courses"
      singular="Course"
      listFn={getCourses}
      unwrap={(data) => data.courses}
      createFn={createCourse}
      updateFn={updateCourse}
      deleteFn={deleteCourse}
      formFields={[
        { key: 'name', label: 'Course name', type: 'text', required: true, placeholder: 'e.g. BCA' },
        { key: 'code', label: 'Code (optional)', type: 'text', placeholder: 'e.g. BCA-3Y' },
      ]}
    />
  );
}
