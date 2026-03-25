// server/index.ts
import express from 'express';
import cors from 'cors';
import { sendVerificationEmail, clearRateLimit, getRateLimitStatus } from '../api/send-verification';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Send verification email endpoint
app.post('/api/auth/send-verification', async (req, res) => {
  try {
    const result = await sendVerificationEmail(req.body);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    });
  }
});

// Debug endpoint: Check rate limit status (development only)
app.get('/api/auth/rate-limit/:email', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  try {
    const { email } = req.params;
    const status = getRateLimitStatus(email);
    res.json({
      email,
      allowed: status.allowed,
      remaining: status.remaining,
      resetAt: new Date(status.resetAt).toISOString(),
      minutesUntilReset: Math.ceil((status.resetAt - Date.now()) / 60000),
    });
  } catch (error) {
    console.error('Rate limit check error:', error);
    res.status(500).json({ error: 'Failed to check rate limit' });
  }
});

// Debug endpoint: Clear rate limit (development only)
app.delete('/api/auth/rate-limit/:email', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  try {
    const { email } = req.params;
    clearRateLimit(email);
    res.json({ 
      success: true, 
      message: `Rate limit cleared for ${email}` 
    });
  } catch (error) {
    console.error('Rate limit clear error:', error);
    res.status(500).json({ error: 'Failed to clear rate limit' });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Debug endpoints enabled: ${process.env.NODE_ENV !== 'production'}`);
});
