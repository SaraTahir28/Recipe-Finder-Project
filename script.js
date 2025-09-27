

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
    caloriesFilter.value = "";
    servingsFilter.value = "";
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
        resultsDiv.innerHTML = "<p>Sorry, we have no deliciousness for you :(</p>";
      } else {
        results.forEach(recipe => recipeCard(recipe));
      }
    })
    .catch(err => {
      console.error("Fetch error:", err);
      loadingMessage.remove();
      const errorMessage = document.createElement("p");
      errorMessage.textContent = "Error loading delicioiusness. Please try again later.";
      errorMessage.style.color = "red";
      resultsDiv.appendChild(errorMessage);
    });
}
function createRecipeCard(recipe, mode = "results") {
  const card = document.createElement("div");
  card.classList.add("recipe");

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

  // Footer
  const footer = document.createElement("div");
  footer.classList.add("recipe-footer");

  const link = document.createElement("a");
  link.href = recipe.url;
  link.target = "_blank";
  link.innerText = "View Recipe";
  link.classList.add("recipe-link");
  footer.appendChild(link);

  // Mode-specific button
  const btn = document.createElement("button");
  if (mode === "results") {
    btn.innerText = "❤️ Save";
    btn.classList.add("save-btn");
    btn.addEventListener("click", () => {
      if (!favorites.includes(recipe)) {
        favorites.push(recipe);
        renderFavorites();
      }
    });
  } else if (mode === "favorites") {
    btn.innerText = "🗑 Remove";
    btn.classList.add("save-btn");
    btn.addEventListener("click", () => {
      favorites = favorites.filter(fav => fav !== recipe);
      renderFavorites();
    });
  }
  footer.appendChild(btn);

  // Assemble card
  card.append(image, title, infoBox, footer);

  return card;
}
function recipeCard(recipe) {
  const card = createRecipeCard(recipe, "results");
  resultsDiv.append(card);
}

function renderFavorites() {
  favoritesDiv.innerHTML = "";

  if (favorites.length === 0) {
    favoritesDiv.innerHTML = "<p>No favorite recipes yet.</p>";
    return;
  }

  favorites.forEach(recipe => {
    const card = createRecipeCard(recipe, "favorites");
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
// Create footer
const footer = document.createElement("footer");
footer.id = "app-footer"; // so we can style it in CSS

// Add API info
footer.innerHTML = `
  <p>
    Powered by 
    <a href="https://www.edamam.com/" target="_blank">Edamam API</a>
  </p>
`;

// Attach footer to body
document.body.appendChild(footer);

