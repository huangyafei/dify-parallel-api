const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
const DIFY_BASE_URL = 'http://localhost';
app.get('/run', async (req, res) => {
  console.log('Received GET request to /process');
  console.log('Query parameters:', req.query);
  const { input, ...apiKeyParams } = req.query;
  if (!input) {
    console.error('Error: No input provided');
    return res.status(400).json({ error: 'No input provided' });
  }
  const apiKeys = Object.values(apiKeyParams).filter(key => key);
  if (apiKeys.length === 0) {
    console.error('Error: No API keys provided');
    return res.status(400).json({ error: 'No API keys provided' });
  }
  console.log('Input:', input);
  console.log('Number of API keys:', apiKeys.length);
  try {
    console.log('Starting parallel Dify API calls');
    const results = await Promise.all(apiKeys.map(apiKey => callDifyAPI(apiKey, input)));
    console.log('All Dify API calls completed');
    
    const formattedResponse = {
      name: 'dify',
      results: results
    };
    
    res.json(formattedResponse);
  } catch (error) {
    console.error('Error in processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
async function callDifyAPI(apiKey, input) {
  console.log(`Calling Dify API with key: ${apiKey.substr(0, 5)}...`);
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
    console.log(`Dify API call successful for key: ${apiKey.substr(0, 5)}...`);
    return {
      workflow_id: response.data.data.workflow_id,
      status: response.data.data.status,
      text: response.data.data.outputs.text
    };
  } catch (error) {
    console.error(`Error calling Dify API with key ${apiKey.substr(0, 5)}...:`, error.message);
    return {
      workflow_id: 'error',
      status: 'failed',
      text: error.message
    };
  }
}
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Params Server is running on port ${PORT}`);
});