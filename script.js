

let results =[]
let favorites =[]
let cachedRecipes ={}
let nextPageUrl = null;

const ingredientInput = document.getElementById('ingredient')
const dietDropDown = document.getElementById('diet')
const caloriesFilter = document.getElementById("caloriesFilter");
const servingsFilter = document.getElementById("servingsFilter");
const searchBtn = document.getElementById('searchBtn')
const resultsDiv = document.getElementById('results')
const favoritesDiv = document.getElementById('favorites')

searchBtn.addEventListener('click', () => {
  const ingredient = ingredientInput.value.trim();
  const diet = dietDropDown.value;
  fetchRecipes(ingredient, diet);
});
  function fetchRecipes(ingredient, diet) {
  const queryKey = `${ingredient}_${diet}`;

  // Clear previous results and show loading message
  resultsDiv.innerHTML = "";
  const loadingMessage = document.createElement("p");
  loadingMessage.textContent = "Loading deliciousness...";
  loadingMessage.id = "loading-message";
  resultsDiv.appendChild(loadingMessage);

  // Check cache first
  if (cachedRecipes[queryKey]) {
    results = cachedRecipes[queryKey];
    resetFilters();
    applyFilters();
    loadingMessage.remove(); // Remove loading once done
    return;
  }

  const url = `http://localhost:3000/recipes?ingredient=${ingredient}&diet=${diet}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      results = data.hits.map(hit => hit.recipe);
      nextPageUrl = data._links?.next?.href || null;
      cachedRecipes[queryKey] = results;

      caloriesFilter.value = "";
      servingsFilter.value = "";
      applyFilters();
      loadingMessage.remove(); // Remove loading once done

      if (results.length === 0) {
        resultsDiv.innerHTML = "<p>Sorry, we have no recipes for you :(</p>";
      } else {
        results.forEach(recipe => recipeCard(recipe));
      }
    })
    .catch(err => {
      console.error("Fetch error:", err);
      loadingMessage.remove();
      const errorMessage = document.createElement("p");
      errorMessage.textContent = "Error loading recipes. Please try again later.";
      errorMessage.style.color = "red";
      resultsDiv.appendChild(errorMessage);
    });
}

function recipeCard(recipe) {
  const card = document.createElement("div");
  card.classList.add("recipe"); // apply CSS styling

  // Recipe Image
  const image = document.createElement("img");
  image.src = recipe.images?.THUMBNAIL?.url || recipe.image || "assets/no-image.png";
  image.alt = recipe.label;

  // Recipe Title
  const title = document.createElement("h3");
  title.innerText = recipe.label;

  // Info box
  const infoBox = document.createElement("div");
  infoBox.classList.add("recipe-info");

  // Calories
  const calories = document.createElement("p");
  calories.innerHTML = `<strong>Calories:</strong> ${Math.round(recipe.calories)}`;

  // Servings
  const servings = document.createElement("p");
  servings.innerHTML = `<strong>Servings:</strong> ${recipe.yield}`;

  // Cuisine
  const cuisine = document.createElement("p");
  cuisine.innerHTML = `<strong>Cuisine:</strong> ${recipe.cuisineType?.join(", ") || "N/A"}`;

  // Append info to infoBox
  infoBox.append(calories, servings, cuisine);

  // Footer container for link + save button
  const footer = document.createElement("div");
  footer.classList.add("recipe-footer");


  //link to full recipe
  const link = document.createElement("a");
  link.href = recipe.url;
  link.target = "_blank";
  link.innerText = "View Recipe";
  link.classList.add("recipe-link"); 

  // Save button
  const saveBtn = document.createElement("button");
  saveBtn.innerText = "❤️ Save";
  saveBtn.classList.add("save-btn");
  saveBtn.addEventListener("click", () => {
    if (!favorites.includes(recipe)) {
      favorites.push(recipe);
      renderFavorites(); 
    }
  });

  footer.append(link, saveBtn);

  // Assemble card
  card.append(image, title, infoBox, footer);

  // Add to results div
  resultsDiv.append(card);
}

function renderFavorites() {
  favoritesDiv.innerHTML = ""; // clear previous favorites

  if (favorites.length === 0) {
    favoritesDiv.innerHTML = "<p>No favorite recipes yet.</p>";
    return;
  }

  favorites.forEach(recipe => {
    const card = document.createElement("div");
    card.classList.add("recipe"); // reuse same styling

    // Image
    const image = document.createElement("img");
    image.src = recipe.images?.THUMBNAIL?.url || recipe.image || "assets/no-image.png";
    image.alt = recipe.label;

    // Title
    const title = document.createElement("h3");
    title.innerText = recipe.label;

    // Info box
    const infoBox = document.createElement("div");
    infoBox.classList.add("recipe-info");
    const calories = document.createElement("p");
    calories.innerHTML = `<strong>Calories:</strong> ${Math.round(recipe.calories)}`;
    const servings = document.createElement("p");
    servings.innerHTML = `<strong>Servings:</strong> ${recipe.yield}`;
    const cuisine = document.createElement("p");
    cuisine.innerHTML = `<strong>Cuisine:</strong> ${recipe.cuisineType?.join(", ") || "N/A"}`;
    infoBox.append(calories, servings, cuisine);

    // Footer with link
    const footer = document.createElement("div");
    footer.classList.add("recipe-footer");

    const link = document.createElement("a");
    link.href = recipe.url;
    link.target = "_blank";
    link.innerText = "View Recipe";
    link.classList.add("recipe-link");

    // Remove button
    const removeBtn = document.createElement("button");
    removeBtn.innerText = "🗑 Remove";
    removeBtn.classList.add("save-btn"); // reuse save button style
    removeBtn.addEventListener("click", () => {
      favorites = favorites.filter(fav => fav !== recipe); // remove from array
      renderFavorites(); // re-render
    });

    footer.append(link, removeBtn);

    // Assemble card
    card.append(image, title, infoBox, footer);

    favoritesDiv.append(card);
  });
}
const loadMoreBtn = document.getElementById("loadMoreBtn");
loadMoreBtn.style.display = nextPageUrl ? "block" : "none";
loadMoreBtn.addEventListener("click", () => {
  if (!nextPageUrl) return;

  fetch(nextPageUrl)
    .then(res => res.json())
    .then(data => {
      const newRecipes = data.hits.map(hit => hit.recipe);
      results.push(...newRecipes);
      nextPageUrl = data._links?.next?.href || null;
      applyFilters(); // re-run filters with expanded results
      loadMoreBtn.style.display = nextPageUrl ? "block" : "none";
    })
    .catch(err => console.error("Error loading more recipes:", err));
});


function applyFilters() {
  let filtered = [...results];

  // Calories filter
  const calValue = caloriesFilter.value;
  if (calValue === "under-1000") {
    filtered = filtered.filter(recipe => recipe.calories < 1000);
  } else if (calValue === "1000-1500") {
    filtered = filtered.filter(recipe => recipe.calories >= 1000 &&  recipe.calories <= 1500);
  } else if (calValue === "over-1500") {
    filtered = filtered.filter(recipe => recipe.calories > 1500);
  }

  // Servings filter
  const serveValue = servingsFilter.value;
  if (serveValue) {
    const serveNum = parseInt(serveValue);
    filtered = filtered.filter(recipe => recipe.yield === serveNum);
  }

  // Render filtered results
  resultsDiv.innerHTML = "";
  if (filtered.length === 0) {
    resultsDiv.innerHTML = "<p>No recipes match your filters.</p>";
  } else {
    filtered.forEach(recipe => recipeCard(recipe));
  }
}

// Event listeners for dropdown changes
caloriesFilter.addEventListener("change", applyFilters);
servingsFilter.addEventListener("change", applyFilters);

