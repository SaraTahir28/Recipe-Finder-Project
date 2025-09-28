import express from 'express'; //A web-framework for Node.js to build APIs and handle HTTP req
import dotenv from 'dotenv';//Loads env variables from a .env file into process.env
import fetch from 'node-fetch';//Lets you make HTTP requests e.g calling the Edamam API
import cors from 'cors'; //Enables Cross-Origin Resource Sharing, allowing your FE  to access your BE on diff ports


dotenv.config();//Loads .env file to use process.env.App_ID, process.env.App_Key.

//Initialise express app
const app = express(); //setting express app instance
const PORT = 3000; //setting port your server will listen on

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

  // construct API request url including diet and ingredient & credentials
  const url = `https://api.edamam.com/api/recipes/v2?type=public&q=${ingredient}&diet=${diet}&app_id=${process.env.App_ID}&app_key=${process.env.App_Key}`;

  try {
    const response = await fetch(url, {
      headers: {
        "Edamam-Account-User": process.env.App_User//custom header for acc identification.
      }
    });

    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Response body:", text.slice(0, 200));

    if (response.ok) {   //if the res is ok, sends the parsed JSON back to the frontend.
      const data = JSON.parse(text);
      res.json(data);
    } else {
      res.status(response.status).json({ error: text });//If not, returns the error status and message.
    }
  } catch (error) {
    res.status(500).json({ error: error.message });//Catches any unexpected errors and returns a 500 server error.
  }
});
//Handles requests for the next page of recipes using a url query parameter.
app.get('/recipes/next', async (req, res) => {
  const nextUrl = req.query.url;

  if (!nextUrl) {
    return res.status(400).json({ error: "Missing next page URL" });//Validates that the url parameter is provided.
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


//Starts the server and logs the URL so you know it's running.
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});