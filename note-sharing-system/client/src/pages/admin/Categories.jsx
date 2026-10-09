import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/catalog';
import { SimpleCrudPage } from './Courses';

/** Admin: note categories (Assignment, Notes, Question Paper, …). */
export default function AdminCategories() {
  return (
    <SimpleCrudPage
      title="Categories"
      singular="Category"
      listFn={getCategories}
      unwrap={(data) => data.categories}
      createFn={createCategory}
      updateFn={updateCategory}
      deleteFn={deleteCategory}
      formFields={[
        { key: 'name', label: 'Category name', type: 'text', required: true, placeholder: 'e.g. Question Paper' },
        { key: 'description', label: 'Description (optional)', type: 'text' },
      ]}
    />
  );
}
