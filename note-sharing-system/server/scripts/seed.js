/**
 * ============================================================
 *  npm run seed
 * ------------------------------------------------------------
 *  DELETES everything in the database and recreates demo data:
 *    - 1 admin + 10 students
 *    - Courses: BCA / MCA / BBA (subjects across semesters)
 *    - Categories: Unit Notes, Short Notes, Important Questions,
 *      Previous Papers, Assignments
 *    - ~30 notes with small dummy PDF files in uploads/notes
 *    - Ratings, download logs (spread over the last 14 days),
 *      and a few reports  ->  dashboard charts look alive
 *
 *  Default admin login:  admin@college.edu / admin123
 *  Default student login: student1@college.edu / student123
 * ============================================================
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

const env = require('../src/config/env');
const storage = require('../src/services/storage');

const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Subject = require('../src/models/Subject');
const Category = require('../src/models/Category');
const Note = require('../src/models/Note');
const Rating = require('../src/models/Rating');
const Download = require('../src/models/Download');
const Report = require('../src/models/Report');

/* ---------------- helper data ---------------- */

const COURSES = [
  { name: 'BCA', code: 'BCA', description: 'Bachelor of Computer Applications' },
  { name: 'MCA', code: 'MCA', description: 'Master of Computer Applications' },
  { name: 'BBA', code: 'BBA', description: 'Bachelor of Business Administration' },
];

const SUBJECTS = {
  BCA: [
    { semester: 1, name: 'Programming in C', code: 'BCA-101' },
    { semester: 1, name: 'Mathematics I', code: 'BCA-102' },
    { semester: 2, name: 'Object Oriented Programming', code: 'BCA-201' },
    { semester: 2, name: 'Mathematics II', code: 'BCA-202' },
    { semester: 3, name: 'DBMS', code: 'BCA-301' },
    { semester: 3, name: 'Operating Systems', code: 'BCA-302' },
    { semester: 3, name: 'Web Technologies', code: 'BCA-303' },
    { semester: 4, name: 'Java Programming', code: 'BCA-401' },
    { semester: 4, name: 'Data Structures', code: 'BCA-402' },
    { semester: 5, name: 'Artificial Intelligence', code: 'BCA-501' },
    { semester: 5, name: 'Computer Networks', code: 'BCA-502' },
    { semester: 6, name: 'Cloud Computing', code: 'BCA-601' },
  ],
  MCA: [
    { semester: 1, name: 'Advanced Programming', code: 'MCA-101' },
    { semester: 1, name: 'Discrete Mathematics', code: 'MCA-102' },
    { semester: 2, name: 'Advanced DBMS', code: 'MCA-201' },
    { semester: 2, name: 'Software Engineering', code: 'MCA-202' },
    { semester: 3, name: 'Advanced Java', code: 'MCA-301' },
    { semester: 3, name: 'Computer Networks', code: 'MCA-302' },
    { semester: 4, name: 'Cloud Computing', code: 'MCA-401' },
  ],
  BBA: [
    { semester: 1, name: 'Principles of Management', code: 'BBA-101' },
    { semester: 1, name: 'Business Mathematics', code: 'BBA-102' },
    { semester: 2, name: 'Financial Accounting', code: 'BBA-201' },
    { semester: 2, name: 'Business Communication', code: 'BBA-202' },
    { semester: 3, name: 'Marketing Management', code: 'BBA-301' },
    { semester: 3, name: 'Business Statistics', code: 'BBA-302' },
    { semester: 4, name: 'Human Resource Management', code: 'BBA-401' },
  ],
};

const CATEGORIES = [
  { name: 'Unit Notes', description: 'Complete chapter-wise class notes' },
  { name: 'Short Notes', description: 'Quick revision / summary notes' },
  { name: 'Important Questions', description: 'Exam important questions with answers' },
  { name: 'Previous Papers', description: 'Previous year question papers' },
  { name: 'Assignments', description: 'Semester assignments and submissions' },
];

const STUDENTS = [
  'Aarav Sharma', 'Diya Patel', 'Rohan Gupta', 'Ishita Singh', 'Kabir Verma',
  'Ananya Iyer', 'Aditya Nair', 'Sneha Reddy', 'Arjun Mehta', 'Priya Das',
];

const REVIEWS = [
  'Very useful, thanks for sharing!',
  'Exactly what I needed before the exam.',
  'Well organized and easy to revise.',
  'Some pages are missing but overall good.',
  'Super helpful for last-minute preparation.',
];

const REJECTION_REASONS = [
  'File quality is poor, please upload a clearer scan',
  'Wrong subject - please select the correct subject',
];

/* ---------------- helpers ---------------- */

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Escapes the characters that are special inside a PDF text string.
const escapePdfText = (s) =>
  String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

/**
 * Builds a small but FULLY VALID one-page PDF (with a correct xref table)
 * showing the given title/subtitle. Real PDF bytes so that the files a
 * student downloads actually open in a PDF reader.
 */
const buildPdf = (title, subtitle) => {
  const contentStream = [
    `BT /F1 20 Tf 60 760 Td (${escapePdfText(title)}) Tj ET`,
    `BT /F1 12 Tf 60 730 Td (${escapePdfText(subtitle)}) Tj ET`,
    'BT /F1 12 Tf 60 705 Td (Demo file generated by the NoteShare seed script.) Tj ET',
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(contentStream)} >>\nstream\n${contentStream}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return pdf;
};

// Writes a real (openable) PDF file and returns its storage record.
const writeDummyPdf = (title, subtitle = 'Student Note Sharing System') => {
  const storedName = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}.pdf`;
  const destDir = path.join(storage.UPLOAD_ROOT, 'notes');
  fs.mkdirSync(destDir, { recursive: true });
  const content = buildPdf(title, subtitle);
  fs.writeFileSync(path.join(destDir, storedName), content);
  return {
    originalName: `${title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.pdf`,
    storedName,
    path: `notes/${storedName}`,
    mimeType: 'application/pdf',
    size: Buffer.byteLength(content),
  };
};

/* ---------------- main ---------------- */

(async () => {
  console.log('Seeding database...', env.mongoUri);

  await mongoose.connect(env.mongoUri);

  // 1) Wipe everything (seed is meant to give a clean, predictable demo).
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Subject.deleteMany({}),
    Category.deleteMany({}),
    Note.deleteMany({}),
    Rating.deleteMany({}),
    Download.deleteMany({}),
    Report.deleteMany({}),
  ]);
  // Remove old dummy files too (keep .gitkeep).
  const notesDir = path.join(storage.UPLOAD_ROOT, 'notes');
  fs.mkdirSync(notesDir, { recursive: true });
  fs.readdirSync(notesDir).forEach((f) => {
    if (f !== '.gitkeep') fs.unlinkSync(path.join(notesDir, f));
  });

  // 2) Users
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@college.edu',
    passwordHash: 'admin123',
    role: 'admin',
  });

  const students = [];
  for (let i = 0; i < STUDENTS.length; i++) {
    const name = STUDENTS[i];
    students.push(
      await User.create({
        name,
        email: `student${i + 1}@college.edu`,
        passwordHash: 'student123',
        role: 'student',
        course: i % 4 === 0 ? 'MCA' : 'BCA',
        semester: randomInt(1, 6),
      })
    );
  }
  console.log(`- users: 1 admin + ${students.length} students`);

  // 3) Catalog
  const courses = [];
  for (const c of COURSES) courses.push(await Course.create(c));

  const categories = [];
  for (const c of CATEGORIES) categories.push(await Category.create(c));

  const subjects = [];
  for (const course of courses) {
    for (const s of SUBJECTS[course.name]) {
      subjects.push(
        await Subject.create({ name: s.name, code: s.code, course: course._id, semester: s.semester })
      );
    }
  }
  console.log(`- catalog: ${courses.length} courses, ${subjects.length} subjects, ${categories.length} categories`);

  // 4) Notes (~30) - mix of statuses
  const noteTemplates = [
    (s) => ({ title: `${s.name} Unit 1 Notes`, cat: 0, desc: `Complete unit 1 notes for ${s.name} with diagrams and examples.` }),
    (s) => ({ title: `${s.name} Short Notes`, cat: 1, desc: `Quick revision short notes for ${s.name}.` }),
    (s) => ({ title: `${s.name} Important Questions`, cat: 2, desc: `Important exam questions for ${s.name} with model answers.` }),
    (s) => ({ title: `${s.name} Previous Year Paper`, cat: 3, desc: `Previous year question paper for ${s.name}.` }),
    (s) => ({ title: `${s.name} Assignment`, cat: 4, desc: `Solved assignment for ${s.name}.` }),
  ];

  const notes = [];
  let templateIndex = 0;
  // First pass: one note per subject; second pass tops us up to 30.
  for (let round = 0; notes.length < 30 && round < 2; round++) {
    for (const subject of subjects) {
      if (notes.length >= 30) break;
      const tpl = noteTemplates[templateIndex % noteTemplates.length];
      templateIndex++;
      const t = tpl(subject);

      // Status mix: mostly approved, a few pending / rejected.
      const roll = notes.length % 10;
      const status = roll < 7 ? 'approved' : roll < 9 ? 'pending' : 'rejected';

      const course = courses.find((c) => c._id.toString() === subject.course.toString());
      const uploader = pick(students);

      notes.push(
        await Note.create({
          title: t.title,
          description: t.desc,
          course: course._id,
          subject: subject._id,
          category: categories[t.cat]._id,
          semester: subject.semester,
          uploadedBy: uploader._id,
          file: writeDummyPdf(t.title, t.desc),
          status,
          rejectionReason: status === 'rejected' ? pick(REJECTION_REASONS) : '',
          downloadCount: 0,
        })
      );
    }
  }
  console.log(`- notes: ${notes.length} (approved: ${notes.filter((n) => n.status === 'approved').length}, pending: ${notes.filter((n) => n.status === 'pending').length}, rejected: ${notes.filter((n) => n.status === 'rejected').length})`);

  const approvedNotes = notes.filter((n) => n.status === 'approved');

  // 5) Ratings (1-4 students per approved note, 3-5 stars)
  let ratingCount = 0;
  for (const note of approvedNotes) {
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const raters = shuffled.slice(0, randomInt(1, 4));
    for (const user of raters) {
      await Rating.create({
        user: user._id,
        note: note._id,
        stars: randomInt(3, 5),
        review: Math.random() > 0.4 ? pick(REVIEWS) : '',
      });
      ratingCount++;
    }

    // Recompute the average on the note card.
    const stats = await Rating.aggregate([
      { $match: { note: note._id } },
      { $group: { _id: null, avg: { $avg: '$stars' }, count: { $sum: 1 } } },
    ]);
    note.avgRating = Math.round(stats[0].avg * 10) / 10;
    note.ratingCount = stats[0].count;
    await note.save();
  }
  console.log(`- ratings: ${ratingCount}`);

  // 6) Download history for the last 14 days + matching counters
  let downloadCount = 0;
  for (const note of approvedNotes) {
    const extra = randomInt(2, 30); // "older" downloads not in the log
    for (let d = 0; d < 14; d++) {
      const perDay = Math.random() > 0.65 ? randomInt(1, 3) : 0;
      for (let k = 0; k < perDay; k++) {
        const when = new Date();
        when.setDate(when.getDate() - d);
        when.setHours(randomInt(8, 22), randomInt(0, 59), 0, 0);
        await Download.create({ user: pick(students)._id, note: note._id, downloadedAt: when });
        downloadCount++;
      }
    }
    note.downloadCount = extra + (await Download.countDocuments({ note: note._id }));
    await note.save();
  }
  console.log(`- downloads: ${downloadCount} logged rows`);

  // 7) Reports (a couple open + one already handled)
  if (approvedNotes.length >= 3) {
    await Report.create({
      note: approvedNotes[0]._id,
      reportedBy: students[0]._id,
      reason: 'Copyright violation',
      description: 'This file appears to belong to a coaching institute.',
      status: 'open',
    });
    await Report.create({
      note: approvedNotes[1]._id,
      reportedBy: students[1]._id,
      reason: 'Wrong content',
      description: 'The file content does not match the title.',
      status: 'open',
    });
    await Report.create({
      note: approvedNotes[2]._id,
      reportedBy: students[2]._id,
      reason: 'Spam',
      description: 'Duplicate of an already uploaded file.',
      status: 'dismissed',
      adminComment: 'Reviewed - both files are useful.',
    });
  }
  console.log('- reports: 3 (2 open, 1 dismissed)');

  console.log('\nSeed complete.');
  console.log('  Admin login : admin@college.edu / admin123');
  console.log('  Student log : student1@college.edu / student123');

  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
