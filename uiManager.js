// js/uiManager.js
import { getIngredients, findIngredientById } from './ingredientManager.js';
import { calculatePrice } from './recipeManager.js';

// Funções de UI Geral
export function openTab(evt, tabName) {
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(tb => tb.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');
}

// Funções de UI de Ingredientes
export function rebuildIngredientsTable() {
    const tableBody = document.getElementById('ingredients-table-body');
    tableBody.innerHTML = '';
    getIngredients().forEach(ing => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${ing.name}</td>
            <td>R$ ${ing.price.toFixed(2)} / ${ing.quantity} ${ing.unit}</td>
            <td class="actions-cell">
                <button type="button" class="btn-edit" data-id="${ing.id}">Editar</button>
                <button type="button" class="btn-delete" data-id="${ing.id}">Apagar</button>
            </td>
        `;
    });
}

export function clearIngredientForm() {
    document.getElementById('ingredient-form').reset();
    document.getElementById('ingredient-id').value = '';
    document.getElementById('ingredient-submit-btn').textContent = "Adicionar Ingrediente";
}

export function populateIngredientForm(id) {
    const ingredient = findIngredientById(id);
    if (!ingredient) return;
    document.getElementById('ingredient-id').value = ingredient.id;
    document.getElementById('ingredient-name').value = ingredient.name;
    document.getElementById('ingredient-price').value = ingredient.price;
    document.getElementById('ingredient-quantity').value = ingredient.quantity;
    document.getElementById('ingredient-unit').value = ingredient.unit;
    document.getElementById('ingredient-submit-btn').textContent = "Atualizar Ingrediente";
    document.getElementById('tab-btn-ingredientes').click();
}

// Funções de UI de Receitas
export function addRecipeIngredientField(ingredientId = '', quantity = '', unit = '') {
    const container = document.getElementById('recipe-ingredients');
    const newField = document.createElement('div');
    newField.className = 'recipe-ingredient-row';
    newField.innerHTML = `
        <select class="ing-select"></select>
        <input type="number" class="ing-qty" placeholder="Qtd." value="${quantity}">
        <select class="ing-unit"></select>
    `;
    container.appendChild(newField);
    const ingSelect = newField.querySelector('.ing-select');
    updateRecipeIngredientDropdowns(ingSelect);
    if (ingredientId) {
        ingSelect.value = ingredientId;
        updateRecipeIngredientUnit(ingSelect);
        newField.querySelector('.ing-unit').value = unit;
    }
}

export function updateRecipeIngredientUnit(selectElement) {
    const unitSelect = selectElement.nextElementSibling.nextElementSibling;
    const selectedId = selectElement.value;
    unitSelect.innerHTML = '';
    if (!selectedId) return;

    const ingredient = findIngredientById(selectedId);
    if (!ingredient) return;

    const options = (ingredient.unit === 'kg' || ingredient.unit === 'g') ? ['g', 'kg'] :
                    (ingredient.unit === 'l' || ingredient.unit === 'ml') ? ['ml', 'l'] :
                    [ingredient.unit];
    
    options.forEach(option => unitSelect.innerHTML += `<option value="${option}">${option}</option>`);
}

function updateRecipeIngredientDropdowns(selectElement) {
    const selectedValue = selectElement.value;
    selectElement.innerHTML = '<option value="">Selecione...</option>';
    getIngredients().forEach(ing => {
        selectElement.innerHTML += `<option value="${ing.id}">${ing.name}</option>`;
    });
    selectElement.value = selectedValue;
}

export function updateAllRecipeIngredientDropdowns() {
    document.querySelectorAll('.ing-select').forEach(updateRecipeIngredientDropdowns);
}

export function getRecipeDataFromForm() {
    // ... (função getRecipeDataFromForm do seu script original)
    let recipeIngredients = [];
    document.querySelectorAll('.recipe-ingredient-row').forEach(row => {
        const ingredientId = row.querySelector('.ing-select').value;
        const quantityUsed = parseFloat(row.querySelector('.ing-qty').value);
        const unitUsed = row.querySelector('.ing-unit').value;
        if (ingredientId && !isNaN(quantityUsed)) {
            recipeIngredients.push({ ingredientId: parseInt(ingredientId), quantityUsed, unitUsed });
        }
    });

    return {
        id: document.getElementById('recipe-id').value ? parseInt(document.getElementById('recipe-id').value) : Date.now(),
        name: document.getElementById('recipe-name').value.trim(),
        yield: parseInt(document.getElementById('recipe-yield').value) || 1,
        ingredients: recipeIngredients,
        profitMargin: parseFloat(document.getElementById('profit-margin').value) || 0,
        additionalTax: parseFloat(document.getElementById('additional-tax').value) || 0,
        perOrderFeePercentage: parseFloat(document.getElementById('per-order-fee-percentage').value) || 0
    };
}

export function displayCalculatedPrice(recipeData) {
    if (recipeData.ingredients.length === 0) {
        document.getElementById('recipe-cost-result').innerHTML = '';
        alert("Adicione pelo menos um ingrediente para calcular.");
        return;
    }
    const { totalCost, finalPrice } = calculatePrice(recipeData);
    const recipeYield = recipeData.yield > 0 ? recipeData.yield : 1;
    const pricePerUnit = finalPrice / recipeYield;

    document.getElementById('recipe-cost-result').innerHTML = `
        <p><strong>Custo Total da Receita:</strong> R$ ${totalCost.toFixed(2)}</p>
        <p><strong>Preço de Venda (Total):</strong> R$ ${finalPrice.toFixed(2)}</p>
        <p><strong>Preço por Unidade (Rendimento ${recipeYield}):</strong> R$ ${pricePerUnit.toFixed(2)}</p>
    `;
}

export function clearRecipeForm(addFirstField = true) {
    document.getElementById('recipe-form').reset();
    document.getElementById('recipe-id').value = '';
    document.getElementById('recipe-form-title').textContent = "Nova Receita";
    document.getElementById('recipe-ingredients').innerHTML = '';
    if (addFirstField) addRecipeIngredientField();
    document.getElementById('recipe-cost-result').innerHTML = '';
    document.getElementById('recipe-submit-btn').textContent = "Salvar Receita";
}

export function rebuildSavedRecipes(recipes) {
    const container = document.getElementById('saved-recipes-container');
    container.innerHTML = recipes.length === 0 ? '<p>Nenhuma receita salva ainda.</p>' : '';
    
    recipes.forEach(recipe => {
        const { totalCost, finalPrice } = calculatePrice(recipe);
        const recipeYield = recipe.yield > 0 ? recipe.yield : 1;
        const pricePerUnit = finalPrice / recipeYield;

        let detailsHtml = `<p><strong>Rendimento:</strong> ${recipeYield} unidades</p><ul>`;
        recipe.ingredients.forEach(item => {
            const ingredient = findIngredientById(item.ingredientId);
            if (ingredient) detailsHtml += `<li>${ingredient.name}: ${item.quantityUsed} ${item.unitUsed}</li>`;
        });
        detailsHtml += '</ul>';
        detailsHtml += `<p><strong>Lucro:</strong> ${recipe.profitMargin}% | <strong>Custos Adic.:</strong> ${recipe.additionalTax}% | <strong>Taxa Pedido:</strong> ${recipe.perOrderFeePercentage}%</p>`;

        const card = document.createElement('div');
        card.className = 'saved-recipe-card';
        card.setAttribute('draggable', true);
        card.dataset.id = recipe.id;
        card.innerHTML = `
            <div class="saved-recipe-card-header">
                <div class="saved-recipe-card-header-title">
                    <h4>${recipe.name}</h4>
                    <small>Venda: R$ ${finalPrice.toFixed(2)} | Unid: R$ ${pricePerUnit.toFixed(2)}</small>
                </div>
                <div class="menu-container">
                    <button type="button" class="menu-button" data-action="toggle-menu">&#8942;</button>
                    <div class="menu-dropdown">
                        <a href="#" data-action="edit-recipe" data-id="${recipe.id}">Editar</a>
                        <a href="#" data-action="duplicate-recipe" data-id="${recipe.id}">Duplicar</a>
                        <a href="#" data-action="delete-recipe" data-id="${recipe.id}">Apagar</a>
                    </div>
                </div>
            </div>
            <div class="recipe-details">${detailsHtml}</div>
        `;
        container.appendChild(card);
    });
}

export function populateRecipeForm(recipe) {
     clearRecipeForm(false);
    
    document.getElementById('recipe-form-title').textContent = "Editando Receita";
    document.getElementById('recipe-id').value = recipe.id;
    document.getElementById('recipe-name').value = recipe.name;
    document.getElementById('recipe-yield').value = recipe.yield;
    document.getElementById('profit-margin').value = recipe.profitMargin;
    document.getElementById('additional-tax').value = recipe.additionalTax;
    document.getElementById('per-order-fee-percentage').value = recipe.perOrderFeePercentage;

    recipe.ingredients.forEach(item => {
        addRecipeIngredientField(item.ingredientId, item.quantityUsed, item.unitUsed);
    });
    
    document.getElementById('recipe-submit-btn').textContent = "Atualizar Receita";
    document.getElementById('tab-btn-receitas').click();
}