import express from 'express';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import cors from 'cors';

// reads the .env file and load those values into process.env
dotenv.config();

//app is the object used to define your API, created by calling express.
const app = express();
const PORT = 3000;

//this allows your frontend (5500) to talk to backend (3000)
app.use(cors());

//handle route for get requests
app.get('/recipes', async (req, res) => {
  const ingredient = req.query.ingredient;
  const diet = req.query.diet;
  // Validation check for missing parameters
  if (!ingredient || !diet) {
    console.log(`Validation Error: ingredient="${ingredient}", diet="${diet}"`);
    return res.status(400).json({ error: "Missing ingredient or diet parameter" });
  }

  // construct API request url including diet directly
  const url = `https://api.edamam.com/api/recipes/v2?type=public&q=${ingredient}&diet=${diet}&app_id=${process.env.App_ID}&app_key=${process.env.App_Key}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Edamam-Account-User": process.env.App_User
      }
    });

    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Response body:", text.slice(0, 200));

    if (response.ok) {
      const data = JSON.parse(text);
      res.json(data);
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

  try {
    const response = await fetch(nextUrl, {
      headers: {
        "Edamam-Account-User": process.env.App_User
      }
    });

    const text = await response.text();
    if (response.ok) {
      const data = JSON.parse(text);
      res.json(data);
    } else {
      res.status(response.status).json({ error: text });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


//starts listening on the port
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});