// -----------------------------
// Backend URL
// -----------------------------
const backendUrl = "https://recipe-app.hosting.codeyourfuture.io"; // Replace with your Coolify URL

// -----------------------------
// State
// -----------------------------
let results = [] // stores current list of fetched recipes
let favorites = [] // stores recipes user has saved
let cachedRecipes = {} // avoids redundant API calls
let nextPageUrl = null // tracks pagination
let favoritesDiv = null // created when first favorite is saved

// -----------------------------
// DOM Elements
// -----------------------------
const ingredientInput = document.getElementById('ingredient')
const dietDropDown = document.getElementById('diet')
const caloriesFilter = document.getElementById("caloriesFilter")
const servingsFilter = document.getElementById("servingsFilter")
const searchBtn = document.getElementById('searchBtn')
const resultsDiv = document.getElementById('results')
const loadMoreBtn = document.getElementById("loadMoreBtn")

// -----------------------------
// Filters
// -----------------------------
function applyFilters() {
  let filtered = [...results]

  // Calories filter
  const calValue = caloriesFilter.value
  if (calValue === "under-1000") {
    filtered = filtered.filter(recipe => recipe.calories < 1000)
  } else if (calValue === "1000-1500") {
    filtered = filtered.filter(recipe => recipe.calories >= 1000 && recipe.calories <= 1500)
  } else if (calValue === "over-1500") {
    filtered = filtered.filter(recipe => recipe.calories > 1500)
  }

  // Servings filter
  const serveValue = servingsFilter.value
  if (serveValue) {
    const serveNum = parseInt(serveValue)
    filtered = filtered.filter(recipe => recipe.yield === serveNum)
  }

  // Render filtered results
  resultsDiv.innerHTML = ""
  if (filtered.length === 0) {
    resultsDiv.innerHTML = "<p>No recipes match your filters.</p>"
  } else {
    filtered.forEach(recipe => recipeCard(recipe))
  }
}

// -----------------------------
// Search Button
// -----------------------------
searchBtn.addEventListener('click', () => {
  const ingredient = ingredientInput.value.trim()
  const diet = dietDropDown.value
  fetchRecipes(ingredient, diet)
})

// -----------------------------
// Fetch Recipes
// -----------------------------
function fetchRecipes(ingredient, diet) {
  const queryKey = `${ingredient}_${diet}`
  resultsDiv.innerHTML = ""
  const loadingMessage = document.createElement("p")
  loadingMessage.textContent = "Loading deliciousness..."
  loadingMessage.id = "loading-message"
  resultsDiv.appendChild(loadingMessage)

  // Check cache
  if (cachedRecipes[queryKey]) {
    results = cachedRecipes[queryKey]
    applyFilters()
    loadingMessage.remove()
    return
  }

  const url = `${backendUrl}/recipes?ingredient=${ingredient}&diet=${diet}` // UPDATED

  fetch(url)
    .then(res => res.json())
    .then(data => {
      results = data.hits.map(hit => hit.recipe)
      nextPageUrl = data._links?.next?.href || null
      cachedRecipes[queryKey] = results

      applyFilters()
      loadingMessage.remove()

      if (results.length === 0) {
        resultsDiv.innerHTML = "<p>Sorry, we have no deliciousness for you :(</p>"
      }

      loadMoreBtn.style.display = nextPageUrl ? "block" : "none"
      caloriesFilter.value = ""
      servingsFilter.value = ""
    })
    .catch(err => {
      console.error("Fetch error:", err)
      loadingMessage.remove()
      const errorMessage = document.createElement("p")
      errorMessage.textContent = "Error loading deliciousness. Please try again later."
      errorMessage.style.color = "red"
      resultsDiv.appendChild(errorMessage)
    })
}

// -----------------------------
// Create Recipe Card
// -----------------------------
function createRecipeCard(recipe, mode = "results") {
  const card = document.createElement("div")
  card.classList.add("recipe")

  const image = document.createElement("img")
  image.src = recipe.images?.THUMBNAIL?.url || recipe.image
  image.alt = recipe.label

  const title = document.createElement("h3")
  title.innerText = recipe.label

  const infoBox = document.createElement("div")
  infoBox.classList.add("recipe-info")

  const calories = document.createElement("p")
  calories.innerHTML = `<strong>Calories:</strong> ${Math.round(recipe.calories)}`
  const servings = document.createElement("p")
  servings.innerHTML = `<strong>Servings:</strong> ${recipe.yield}`
  const cuisine = document.createElement("p")
  cuisine.innerHTML = `<strong>Cuisine:</strong> ${recipe.cuisineType?.join(", ") || "N/A"}`
  infoBox.append(calories, servings, cuisine)

  const footer = document.createElement("div")
  footer.classList.add("recipe-footer")

  const link = document.createElement("a")
  link.href = recipe.url
  link.target = "_blank"
  link.innerText = "View Recipe"
  link.classList.add("recipe-link")
  footer.appendChild(link)

  const btn = document.createElement("button")
  if (mode === "results") {
    btn.innerText = "❤️ Save"
    btn.classList.add("save-btn")
    btn.addEventListener("click", () => {
      if (!favorites.some(fav => fav.uri === recipe.uri)) {
        favorites.push(recipe)
        renderFavorites()
      }
    })
  } else if (mode === "favorites") {
    btn.innerText = "🗑 Remove"
    btn.classList.add("save-btn")
    btn.addEventListener("click", () => {
      favorites = favorites.filter(fav => fav.uri !== recipe.uri)
      renderFavorites()
    })
  }
  footer.appendChild(btn)

  card.append(image, title, infoBox, footer)
  return card
}

function recipeCard(recipe) {
  const card = createRecipeCard(recipe, "results")
  resultsDiv.append(card)
}

// -----------------------------
// Render Favorites
// -----------------------------
function renderFavorites() {
  let favoritesSection = document.getElementById("favorites-section")
  if (!favoritesSection) {
    favoritesSection = document.createElement("section")
    favoritesSection.id = "favorites-section"

    const heading = document.createElement("h2")
    heading.innerText = "Favorites"

    favoritesDiv = document.createElement("div")
    favoritesDiv.id = "favorites"
    favoritesDiv.classList.add("recipe-grid")

    favoritesSection.appendChild(heading)
    favoritesSection.appendChild(favoritesDiv)

    const footer = document.getElementById("app-footer")
    document.body.insertBefore(favoritesSection, footer)
  }

  favoritesDiv.innerHTML = ""
  if (favorites.length === 0) {
    favoritesDiv.innerHTML = "<p>No favorite recipes yet.</p>"
    return
  }

  favorites.forEach(recipe => {
    const card = createRecipeCard(recipe, "favorites")
    favoritesDiv.append(card)
  })
}

// -----------------------------
// Load More Recipes
// -----------------------------
loadMoreBtn.addEventListener("click", () => {
  if (!nextPageUrl) return

  const encodedUrl = encodeURIComponent(nextPageUrl)
  const proxyUrl = `${backendUrl}/recipes/next?url=${encodedUrl}` // UPDATED

  fetch(proxyUrl)
    .then(res => res.json())
    .then(data => {
      const newRecipes = data.hits.map(hit => hit.recipe)
      results.push(...newRecipes)
      nextPageUrl = data._links?.next?.href || null
      applyFilters()
      loadMoreBtn.style.display = nextPageUrl ? "block" : "none"
    })
    .catch(err => console.error("Error loading more recipes:", err))
})

// -----------------------------
// Footer
// -----------------------------
const footer = document.createElement("footer")
footer.id = "app-footer"
footer.innerHTML = `
  <p>
    Powered by 
    <a href="https://www.edamam.com/" target="_blank">Edamam API</a>
  </p>
`
document.body.appendChild(footer)
