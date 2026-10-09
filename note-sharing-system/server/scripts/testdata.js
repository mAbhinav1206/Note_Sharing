/**
 * Quick test-data helper (NOT the official seed - that is scripts/seed.js).
 * Creates the example notes from the project spec so browse/search can be
 * verified:  BCA -> 3rd Semester -> DBMS -> "Normalization"
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

require('../src/models/User');
require('../src/models/Course');
require('../src/models/Subject');
require('../src/models/Category');
require('../src/models/Note');

const Note = mongoose.model('Note');
const Course = mongoose.model('Course');
const Subject = mongoose.model('Subject');
const Category = mongoose.model('Category');
const User = mongoose.model('User');

const dummyPdf = (title) =>
  `%PDF-1.4\n% dummy notes file for testing: ${title}\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n`;

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const course = await Course.findOne({ name: 'BCA' });
  const subject = await Subject.findOne({ name: 'DBMS', course: course._id });
  const catUnit = await Category.findOne({ name: 'Unit Notes' });
  const catShort = await Category.findOne({ name: 'Short Notes' });
  const catImp = await Category.findOne({ name: 'Important Questions' });
  const student = await User.findOne({ email: 'student1@test.com' });

  const notes = [
    { title: 'DBMS Unit 1 Notes', description: 'ER model, relational algebra and SQL basics. Includes Normalization examples.', category: catUnit._id, downloads: 42 },
    { title: 'Normalization Short Notes', description: '1NF, 2NF, 3NF, BCNF quick revision notes with normalization examples.', category: catShort._id, downloads: 75 },
    { title: 'DBMS Important Questions', description: 'Important questions on normalization, transactions and indexing.', category: catImp._id, downloads: 30 },
    { title: 'OS Unit 2 Notes', description: 'Process scheduling and CPU scheduling algorithms.', category: catUnit._id, subjectName: 'OS', downloads: 10 },
  ];

  const dir = path.join(__dirname, '..', 'uploads', 'notes');
  fs.mkdirSync(dir, { recursive: true });

  for (const n of notes) {
    const subj = n.subjectName ? await Subject.findOne({ name: n.subjectName, course: course._id }) : subject;
    const storedName = `${Date.now()}_test_${n.title.replace(/\W+/g, '_')}.pdf`;
    fs.writeFileSync(path.join(dir, storedName), dummyPdf(n.title));

    const doc = await Note.findOneAndUpdate(
      { title: n.title },
      {
        title: n.title,
        description: n.description,
        course: course._id,
        subject: subj._id,
        category: n.category,
        semester: subj.semester,
        uploadedBy: student._id,
        file: {
          originalName: `${n.title}.pdf`,
          storedName,
          path: `notes/${storedName}`,
          mimeType: 'application/pdf',
          size: fs.statSync(path.join(dir, storedName)).size,
        },
        status: 'approved',
        downloadCount: n.downloads,
      },
      { upsert: true, new: true }
    );
    console.log('created:', doc.title, '-', doc._id);
  }

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
