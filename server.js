const express = require('express');
const axios = require('axios');

const app = express();

app.use(express.json());

const DIFY_BASE_URL = 'http://localhost';

app.post('/run', async (req, res) => {
  console.log('Received request:', req.body);
  const { apiKeys, input } = req.body;

  if (!apiKeys || !Array.isArray(apiKeys) || apiKeys.length === 0 || !input) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    const results = await Promise.all(apiKeys.map(apiKey => callDifyAPI(apiKey, input)));
    res.json(results);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function callDifyAPI(apiKey, input) {
  console.log('Calling Dify API with key:', apiKey);
  try {
    const response = await axios.post(
      `${DIFY_BASE_URL}/v1/workflows/run`,
      {
        inputs: {
          input: input,
          "sys.files": []
        },
        response_mode: "blocking",
        user: "Auto-API-User"
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error calling Dify API with key ${apiKey}:`, error.message);
    return { error: error.message, apiKey };
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
