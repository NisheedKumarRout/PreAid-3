export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { issue } = req.body;

    if (!issue) {
      return res.status(400).json({ error: 'Health issue is required' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const prompt = `You are PreAid, a compassionate AI health assistant. A user is experiencing: "${issue}"

Please provide helpful, empathetic first aid advice following these guidelines:
- Start with empathy and understanding
- Provide clear, actionable steps
- Include when to seek professional help
- Use a warm, caring tone
- Keep advice practical and safe
- End with encouragement

Remember: You're not replacing medical professionals, but providing supportive guidance.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 800,
          topP: 0.8,
          topK: 40
        }
      })
    });

    const data = await response.json();
    const advice = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!advice) {
      throw new Error('No advice generated');
    }

    res.json({ advice });
  } catch (error) {
    console.error('Health advice error:', error);
    res.status(500).json({ error: 'Failed to get health advice. Please try again.' });
  }
}