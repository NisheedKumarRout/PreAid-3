const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

app.post('/api/health-advice', (req, res) => {
  console.log('Health advice request:', req.body);
  const { issue } = req.body;
  
  // Generate detailed response based on issue
  const advice = `I understand you're experiencing: **${issue}**

**Immediate Steps:**
- Stay calm and assess the severity
- Ensure you're in a safe, comfortable position
- Take slow, deep breaths

**Recommended Actions:**
- Apply appropriate first aid measures
- Monitor your symptoms closely
- Stay hydrated with water
- Rest in a comfortable position

**When to Seek Help:**
- If symptoms worsen or persist
- If you experience severe pain
- If you have difficulty breathing
- If you feel dizzy or faint

**Important:** This is AI-generated guidance. For serious concerns or persistent symptoms, please consult a healthcare professional immediately.

*Take care of yourself! 💙*`;
  
  res.json({ advice });
});

app.post('/api/auth', (req, res) => {
  console.log('Auth request:', req.body);
  res.json({ user: { name: 'Test User' }, token: 'test-token' });
});

app.get('/api/history', (req, res) => {
  res.json([]);
});

app.post('/api/history', (req, res) => {
  res.json({ success: true });
});

app.listen(3005, () => {
  console.log('TEST SERVER running on http://localhost:3005');
  console.log('Open your browser to: http://localhost:3005');
});