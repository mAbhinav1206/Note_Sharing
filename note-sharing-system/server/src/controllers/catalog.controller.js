const Course = require('../models/Course');
const Subject = require('../models/Subject');
const Category = require('../models/Category');
const Note = require('../models/Note');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');

/* ==========================================================
 * Courses
 * ========================================================== */

/** GET /api/v1/courses  (public) - used by every filter dropdown. */
const listCourses = async (_req, res, next) => {
  try {
    const courses = await Course.find().sort({ name: 1 }).lean();
    sendSuccess(res, { courses });
  } catch (err) {
    next(err);
  }
};

/** POST /api/v1/courses  (admin) */
const createCourse = async (req, res, next) => {
  try {
    const { name, code, description } = req.body;
    const exists = await Course.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (exists) throw new AppError('Course already exists', 409);

    const course = await Course.create({ name, code: code || '', description: description || '' });
    sendSuccess(res, { course }, 'Course created', 201);
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/v1/courses/:id  (admin) */
const updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new AppError('Course not found', 404);

    const { name, code, description } = req.body;
    if (name !== undefined) course.name = name;
    if (code !== undefined) course.code = code;
    if (description !== undefined) course.description = description;

    await course.save();
    sendSuccess(res, { course }, 'Course updated');
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/v1/courses/:id  (admin) - blocked if notes still use it. */
const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new AppError('Course not found', 404);

    const inUse = await Note.countDocuments({ course: course._id });
    if (inUse > 0) {
      throw new AppError(`Cannot delete: ${inUse} note(s) still use this course`, 400);
    }
    await Subject.deleteMany({ course: course._id });
    await course.deleteOne();

    sendSuccess(res, null, 'Course deleted');
  } catch (err) {
    next(err);
  }
};

/* ==========================================================
 * Subjects
 * ========================================================== */

/** GET /api/v1/subjects?course=&semester=  (public) */
const listSubjects = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.course) filter.course = req.query.course;
    if (req.query.semester) filter.semester = Number(req.query.semester);

    const subjects = await Subject.find(filter)
      .populate('course', 'name code')
      .sort({ course: 1, semester: 1, name: 1 })
      .lean();

    sendSuccess(res, { subjects });
  } catch (err) {
    next(err);
  }
};

/** POST /api/v1/subjects  (admin) */
const createSubject = async (req, res, next) => {
  try {
    const { name, code, course, semester } = req.body;

    const courseDoc = await Course.findById(course);
    if (!courseDoc) throw new AppError('Course does not exist', 400);

    const exists = await Subject.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') }, course, semester: Number(semester) });
    if (exists) throw new AppError('Subject already exists in this course & semester', 409);

    const subject = await Subject.create({
      name,
      code: code || '',
      course,
      semester: Number(semester),
    });

    const populated = await subject.populate('course', 'name code');
    sendSuccess(res, { subject: populated }, 'Subject created', 201);
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/v1/subjects/:id  (admin) */
const updateSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) throw new AppError('Subject not found', 404);

    const { name, code, course, semester } = req.body;
    if (name !== undefined) subject.name = name;
    if (code !== undefined) subject.code = code;
    if (course !== undefined) subject.course = course;
    if (semester !== undefined) subject.semester = Number(semester);

    await subject.save();
    const populated = await subject.populate('course', 'name code');
    sendSuccess(res, { subject: populated }, 'Subject updated');
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/v1/subjects/:id  (admin) - blocked if notes still use it. */
const deleteSubject = async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) throw new AppError('Subject not found', 404);

    const inUse = await Note.countDocuments({ subject: subject._id });
    if (inUse > 0) throw new AppError(`Cannot delete: ${inUse} note(s) still use this subject`, 400);

    await subject.deleteOne();
    sendSuccess(res, null, 'Subject deleted');
  } catch (err) {
    next(err);
  }
};

/* ==========================================================
 * Categories
 * ========================================================== */

/** GET /api/v1/categories  (public) */
const listCategories = async (_req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();
    sendSuccess(res, { categories });
  } catch (err) {
    next(err);
  }
};

/** POST /api/v1/categories  (admin) */
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const exists = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (exists) throw new AppError('Category already exists', 409);

    const category = await Category.create({ name, description: description || '' });
    sendSuccess(res, { category }, 'Category created', 201);
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/v1/categories/:id  (admin) */
const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) throw new AppError('Category not found', 404);

    const { name, description } = req.body;
    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;

    await category.save();
    sendSuccess(res, { category }, 'Category updated');
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/v1/categories/:id  (admin) - blocked if notes still use it. */
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) throw new AppError('Category not found', 404);

    const inUse = await Note.countDocuments({ category: category._id });
    if (inUse > 0) throw new AppError(`Cannot delete: ${inUse} note(s) still use this category`, 400);

    await category.deleteOne();
    sendSuccess(res, null, 'Category deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
