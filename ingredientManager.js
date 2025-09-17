// js/ingredientManager.js

let ingredients = [];

export function getIngredients() {
    return ingredients;
}

export function setIngredients(newIngredients) {
    ingredients = newIngredients;
}

export function findIngredientById(id) {
    return ingredients.find(ing => ing.id == id);
}

export function addOrUpdateIngredient(id, name, price, quantity, unit) {
    const costPerBaseUnit = price / quantity;
    if (id) {
        const index = ingredients.findIndex(ing => ing.id == id);
        if (index > -1) {
            ingredients[index] = { ...ingredients[index], name, price, quantity, unit, costPerBaseUnit };
        }
    } else {
        const newId = Date.now();
        ingredients.push({ id: newId, name, price, quantity, unit, costPerBaseUnit });
    }
}

export function deleteIngredient(id, savedRecipes) {
    const isUsed = savedRecipes.some(recipe => recipe.ingredients.some(item => item.ingredientId == id));
    if (isUsed) {
        alert("Este ingrediente não pode ser apagado pois está sendo usado em uma ou mais receitas salvas.");
        return false;
    }
    if (confirm("Tem certeza que deseja apagar este ingrediente?")) {
        ingredients = ingredients.filter(ing => ing.id != id);
        return true;
    }
    return false;
}

export function sortIngredients() {
    ingredients.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
}