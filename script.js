

let results =[]
let favorites =[]

const ingredientInput = document.getElementById('ingredient')
const dietDropDown = document.getElementById('diet')
const filterBox = document.getElementById('filterBox')
const searchBtn = document.getElementById('searchBtn')
const resultsDiv = document.getElementById('results')
const favoritesDiv = document.getElementById('favorites')

searchBtn.addEventListener('click', () => {
  const url = `http://localhost:3000/recipes?ingredient=${ingredientInput.value}&diet=${dietDropDown.value}`;
  
  fetch(url)
    .then(res => res.json())
    .then(data => {
    resultsDiv.innerHTML= "";

    results = data.hits
    console.log(results)
      if(results.length === 0){
        resultsDiv.innerHTML =" <p>Sorry, we have no recipes for you :(</p>"
      }
      else{
        results.forEach(item => recipeCard(item.recipe))
      } 
    })
    .catch(err => console.error(err));
});


function recipeCard(recipe){
    const resultsDiv = document.getElementById('results')
    const recipeName = document.createElement("p")
    recipeName.innerText=recipe.label
    const image = document.createElement("img")
    image.src = recipe.images.THUMBNAIL.url
    const card = document.createElement("div")
    card.appendChild(recipeName)
    card.appendChild(image)
    return resultsDiv.append(card)
}
 
    