const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.send('✅ C2Y Backend is running');
});

// Example: Verify Google ID Token (placeholder only)
app.post('/verify', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).send('Missing ID token');

  // TODO: Add actual verification logic if needed
  return res.status(200).send({ message: 'Mock verified', uid: '123', email: 'test@example.com' });
});

// Example route: Save chapters to backend (future feature)
app.post('/save', (req, res) => {
  const { userId, chapters } = req.body;
  if (!userId || !chapters) return res.status(400).send('Invalid payload');

  console.log(`Saving chapters for ${userId}`, chapters);
  res.status(200).send({ message: 'Chapters saved (stub)' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 C2Y backend running at http://localhost:${PORT}`);
});
