// js/main.js

import { loadIngredients, saveIngredients, loadRecipes, saveRecipes, exportBackup, importBackup } from './storageManager.js';
import * as ingredientManager from './ingredientManager.js';
import * as recipeManager from './recipeManager.js';
import * as ui from './uiManager.js';

// ========= ESTADO DA APLICAÇÃO =========
let draggedRecipeId = null;

// ========= INICIALIZAÇÃO DA APLICAÇÃO =========
document.addEventListener('DOMContentLoaded', () => {
    // Carrega os dados salvos e alimenta os módulos
    ingredientManager.setIngredients(loadIngredients());
    recipeManager.setRecipes(loadRecipes());
    
    // Constrói a UI inicial
    ui.rebuildIngredientsTable();
    ui.rebuildSavedRecipes(recipeManager.getRecipes());
    ui.clearRecipeForm();

    // Adiciona os event listeners principais
    setupEventListeners();
});

// ========= CONFIGURAÇÃO DOS EVENT LISTENERS =========
function setupEventListeners() {
    // Abas
    document.querySelector('.tabs').addEventListener('click', (e) => {
        if (e.target.matches('.tab-button')) {
            const tabName = e.target.id.replace('tab-btn-', '');
            ui.openTab(e, tabName);
        }
    });

    // Formulário de Ingredientes
    document.getElementById('ingredient-form').addEventListener('submit', (e) => {
        e.preventDefault();
        ingredientManager.addOrUpdateIngredient(
            document.getElementById('ingredient-id').value,
            document.getElementById('ingredient-name').value,
            parseFloat(document.getElementById('ingredient-price').value),
            parseFloat(document.getElementById('ingredient-quantity').value),
            document.getElementById('ingredient-unit').value
        );
        saveIngredients(ingredientManager.getIngredients());
        ui.rebuildIngredientsTable();
        ui.clearIngredientForm();
        // Atualiza receitas se um ingrediente mudou de preço
        ui.rebuildSavedRecipes(recipeManager.getRecipes());
    });
    
    document.getElementById('ingredientes').addEventListener('click', (e) => {
        const target = e.target;
        if (target.matches('.btn-edit')) {
            ui.populateIngredientForm(target.dataset.id);
        }
        if (target.matches('.btn-delete')) {
            const wasDeleted = ingredientManager.deleteIngredient(target.dataset.id, recipeManager.getRecipes());
            if (wasDeleted) {
                saveIngredients(ingredientManager.getIngredients());
                ui.rebuildIngredientsTable();
            }
        }
        if (target.matches('.btn-secondary')) { // Botão Ordenar A-Z
            ingredientManager.sortIngredients();
            saveIngredients(ingredientManager.getIngredients());
            ui.rebuildIngredientsTable();
        }
    });
    
    // Formulário de Receitas
    document.getElementById('recipe-form').addEventListener('submit', handleSaveRecipe);
    document.querySelector('#receitas .btn-secondary').addEventListener('click', () => {
        const recipeData = ui.getRecipeDataFromForm();
        ui.displayCalculatedPrice(recipeData);
    });
    document.querySelector('#receitas button[onclick="addRecipeIngredientField()"]').addEventListener('click', ui.addRecipeIngredientField);
    
    // Ações nas Receitas Salvas
    document.getElementById('saved-recipes-container').addEventListener('click', handleSavedRecipeActions);

    // Backup
    document.querySelector('.backup-controls .btn-secondary').addEventListener('click', () => exportBackup(ingredientManager.getIngredients(), recipeManager.getRecipes()));
    document.getElementById('import-input').addEventListener('change', handleImportBackup);
}


function handleSaveRecipe(e) {
    e.preventDefault();
    const recipeData = ui.getRecipeDataFromForm();
    if (!recipeData.name || recipeData.ingredients.length === 0) {
        alert("Preencha o nome da receita e adicione ao menos um ingrediente.");
        return;
    }
    recipeManager.addOrUpdateRecipe(recipeData);
    saveRecipes(recipeManager.getRecipes());
    ui.rebuildSavedRecipes(recipeManager.getRecipes());
    ui.clearRecipeForm();
    document.getElementById('tab-btn-receitas-salvas').click();
}

function handleSavedRecipeActions(e) {
    const action = e.target.dataset.action;
    const id = e.target.dataset.id;
    if (!action || !id) return;
    
    e.preventDefault();

    switch (action) {
        case 'toggle-menu':
            toggleActionMenu(e.target);
            break;
        case 'edit-recipe':
            const recipeToEdit = recipeManager.getRecipes().find(r => r.id == id);
            if(recipeToEdit) ui.populateRecipeForm(recipeToEdit);
            break;
        case 'duplicate-recipe':
            recipeManager.duplicateRecipe(id);
            saveRecipes(recipeManager.getRecipes());
            ui.rebuildSavedRecipes(recipeManager.getRecipes());
            break;
        case 'delete-recipe':
            if (recipeManager.deleteRecipe(id)) {
                saveRecipes(recipeManager.getRecipes());
                ui.rebuildSavedRecipes(recipeManager.getRecipes());
            }
            break;
    }
}

async function handleImportBackup(event) {
    try {
        const file = event.target.files[0];
        const importedData = await importBackup(file);
        if (confirm("Importar o backup irá APAGAR os dados atuais. Deseja continuar?")) {
            ingredientManager.setIngredients(importedData.ingredients);
            recipeManager.setRecipes(importedData.savedRecipes);
            saveIngredients(ingredientManager.getIngredients());
            saveRecipes(recipeManager.getRecipes());
            ui.rebuildIngredientsTable();
            ui.rebuildSavedRecipes(recipeManager.getRecipes());
            alert("Backup importado com sucesso!");
        }
    } catch (error) {
        alert(error.message);
    }
}

// ... (as funções de drag and drop podem ficar aqui ou ir para o uiManager, se preferir)