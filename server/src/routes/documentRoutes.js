import { Router } from 'express';
import { upload, storageProvider } from '../services/storageService.js';
import { authenticateToken, requireDoctorApproved } from '../middleware/auth.js';
import { query } from '../db/database.js';

const router = Router();

// 1. Upload Document (Private Storage)
router.post('/upload', authenticateToken, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please choose a file to upload.' });
    }

    const { doc_type } = req.body;
    if (!doc_type || !['id_proof', 'donation_proof', 'medical_requisition'].includes(doc_type)) {
      // Delete uploaded file if payload validation fails
      await storageProvider.deleteFile(req.file.filename);
      return res.status(400).json({ error: 'Invalid document type. Must be id_proof, donation_proof, or medical_requisition.' });
    }

    // Insert document record (status starts as PENDING)
    const insertRes = await query(
      `INSERT INTO documents (user_id, doc_type, file_name, original_name, mime_type, file_size, storage_path, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [
        req.user.id,
        doc_type,
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        req.file.filename,
      ]
    );

    res.status(201).json({
      success: true,
      document: insertRes.rows[0],
      message: 'Document successfully uploaded and submitted for doctor verification.',
    });
  } catch (err) {
    console.error('Upload handler error:', err);
    res.status(500).json({ error: err.message || 'File upload failed' });
  }
});

// 2. Get User's Documents
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    // Permissions: owner, doctor, or admin
    if (req.user.id !== targetUserId && req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to these documents.' });
    }

    const docsRes = await query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [targetUserId]
    );

    res.json({ documents: docsRes.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. View Document In-App (Authenticated Streaming)
router.get('/:id/view', authenticateToken, async (req, res) => {
  try {
    const docRes = await query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = docRes.rows[0];

    // Verify access
    if (req.user.id !== doc.user_id && req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (!storageProvider.fileExists(doc.file_name)) {
      return res.status(404).json({ error: 'File not found in storage archive.' });
    }

    const stream = await storageProvider.getFileStream(doc.file_name);
    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${doc.original_name}"`);
    stream.pipe(res);
  } catch (err) {
    console.error('File view error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Download Document (Authenticated)
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const docRes = await query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (docRes.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const doc = docRes.rows[0];

    if (req.user.id !== doc.user_id && req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    if (!storageProvider.fileExists(doc.file_name)) {
      return res.status(404).json({ error: 'File not found in storage archive.' });
    }

    const stream = await storageProvider.getFileStream(doc.file_name);
    res.setHeader('Content-Type', doc.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.original_name)}"`);
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Doctor Review: Approve or Reject Document
router.post('/:id/review', authenticateToken, async (req, res) => {
  try {
    // Only approved doctors or admins can review documents
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only doctors or admins can verify documents.' });
    }

    const { status, rejection_reason } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be verified or rejected.' });
    }

    if (status === 'rejected' && (!rejection_reason || rejection_reason.trim().length === 0)) {
      return res.status(400).json({ error: 'Rejection reason is mandatory when rejecting a document.' });
    }

    const updateRes = await query(
      `UPDATE documents
       SET status = $1, rejection_reason = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, status === 'rejected' ? rejection_reason.trim() : null, req.user.id, req.params.id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const updatedDoc = updateRes.rows[0];

    // Check if user has all required documents verified to update overall user status
    if (status === 'verified') {
      const userDocs = await query('SELECT * FROM documents WHERE user_id = $1', [updatedDoc.user_id]);
      const allVerified = userDocs.rows.length > 0 && userDocs.rows.every(d => d.status === 'verified');
      if (allVerified) {
        await query("UPDATE users SET status = 'verified' WHERE id = $1", [updatedDoc.user_id]);
      }
    }

    res.json({
      success: true,
      document: updatedDoc,
      message: `Document marked as ${status}.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

