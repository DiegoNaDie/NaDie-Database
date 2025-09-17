// js/recipeManager.js
import { findIngredientById } from './ingredientManager.js';

let savedRecipes = [];

export function getRecipes() {
    return savedRecipes;
}

export function setRecipes(newRecipes) {
    savedRecipes = newRecipes;
}

export function addOrUpdateRecipe(recipeData) {
    const existingIndex = savedRecipes.findIndex(r => r.id == recipeData.id);
    if (existingIndex > -1) {
        savedRecipes[existingIndex] = recipeData;
    } else {
        savedRecipes.push(recipeData);
    }
}

export function deleteRecipe(id) {
    if (confirm("Tem certeza que deseja apagar esta receita?")) {
        savedRecipes = savedRecipes.filter(r => r.id != id);
        return true;
    }
    return false;
}

export function duplicateRecipe(id) {
    const originalRecipe = savedRecipes.find(r => r.id == id);
    if (!originalRecipe) return;
    const newRecipe = JSON.parse(JSON.stringify(originalRecipe));
    newRecipe.id = Date.now();
    newRecipe.name = `${originalRecipe.name} (cópia)`;
    savedRecipes.push(newRecipe);
}

export function calculatePrice(recipeData) {
    let totalCost = 0;
    recipeData.ingredients.forEach(item => {
        const ingredient = findIngredientById(item.ingredientId);
        if (!ingredient) return;

        let quantityInBaseUnit = item.quantityUsed;
        if (ingredient.unit === 'kg' && item.unitUsed === 'g') quantityInBaseUnit /= 1000;
        else if (ingredient.unit === 'g' && item.unitUsed === 'kg') quantityInBaseUnit *= 1000;
        else if (ingredient.unit === 'l' && item.unitUsed === 'ml') quantityInBaseUnit /= 1000;
        else if (ingredient.unit === 'ml' && item.unitUsed === 'l') quantityInBaseUnit *= 1000;
        
        totalCost += (ingredient.price / ingredient.quantity) * quantityInBaseUnit;
    });

    const costWithTaxes = totalCost * (1 + (recipeData.additionalTax / 100));
    const basePrice = costWithTaxes * (1 + (recipeData.profitMargin / 100));
    let finalPrice = basePrice;
    if (recipeData.perOrderFeePercentage > 0 && recipeData.perOrderFeePercentage < 100) {
        finalPrice = basePrice / (1 - (recipeData.perOrderFeePercentage / 100));
    }
    return { totalCost, finalPrice };
}