const Note = require('../models/Note');
const Rating = require('../models/Rating');
const Download = require('../models/Download');
const Report = require('../models/Report');
const Subject = require('../models/Subject');
const Category = require('../models/Category');
const Course = require('../models/Course');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/response');
const storage = require('../services/storage');

// Fields populated on responses so the client can show names, not ids.
const POPULATE = [
  { path: 'subject', select: 'name code' },
  { path: 'category', select: 'name' },
  { path: 'course', select: 'name' },
  { path: 'uploadedBy', select: 'name email avatar' },
];

/**
 * POST /api/v1/notes   (student, multipart/form-data)
 * 1. verify referenced course/subject/category really exist and match
 * 2. move the uploaded file from tmp -> uploads/notes (random name)
 * 3. create the Note with status "pending" (waiting for admin approval)
 */
const createNote = async (req, res, next) => {
  let savedPath = null;
  try {
    if (!req.file) throw new AppError('Please attach a note file ("file" field)', 400);

    const { title, description, course, subject, category, semester } = req.body;

    // --- integrity checks: everything must exist and belong together ---
    const [courseDoc, subjectDoc, categoryDoc] = await Promise.all([
      Course.findById(course),
      Subject.findById(subject),
      Category.findById(category),
    ]);
    if (!courseDoc) throw new AppError('Selected course does not exist', 400);
    if (!categoryDoc) throw new AppError('Selected category does not exist', 400);
    if (!subjectDoc) throw new AppError('Selected subject does not exist', 400);
    if (subjectDoc.course.toString() !== courseDoc._id.toString()) {
      throw new AppError('Subject does not belong to the selected course', 400);
    }
    if (subjectDoc.semester !== Number(semester)) {
      throw new AppError(`Subject "${subjectDoc.name}" belongs to semester ${subjectDoc.semester}`, 400);
    }

    // --- persist the file through the storage service (S3-ready) ---
    const saved = storage.save(req.file.path, req.file.originalname, 'notes');
    savedPath = saved.path;

    const note = await Note.create({
      title,
      description: description || '',
      course,
      subject,
      category,
      semester: Number(semester),
      uploadedBy: req.user._id,
      file: {
        originalName: req.file.originalname,
        storedName: saved.storedName,
        path: saved.path,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
      status: 'pending',
    });

    const populated = await note.populate(POPULATE);
    sendSuccess(res, { note: populated }, 'Note uploaded. It will be visible after admin approval.', 201);
  } catch (err) {
    // Do not leave an orphan file if the database write failed.
    if (savedPath) storage.remove(savedPath);
    next(err);
  }
};

/**
 * GET /api/v1/notes/mine?page=&limit=&status=   (student)
 * The student's own uploads with approval status.
 */
const getMyNotes = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const filter = { uploadedBy: req.user._id };
    if (['pending', 'approved', 'rejected'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const [notes, total] = await Promise.all([
      Note.find(filter)
        .populate(POPULATE)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Note.countDocuments(filter),
    ]);

    sendSuccess(res, {
      notes,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    next(err);
  }
};

/** Load one note and make sure it belongs to the logged-in student. */
const findOwnNote = async (req) => {
  const note = await Note.findById(req.params.id);
  if (!note) throw new AppError('Note not found', 404);
  if (note.uploadedBy.toString() !== req.user._id.toString()) {
    throw new AppError('You can only modify your own notes', 403);
  }
  return note;
};

/**
 * GET /api/v1/notes/mine/:id   (owner)
 */
const getMyNote = async (req, res, next) => {
  try {
    const note = await findOwnNote(req);
    await note.populate(POPULATE);
    sendSuccess(res, { note });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/notes/:id   (owner only)
 * Updates metadata (title, description, classification).
 * The uploaded file itself is never replaced - upload a new note instead.
 * Editing an approved note sends it back to "pending" for re-review.
 */
const updateNote = async (req, res, next) => {
  try {
    const note = await findOwnNote(req);
    const { title, description, course, subject, category, semester } = req.body;

    if (title !== undefined) note.title = title;
    if (description !== undefined) note.description = description;

    if (course !== undefined) note.course = course;
    if (subject !== undefined) note.subject = subject;
    if (category !== undefined) note.category = category;
    if (semester !== undefined) note.semester = Number(semester);

    // Re-check that subject/course/semester still agree.
    const subjectDoc = await Subject.findById(note.subject);
    if (!subjectDoc) throw new AppError('Selected subject does not exist', 400);
    if (subjectDoc.course.toString() !== note.course.toString()) {
      throw new AppError('Subject does not belong to the selected course', 400);
    }
    if (subjectDoc.semester !== note.semester) {
      throw new AppError(`Subject "${subjectDoc.name}" belongs to semester ${subjectDoc.semester}`, 400);
    }

    // Content changed -> needs a fresh admin review.
    if (note.status === 'approved') {
      note.status = 'pending';
      note.rejectionReason = '';
    }

    await note.save();
    const populated = await note.populate(POPULATE);
    sendSuccess(res, { note: populated }, 'Note updated');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/notes/:id   (owner only)
 * Removes the note, its file on disk, and all related
 * ratings / downloads / reports (keeps the database clean).
 */
const deleteNote = async (req, res, next) => {
  try {
    const note = await findOwnNote(req);

    await Promise.all([
      Rating.deleteMany({ note: note._id }),
      Download.deleteMany({ note: note._id }),
      Report.deleteMany({ note: note._id }),
      note.deleteOne(),
    ]);

    storage.remove(note.file.path); // ignore if already gone
    sendSuccess(res, null, 'Note deleted');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/notes   (public)
 * Browse / search / filter the APPROVED notes.
 *
 * Query parameters:
 *   keyword   - full-text search over title + description ($text index)
 *   course    - course id
 *   subject   - subject id
 *   category  - category id
 *   semester  - number
 *   sort      - newest | downloads | rating | relevance
 *   page/limit- pagination (default 12, max 50)
 */
const browseNotes = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const keyword = (req.query.keyword || req.query.q || '').trim();

    // Only approved notes are public.
    const filter = { status: 'approved' };
    if (keyword) filter.$text = { $search: keyword };
    if (req.query.course) filter.course = req.query.course;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.semester) filter.semester = Number(req.query.semester);

    // Sorting: keyword searches default to relevance, everything else to newest.
    const sortParam = req.query.sort || (keyword ? 'relevance' : 'newest');
    const sorts = {
      newest: { createdAt: -1 },
      downloads: { downloadCount: -1, createdAt: -1 },
      rating: { avgRating: -1, ratingCount: -1, createdAt: -1 },
      relevance: { score: { $meta: 'textScore' } },
    };
    const sort = sorts[sortParam] || sorts.newest;

    let query = Note.find(filter).populate(POPULATE).sort(sort);
    if (sortParam === 'relevance' && keyword) {
      // Attach the text-match score so relevance sorting works.
      query = query.select({ score: { $meta: 'textScore' } });
    }

    const [notes, total] = await Promise.all([
      query.skip((page - 1) * limit).limit(limit).lean(),
      Note.countDocuments(filter),
    ]);

    sendSuccess(res, {
      notes,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      sort: sortParam,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/notes/top?by=downloads|rating&limit=8   (public)
 * Powers the "Most Downloaded" / "Top Rated" pages.
 */
const topNotes = async (req, res, next) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 8));
    const by = req.query.by === 'rating' ? 'rating' : 'downloads';

    const filter = { status: 'approved' };
    // "Top rated" should not list notes that nobody has rated yet.
    if (by === 'rating') filter.ratingCount = { $gt: 0 };

    const sort =
      by === 'rating'
        ? { avgRating: -1, ratingCount: -1, downloadCount: -1 }
        : { downloadCount: -1, createdAt: -1 };

    const notes = await Note.find(filter).populate(POPULATE).sort(sort).limit(limit).lean();
    sendSuccess(res, { notes, by });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/notes/:id   (public, optional login)
 * Full detail for the NoteDetail page.
 * Pending/rejected notes stay hidden unless you are the owner or an admin.
 */
const getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id).populate(POPULATE);
    if (!note) throw new AppError('Note not found', 404);

    const isOwner = req.user && note.uploadedBy._id.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    if (note.status !== 'approved' && !isOwner && !isAdmin) {
      throw new AppError('Note not found', 404); // do not leak hidden notes
    }

    sendSuccess(res, {
      note,
      isOwner: Boolean(isOwner),
      isAdmin: Boolean(isAdmin),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/notes/:id/download   (login required)
 * The ONLY way files leave the server:
 *   1. verify the note is approved (or requester is owner/admin)
 *   2. log the download + increment the counter
 *   3. stream the file as an attachment (never a public URL)
 */
const downloadNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) throw new AppError('Note not found', 404);

    const isOwner = req.user && note.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';
    if (note.status !== 'approved' && !isOwner && !isAdmin) {
      throw new AppError('Note not found', 404);
    }

    if (!storage.exists(note.file.path)) {
      throw new AppError('File is missing on the server. Please contact the admin.', 404);
    }

    // Log the download and keep the counter in sync.
    await Download.create({ user: req.user._id, note: note._id });
    note.downloadCount += 1;
    await note.save();

    // Stream the file with a safe Content-Disposition header.
    res.setHeader('Content-Type', note.file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(note.file.originalName)}"`
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const stream = storage.createReadStream(note.file.path);
    stream.on('error', () => {
      if (!res.headersSent) res.status(404).json({ success: false, data: null, message: 'File could not be read' });
      else res.end();
    });
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createNote,
  getMyNotes,
  getMyNote,
  updateNote,
  deleteNote,
  browseNotes,
  topNotes,
  getNoteById,
  downloadNote,
  POPULATE,
};
