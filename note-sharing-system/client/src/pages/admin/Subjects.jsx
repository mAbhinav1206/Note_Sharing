import { getCourses, getSubjects, createSubject, updateSubject, deleteSubject } from '../../api/catalog';
import { SimpleCrudPage } from './Courses';

/** Admin: subjects (name + course + semester + optional code). */
export default function AdminSubjects() {
  return (
    <SimpleCrudPage
      title="Subjects"
      singular="Subject"
      listFn={getSubjects}
      unwrap={(data) => data.subjects}
      createFn={createSubject}
      updateFn={updateSubject}
      deleteFn={deleteSubject}
      formFields={[
        { key: 'name', label: 'Subject name', type: 'text', required: true, placeholder: 'e.g. DBMS' },
        {
          key: 'course',
          label: 'Course',
          type: 'select',
          required: true,
          options: async () => (await getCourses()).data.courses,
        },
        { key: 'semester', label: 'Semester', type: 'number', required: true, min: 1, max: 10 },
        { key: 'code', label: 'Code (optional)', type: 'text' },
      ]}
    />
  );
}
