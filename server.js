const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const mysql      = require('mysql2');
const mongoose   = require('mongoose');
const path       = require('path');

const app  = express();
const PORT = 3000;

// ── MySQL ──────────────────────────────────────────────────────────────────────
const db = mysql.createPool({
  host: 'localhost', user: 'root', password: '', database: 'campus_placement',
  waitForConnections: true, connectionLimit: 10
}).promise();

db.getConnection()
  .then(c => { console.log('MySQL connected'); c.release(); })
  .catch(e => console.error('MySQL error:', e.message));

// ── MongoDB ────────────────────────────────────────────────────────────────────
mongoose.connect('mongodb://127.0.0.1:27017/campus_placement')
  .then(() => console.log('MongoDB connected'))
  .catch(e  => console.error('MongoDB error:', e.message));

const Application = mongoose.model('Application', new mongoose.Schema({
  student_name:     { type: String, required: true },
  roll_no:          { type: String, required: true },
  company:          { type: String, required: true },
  role:             { type: String, required: true },
  status:           { type: String, default: 'Applied' },
  application_date: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, { timestamps: true }));

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Student Routes ─────────────────────────────────────────────────────────────
app.post('/student/register', async (req, res) => {
  const { name, roll_no, department, cgpa, skills } = req.body;
  if (!name || !roll_no || !department || cgpa === undefined || cgpa === '')
    return res.status(400).json({ success: false, error: 'Name, Roll No, Department and CGPA are required.' });
  const cgpaVal = parseFloat(cgpa);
  if (isNaN(cgpaVal) || cgpaVal < 0 || cgpaVal > 10)
    return res.status(400).json({ success: false, error: 'CGPA must be 0–10.' });
  try {
    const [r] = await db.execute(
      'INSERT INTO students (name, roll_no, department, cgpa, skills) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), roll_no.trim().toUpperCase(), department.trim(), cgpaVal, (skills || '').trim()]
    );
    res.status(201).json({ success: true, message: 'Student registered successfully!', id: r.insertId });
  } catch (e) {
    res.status(e.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ success: false, error: e.code === 'ER_DUP_ENTRY' ? 'Roll No already exists.' : 'Database error.' });
  }
});

app.get('/student/all', async (_req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM students ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, error: 'Database error.' }); }
});

// ── Company Routes ─────────────────────────────────────────────────────────────
app.get('/companies', async (_req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM companies ORDER BY min_cgpa DESC');
    res.json({ success: true, data: rows });
  } catch { res.status(500).json({ success: false, error: 'Database error.' }); }
});

// ── Application Routes ─────────────────────────────────────────────────────────
app.post('/apply', async (req, res) => {
  const { roll_no, company_id } = req.body;
  if (!roll_no || !company_id)
    return res.status(400).json({ success: false, error: 'Roll No and Company are required.' });
  try {
    const [[student]] = await db.execute('SELECT * FROM students WHERE roll_no = ?', [roll_no.trim().toUpperCase()]);
    if (!student) return res.status(404).json({ success: false, error: 'Student not found. Please register first.' });

    const [[company]] = await db.execute('SELECT * FROM companies WHERE id = ?', [company_id]);
    if (!company) return res.status(404).json({ success: false, error: 'Company not found.' });

    if (parseFloat(student.cgpa) < parseFloat(company.min_cgpa))
      return res.status(403).json({ success: false, error: `CGPA too low. Required: ${company.min_cgpa}, Yours: ${student.cgpa}` });

    if (await Application.findOne({ roll_no: student.roll_no, company: company.company_name, role: company.role }))
      return res.status(409).json({ success: false, error: 'Already applied for this position.' });

    const app_ = await new Application({
      student_name: student.name, roll_no: student.roll_no,
      company: company.company_name, role: company.role
    }).save();
    res.status(201).json({ success: true, message: 'Application submitted successfully!', application: app_ });
  } catch { res.status(500).json({ success: false, error: 'Server error.' }); }
});

app.get('/applications', async (_req, res) => {
  try {
    const data = await Application.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch { res.status(500).json({ success: false, error: 'Server error.' }); }
});

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));
