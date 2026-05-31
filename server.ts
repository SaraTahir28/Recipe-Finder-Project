import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend
app.use(cors());
/*app.use(cors({
  origin: 'https://st-recipefinder.netlify.app/', // replace with your Netlify URL
  methods: 'GET,POST',
}));*/

 app.get('/recipes', async (req, res) => {
  const { ingredient, filter } = req.query;
  console.log("Ingredient:", ingredient);
  console.log("Filter:", filter);

  // Validation
  if (!ingredient) {
    return res.status(400).json({ error: "Missing ingredient or filter parameter" });
  }

  // Normalize filter
const normalize = str => str.toLowerCase();
let normalizedFilter = null;
if (filter) {
  normalizedFilter = normalize(filter);
  console.log("Normalized Filter:", normalizedFilter);
} else {
  console.log("No filter selected");
}
  // Determine if filter is a diet or health type
  const DIET_TYPES = [ "balanced", "high-protein", "high-fiber", "low-fat", "low-carb", "low-sodium" ];
 
// Everything else goes into health type
  let filterQuery = "";

if (normalizedFilter) {
  if (DIET_TYPES.includes(normalizedFilter)) {
    filterQuery = `&diet=${normalizedFilter}`;
  } else {
    filterQuery = `&health=${normalizedFilter}`;
  }
}

  const url = `https://api.edamam.com/api/recipes/v2?type=public&q=${ingredient}${filterQuery}&app_id=${process.env.App_ID}&app_key=${process.env.App_Key}`;
  console.log("Final URL:", url);
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

  if (!nextUrl) {
    return res.status(400).json({ error: "Missing next page URL" });
  }

  // Decode the URL (because frontend encodes it)
  const decodedUrl = decodeURIComponent(nextUrl);

  try {
    const response = await fetch(decodedUrl, { headers: { "Edamam-Account-User": process.env.App_User } });
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
