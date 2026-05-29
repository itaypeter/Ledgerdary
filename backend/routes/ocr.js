const express = require('express');
const router = express.Router();
const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getMediaType(mimetype, originalname) {
  if (mimetype === 'application/pdf') return 'application/pdf';
  if (mimetype.startsWith('image/')) return mimetype;
  const ext = (originalname || '').split('.').pop().toLowerCase();
  const map = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  return map[ext] || 'image/jpeg';
}

// ── OCR a bill / document ─────────────────────────────────────────────────────
router.post('/bill', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const mediaType = getMediaType(req.file.mimetype, req.file.originalname);
  const b64 = req.file.buffer.toString('base64');
  const block = mediaType === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } }
    : { type: 'image', source: { type: 'base64', media_type: mediaType, data: b64 } };

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [block, {
          type: 'text',
          text: `Extract from this document. Return ONLY valid JSON, no markdown fences:
{"vendor":"company name","amount":0.00,"currency":"CHF","date":"DD Mon YYYY",
"documentType":"bill|receipt|insurance|contract","taxDeductible":true,
"taxNote":"brief Swiss tax note","summary":"one sentence",
"category":"Health|Transport|Utilities|Phone/Internet|Insurance|Other"}`
        }]
      }]
    });
    const text = msg.content.find(b => b.type === 'text')?.text || '';
    const clean = text.replace(/```json\n?|```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (e) {
    console.error('OCR bill error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── OCR a grocery receipt ─────────────────────────────────────────────────────
router.post('/grocery', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const mediaType = getMediaType(req.file.mimetype, req.file.originalname);
  const b64 = req.file.buffer.toString('base64');
  const block = mediaType === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: b64 } }
    : { type: 'image', source: { type: 'base64', media_type: mediaType, data: b64 } };

  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [block, {
          type: 'text',
          text: `Extract grocery receipt items. Return ONLY valid JSON, no markdown fences:
{"store":"name","date":"DD Mon YYYY","total":0.00,"currency":"CHF",
"items":[{"name":"item","qty":1,"unitPrice":0.00,
"category":"Dairy|Meat|Vegetables|Bakery|Pantry|Beverages|Snacks|Cleaning|Other"}]}`
        }]
      }]
    });
    const text = msg.content.find(b => b.type === 'text')?.text || '';
    const clean = text.replace(/```json\n?|```/g, '').trim();
    res.json(JSON.parse(clean));
  } catch (e) {
    console.error('OCR grocery error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
