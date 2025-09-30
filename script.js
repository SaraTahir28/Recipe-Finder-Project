let results = [] //stores current list of fetched recipes
let favorites = []// stores recipes user has saved.
let cachedRecipes = {} //avoids redundant API calls by storing previous results.
let nextPageUrl = null //tracks pagination for loading more recipes.
let favoritesDiv = null // will create when first favorite is saved


//connect your JavaScript to the HTML elements for user input, filters, and displaying results.
const ingredientInput = document.getElementById('ingredient')
const dietDropDown = document.getElementById('diet')
const caloriesFilter = document.getElementById("caloriesFilter")
const servingsFilter = document.getElementById("servingsFilter")
const searchBtn = document.getElementById('searchBtn')
const resultsDiv = document.getElementById('results')
const loadMoreBtn = document.getElementById("loadMoreBtn");


function applyFilters() {
  let filtered = [...results] //Makes a copy of results to apply filters without modifying the original.

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
  resultsDiv.innerHTML = ""  //Clears previous results and displays filtered ones.
  if (filtered.length === 0) {
    resultsDiv.innerHTML = "<p>No recipes match your filters.</p>"
  } else {
    filtered.forEach(recipe => recipeCard(recipe))
  }
}

searchBtn.addEventListener('click', () => {
  const ingredient = ingredientInput.value.trim() //.trim() → removes any spaces at the beg & end of text.
  const diet = dietDropDown.value
  fetchRecipes(ingredient, diet)
})

function fetchRecipes(ingredient, diet) {
  const queryKey = `${ingredient}_${diet}` //unique key for caching

  resultsDiv.innerHTML = ""
  const loadingMessage = document.createElement("p")
  loadingMessage.textContent = "Loading deliciousness..."
  loadingMessage.id = "loading-message"
  resultsDiv.appendChild(loadingMessage)

  // Check cache first
  if (cachedRecipes[queryKey]) {
    results = cachedRecipes[queryKey]
    applyFilters()
    loadingMessage.remove()
    return
  }

  const url = `http://localhost:3000/recipes?ingredient=${ingredient}&diet=${diet}`//backend API URL

  fetch(url)  //makes an http req to url
    .then(res => res.json()) //.then waits for fetch promise to finish, res is res obj, res.json() reads the body of the response and parses it as JSON.
    .then(data => {  //runs after JSON parsing is done
      results = data.hits.map(hit => hit.recipe) //data.hits [] of results..map goes through each hit and pulls out just the recipe property.results ends up as an array of recipe objects.
      nextPageUrl = data._links?.next?.href || null //f data._links.next.href exists, nextPageUrl will be that string (the URL for the next page of results).
      console.log("First fetch nextPageUrl:", nextPageUrl);
      cachedRecipes[queryKey] = results //cachedRecipes is an object being used like a dictionary/cache.it stores the results array under the key queryKey.

      applyFilters()
      loadingMessage.remove()

      if (results.length === 0) {
        resultsDiv.innerHTML = "<p>Sorry, we have no deliciousness for you :(</p>"
      } else {
        results.forEach(recipe => recipeCard(recipe))
      }
      loadMoreBtn.style.display = nextPageUrl ? "block" : "none";
      // Reset controls after search
      //ingredientInput.value = ""
      //dietDropDown.value = ""
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

function createRecipeCard(recipe, mode = "results") { //recipe obj from API, mode: defaults to "results" if not  (can also be "favorites").
  const card = document.createElement("div")
  card.classList.add("recipe")

  const image = document.createElement("img")
  image.src = recipe.images?.THUMBNAIL?.url || recipe.image
  image.alt = recipe.label //Sets its alt attribute to recipe.label (important for accessibility).

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

  const link = document.createElement("a") // a link element
  link.href = recipe.url  //href is the recipe’s original URL.
  link.target = "_blank"  //target="_blank" opens it in a new tab.
  link.innerText = "View Recipe" //Displays "View Recipe" as text.
  link.classList.add("recipe-link") //assign css class
  footer.appendChild(link) //Puts the link inside the footer.

  const btn = document.createElement("button")
  if (mode === "results") {
    btn.innerText = "❤️ Save"
    btn.classList.add("save-btn")
    btn.addEventListener("click", () => {
      if (!favorites.some(fav => fav.uri === recipe.uri)) { //check if recipe is not already in favs.
        favorites.push(recipe) //if not adds it to favs
        renderFavorites()
      }
    })
  } else if (mode === "favorites") {
    btn.innerText = "🗑 Remove"
    btn.classList.add("save-btn")
    btn.addEventListener("click", () => {
      favorites = favorites.filter(fav => fav.uri !== recipe.uri)//Removes this recipe from favorites using .filter(...).
      renderFavorites() //calls renderfavorites to refresh after filtering.
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
//using both sections and div for better structural design.
function renderFavorites() {
  let favoritesSection = document.getElementById("favorites-section") //A <section> represents a standalone block of related content room for favs
  if (!favoritesSection) {
    favoritesSection = document.createElement("section")
    favoritesSection.id = "favorites-section"

    const heading = document.createElement("h2")
    heading.innerText = "Favorites"

    favoritesDiv = document.createElement("div") //shelf for favs
    favoritesDiv.id = "favorites"
    favoritesDiv.classList.add("recipe-grid")

    favoritesSection.appendChild(heading)
    favoritesSection.appendChild(favoritesDiv)
    const footer = document.getElementById("app-footer");
    document.body.insertBefore(favoritesSection, footer); 
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

loadMoreBtn.addEventListener("click", () => {
  if (!nextPageUrl) return;                    //Stops early if there’s no next page

  const encodedUrl = encodeURIComponent(nextPageUrl); //You can’t pass raw URLs inside query strings,so encoding it
  const proxyUrl = `http://localhost:3000/recipes/next?url=${encodedUrl}`;//talking to server.js

  fetch(proxyUrl)  //fetch returns a Promise that resolves to a Response object.
    .then(res => res.json())  //res.json()  returns a Promise that resolves with the parsed Js {}
    .then(data => {    //receiving the parsed data object.
      const newRecipes = data.hits.map(hit => hit.recipe);//extract recipe object from data hits.
      results.push(...newRecipes); //Uses the spread operator to append all elements of newRecipes into the existing results array in place. Equivalent to results = results.concat(newRecipes) but mutates the original results.
      nextPageUrl = data._links?.next?.href || null; //controls whether there is another page to load.
      console.log("First fetch nextPageUrl:", nextPageUrl);
      applyFilters();
      loadMoreBtn.style.display = nextPageUrl ? "block" : "none";
    })
    .catch(err => console.error("Error loading more recipes:", err));
});

// Footer
const footer = document.createElement("footer")
footer.id = "app-footer"
footer.innerHTML = `
  <p>
    Powered by 
    <a href="https://www.edamam.com/" target="_blank">Edamam API</a>
  </p>
`
document.body.appendChild(footer)

