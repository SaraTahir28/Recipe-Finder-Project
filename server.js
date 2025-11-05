import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend
app.use(cors({
  origin: 'https://your-netlify-app.netlify.app', // replace with your Netlify URL
  methods: 'GET,POST',
}));

app.get('/recipes', async (req, res) => {
  const { ingredient, diet } = req.query;
  if (!ingredient || !diet) {
    return res.status(400).json({ error: "Missing ingredient or diet parameter" });
  }

  const url = `https://api.edamam.com/api/recipes/v2?type=public&q=${ingredient}&diet=${diet}&app_id=${process.env.App_ID}&app_key=${process.env.App_Key}`;

  try {
    const response = await fetch(url, { headers: { "Edamam-Account-User": process.env.App_User } });
    const text = await response.text();
    if (response.ok) {
      res.json(JSON.parse(text));
    } else {
      res.status(response.status).json({ error: text });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/recipes/next', async (req, res) => {
  const nextUrl = req.query.url;
  if (!nextUrl) return res.status(400).json({ error: "Missing next page URL" });

  try {
    const response = await fetch(nextUrl, { headers: { "Edamam-Account-User": process.env.App_User } });
    const text = await response.text();
    if (response.ok) {
      res.json(JSON.parse(text));
    } else {
      res.status(response.status).json({ error: text });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
