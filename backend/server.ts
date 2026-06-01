import express, { Request, Response } from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Types
interface RecipesNextQuery extends Request {
  query: {
    url?: string;
  };
}

interface RecipesQuery extends Request {
  query: {
    ingredient?: string;
    filter?: string;
  };
}

// /recipes
app.get("/recipes", async (req: RecipesQuery, res: Response) => {
  const { ingredient, filter } = req.query;

  console.log("Ingredient:", ingredient);
  console.log("Filter:", filter);

  // Validation
  if (!ingredient) {
    return res
      .status(400)
      .json({ error: "Missing ingredient or filter parameter" });
  }

  // Normalize filter
  const normalize = (str: string) => str.toLowerCase();
  let normalizedFilter: string | null = null;

  if (filter) {
    normalizedFilter = normalize(filter);
    console.log("Normalized Filter:", normalizedFilter);
  } else {
    console.log("No filter selected");
  }

  // Diet types
  const DIET_TYPES = [
    "balanced",
    "high-protein",
    "high-fiber",
    "low-fat",
    "low-carb",
    "low-sodium",
  ];

  // Build filter query
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
    const response = await fetch(url, {
      headers: { "Edamam-Account-User": process.env.App_User || "" },
    });

    const text = await response.text();

    if (response.ok) {
      res.json(JSON.parse(text));
    } else {
      res.status(response.status).json({ error: text });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// /recipes/next
app.get("/recipes/next", async (req: RecipesNextQuery, res: Response) => {
  const nextUrl = req.query.url;

  if (!nextUrl) {
    return res.status(400).json({ error: "Missing next page URL" });
  }

  const decodedUrl = decodeURIComponent(nextUrl);

  try {
    const response = await fetch(decodedUrl, {
      headers: { "Edamam-Account-User": process.env.App_User || "" },
    });

    const text = await response.text();

    if (response.ok) {
      res.json(JSON.parse(text));
    } else {
      res.status(response.status).json({ error: text });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
