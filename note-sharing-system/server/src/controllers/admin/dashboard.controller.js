const User = require('../../models/User');
const Note = require('../../models/Note');
const Download = require('../../models/Download');
const Report = require('../../models/Report');
const Rating = require('../../models/Rating');
const { sendSuccess } = require('../../utils/response');

/**
 * GET /api/v1/admin/dashboard   (admin)
 * Everything the admin dashboard needs in ONE request:
 *  - stat cards
 *  - downloads per day (last 14 days, line chart)
 *  - uploads per subject (bar chart)
 *  - notes by status (pie chart)
 *  - top downloaded notes (horizontal bar)
 *  - recent uploads table
 * Uses Mongoose aggregation pipelines (see docs).
 */
const getDashboard = async (_req, res, next) => {
  try {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setHours(0, 0, 0, 0);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);

    const [
      roleCounts,
      statusCounts,
      totalDownloads,
      openReports,
      downloadsPerDay,
      uploadsPerSubject,
      topNotes,
      recentNotes,
      avgRatingStats,
    ] = await Promise.all([
      // Users split by role
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),

      // Notes split by moderation status
      Note.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),

      Download.countDocuments(),

      Report.countDocuments({ status: 'open' }),

      // One row per calendar day -> line chart
      Download.aggregate([
        { $match: { downloadedAt: { $gte: fourteenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$downloadedAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // How many notes each subject has -> bar chart
      Note.aggregate([
        { $group: { _id: '$subject', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
        {
          $lookup: {
            from: 'subjects',
            localField: '_id',
            foreignField: '_id',
            as: 'subject',
          },
        },
        { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            subjectId: '$_id',
            name: { $ifNull: ['$subject.name', 'Unknown'] },
            count: 1,
          },
        },
        { $sort: { count: -1 } },
      ]),

      // 5 most downloaded notes -> horizontal bar
      Note.find({ status: 'approved' })
        .select('title downloadCount avgRating')
        .sort({ downloadCount: -1 })
        .limit(5)
        .lean(),

      // Latest uploads for the activity table
      Note.find()
        .select('title status createdAt downloadCount')
        .populate('uploadedBy', 'name')
        .populate('subject', 'name')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),

      // Overall average of all ratings
      Rating.aggregate([{ $group: { _id: null, avg: { $avg: '$stars' }, count: { $sum: 1 } } }]),
    ]);

    // Turn sparse arrays into easy-to-use objects for the frontend.
    const byRole = Object.fromEntries(roleCounts.map((r) => [r._id, r.count]));
    const byStatus = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]));

    sendSuccess(res, {
      cards: {
        totalStudents: byRole.student || 0,
        totalAdmins: byRole.admin || 0,
        totalNotes:
          (byStatus.pending || 0) + (byStatus.approved || 0) + (byStatus.rejected || 0),
        approvedNotes: byStatus.approved || 0,
        pendingNotes: byStatus.pending || 0,
        rejectedNotes: byStatus.rejected || 0,
        totalDownloads,
        openReports,
        avgRating: avgRatingStats[0] ? Math.round(avgRatingStats[0].avg * 10) / 10 : 0,
        totalRatings: avgRatingStats[0] ? avgRatingStats[0].count : 0,
      },
      charts: {
        downloadsPerDay: downloadsPerDay.map((d) => ({ date: d._id, count: d.count })),
        uploadsPerSubject,
        notesByStatus: [
          { name: 'Approved', value: byStatus.approved || 0 },
          { name: 'Pending', value: byStatus.pending || 0 },
          { name: 'Rejected', value: byStatus.rejected || 0 },
        ],
        topNotes: topNotes.map((n) => ({
          title: n.title,
          downloads: n.downloadCount,
          rating: n.avgRating,
        })),
      },
      recentNotes,
    });
  } catch (err) {
    next(err);
  }
};

/* ==========================================================
 * CSV exports  (GET /api/v1/admin/export/...)
 * ========================================================== */

// Tiny hand-rolled CSV writer (no extra dependency needed).
const toCsv = (rows, headers) => {
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(',')];
  rows.forEach((row) => lines.push(headers.map((h) => escape(row[h])).join(',')));
  return lines.join('\n');
};

const sendCsv = (res, filename, csv) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
};

/** GET /api/v1/admin/export/notes */
const exportNotesCsv = async (_req, res, next) => {
  try {
    const notes = await Note.find()
      .populate('subject', 'name')
      .populate('course', 'name')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const rows = notes.map((n) => ({
      id: n._id,
      title: n.title,
      course: n.course ? n.course.name : '',
      subject: n.subject ? n.subject.name : '',
      semester: n.semester,
      status: n.status,
      downloads: n.downloadCount,
      avgRating: n.avgRating,
      ratingCount: n.ratingCount,
      uploadedBy: n.uploadedBy ? `${n.uploadedBy.name} <${n.uploadedBy.email}>` : '',
      createdAt: n.createdAt.toISOString(),
    }));

    sendCsv(res, 'notes.csv', toCsv(rows, [
      'id', 'title', 'course', 'subject', 'semester', 'status',
      'downloads', 'avgRating', 'ratingCount', 'uploadedBy', 'createdAt',
    ]));
  } catch (err) {
    next(err);
  }
};

/** GET /api/v1/admin/export/users */
const exportUsersCsv = async (_req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    const rows = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      course: u.course,
      semester: u.semester ?? '',
      createdAt: u.createdAt.toISOString(),
    }));

    sendCsv(res, 'users.csv', toCsv(rows, [
      'id', 'name', 'email', 'role', 'status', 'course', 'semester', 'createdAt',
    ]));
  } catch (err) {
    next(err);
  }
};

/** GET /api/v1/admin/export/downloads */
const exportDownloadsCsv = async (_req, res, next) => {
  try {
    const downloads = await Download.find()
      .populate('user', 'name email')
      .populate('note', 'title')
      .sort({ downloadedAt: -1 })
      .limit(5000)
      .lean();

    const rows = downloads.map((d) => ({
      user: d.user ? `${d.user.name} <${d.user.email}>` : 'deleted user',
      note: d.note ? d.note.title : 'deleted note',
      downloadedAt: d.downloadedAt.toISOString(),
    }));

    sendCsv(res, 'downloads.csv', toCsv(rows, ['user', 'note', 'downloadedAt']));
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, exportNotesCsv, exportUsersCsv, exportDownloadsCsv };
