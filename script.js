// ========= ESTADO DA APLICAÇÃO =========
let ingredients = [];
let savedRecipes = [];
let draggedRecipeId = null;

// ========= FUNÇÕES DE NAVEGAÇÃO E UI =========
function openTab(evt, tabName) {
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(tb => tb.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');
}

function toggleRecipeDetails(cardElement) {
    const details = cardElement.querySelector('.recipe-details');
    details.style.display = details.style.display === 'block' ? 'none' : 'block';
}

function toggleActionMenu(button) {
    const dropdown = button.nextElementSibling;
    const isVisible = dropdown.style.display === 'block';
    // Fecha todos os menus antes de abrir o novo
    document.querySelectorAll('.menu-dropdown').forEach(d => d.style.display = 'none');
    if (!isVisible) {
        dropdown.style.display = 'block';
    }
}

// Fecha o menu de ações se clicar fora dele
window.onclick = function(event) {
    if (!event.target.matches('.menu-button')) {
        document.querySelectorAll('.menu-dropdown').forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    }
}

// ========= FUNÇÕES DE GERENCIAMENTO DE INGREDIENTES =========
function sortIngredients() {
    ingredients.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
    rebuildIngredientsTable();
    saveIngredients();
}

function addOrUpdateIngredient() {
    const id = document.getElementById('ingredient-id').value;
    const name = document.getElementById('ingredient-name').value.trim();
    const price = parseFloat(document.getElementById('ingredient-price').value);
    const quantity = parseFloat(document.getElementById('ingredient-quantity').value);
    const unit = document.getElementById('ingredient-unit').value;

    if (!name || isNaN(price) || isNaN(quantity)) {
        alert('Por favor, preencha todos os campos do ingrediente.');
        return;
    }

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
    
    saveIngredients();
    rebuildIngredientsTable();
    updateAllSavedRecipes();
    clearIngredientForm();
}

function editIngredient(id) {
    const ingredient = ingredients.find(ing => ing.id == id);
    if (!ingredient) return;
    document.getElementById('ingredient-id').value = ingredient.id;
    document.getElementById('ingredient-name').value = ingredient.name;
    document.getElementById('ingredient-price').value = ingredient.price;
    document.getElementById('ingredient-quantity').value = ingredient.quantity;
    document.getElementById('ingredient-unit').value = ingredient.unit;
    document.getElementById('ingredient-submit-btn').textContent = "Atualizar Ingrediente";
    document.getElementById('tab-btn-ingredientes').click();
}

function deleteIngredient(id) {
    const isUsed = savedRecipes.some(recipe => recipe.ingredients.some(item => item.ingredientId == id));
    if (isUsed) {
        alert("Este ingrediente não pode ser apagado pois está sendo usado em uma ou mais receitas salvas.");
        return;
    }
    if (confirm("Tem certeza que deseja apagar este ingrediente?")) {
        ingredients = ingredients.filter(ing => ing.id != id);
        saveIngredients();
        rebuildIngredientsTable();
    }
}

function rebuildIngredientsTable() {
    const tableBody = document.getElementById('ingredients-table-body');
    tableBody.innerHTML = '';
    ingredients.forEach(ing => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${ing.name}</td>
            <td>R$ ${ing.price.toFixed(2)} / ${ing.quantity} ${ing.unit}</td>
            <td class="actions-cell">
                <button type="button" class="btn-edit" onclick="editIngredient(${ing.id})">Editar</button>
                <button type="button" class="btn-delete" onclick="deleteIngredient(${ing.id})">Apagar</button>
            </td>
        `;
    });
    updateAllRecipeIngredientDropdowns();
}

function clearIngredientForm() {
    document.getElementById('ingredient-form').reset();
    document.getElementById('ingredient-id').value = '';
    document.getElementById('ingredient-submit-btn').textContent = "Adicionar Ingrediente";
}

// ========= FUNÇÕES DE GERENCIAMENTO DE RECEITAS =========
function addRecipeIngredientField(ingredientId = '', quantity = '', unit = '') {
    const container = document.getElementById('recipe-ingredients');
    const newField = document.createElement('div');
    newField.className = 'recipe-ingredient-row';
    newField.innerHTML = `
        <select class="ing-select" onchange="updateRecipeIngredientUnit(this)"></select>
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

function updateRecipeIngredientUnit(selectElement) {
    const unitSelect = selectElement.nextElementSibling.nextElementSibling;
    const selectedId = selectElement.value;
    unitSelect.innerHTML = '';
    if (!selectedId) return;

    const ingredient = ingredients.find(ing => ing.id == selectedId);
    if (!ingredient) return;

    const options = (ingredient.unit === 'kg' || ingredient.unit === 'g') ? ['g', 'kg'] :
                    (ingredient.unit === 'l' || ingredient.unit === 'ml') ? ['ml', 'l'] :
                    [ingredient.unit];
    
    options.forEach(option => {
        unitSelect.innerHTML += `<option value="${option}">${option}</option>`;
    });
}

function updateAllRecipeIngredientDropdowns() {
    document.querySelectorAll('.ing-select').forEach(updateRecipeIngredientDropdowns);
}

function updateRecipeIngredientDropdowns(selectElement) {
    const selectedValue = selectElement.value;
    selectElement.innerHTML = '<option value="">Selecione...</option>';
    ingredients.forEach(ing => {
        selectElement.innerHTML += `<option value="${ing.id}">${ing.name}</option>`;
    });
    selectElement.value = selectedValue;
}

function getRecipeDataFromForm() {
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

function calculatePrice(recipeData) {
    let totalCost = 0;
    recipeData.ingredients.forEach(item => {
        const ingredient = ingredients.find(ing => ing.id == item.ingredientId);
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

function calculateAndDisplayCurrentRecipe() {
    const recipeData = getRecipeDataFromForm();
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

function saveOrUpdateRecipe() {
    const recipeData = getRecipeDataFromForm();
    if (!recipeData.name || recipeData.ingredients.length === 0) {
        alert("Preencha o nome da receita e adicione ao menos um ingrediente.");
        return;
    }

    const existingIndex = savedRecipes.findIndex(r => r.id == recipeData.id);
    if (existingIndex > -1) {
        savedRecipes[existingIndex] = recipeData;
    } else {
        savedRecipes.push(recipeData);
    }
    
    saveRecipes();
    rebuildSavedRecipes();
    clearRecipeForm();
    document.getElementById('tab-btn-receitas-salvas').click();
}

function editSavedRecipe(id) {
    const recipe = savedRecipes.find(r => r.id == id);
    if (!recipe) return;
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

function deleteSavedRecipe(id) {
    if (confirm("Tem certeza que deseja apagar esta receita?")) {
        savedRecipes = savedRecipes.filter(r => r.id != id);
        saveRecipes();
        rebuildSavedRecipes();
    }
}

function duplicateSavedRecipe(id) {
    const originalRecipe = savedRecipes.find(r => r.id == id);
    if (!originalRecipe) return;
    const newRecipe = JSON.parse(JSON.stringify(originalRecipe));
    newRecipe.id = Date.now();
    newRecipe.name = `${originalRecipe.name} (cópia)`;
    savedRecipes.push(newRecipe);
    saveRecipes();
    rebuildSavedRecipes();
}

function rebuildSavedRecipes() {
    const container = document.getElementById('saved-recipes-container');
    container.innerHTML = '';
    if (savedRecipes.length === 0) {
        container.innerHTML = '<p>Nenhuma receita salva ainda.</p>';
        return;
    }

    savedRecipes.forEach(recipe => {
        const { totalCost, finalPrice } = calculatePrice(recipe);
        const recipeYield = recipe.yield > 0 ? recipe.yield : 1;
        const pricePerUnit = finalPrice / recipeYield;

        let detailsHtml = `
            <p><strong>Rendimento:</strong> ${recipeYield} unidades</p>
            <ul>`;
        recipe.ingredients.forEach(item => {
            const ingredient = ingredients.find(ing => ing.id == item.ingredientId);
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
                <div class="saved-recipe-card-header-title" onclick="toggleRecipeDetails(this.closest('.saved-recipe-card'))">
                    <h4>${recipe.name}</h4>
                    <small>Venda: R$ ${finalPrice.toFixed(2)} | Unid: R$ ${pricePerUnit.toFixed(2)}</small>
                </div>
                <div class="menu-container">
                    <button type="button" class="menu-button" onclick="toggleActionMenu(this)">&#8942;</button>
                    <div class="menu-dropdown">
                        <a href="#" onclick="event.preventDefault(); editSavedRecipe(${recipe.id})">Editar</a>
                        <a href="#" onclick="event.preventDefault(); duplicateSavedRecipe(${recipe.id})">Duplicar</a>
                        <a href="#" onclick="event.preventDefault(); deleteSavedRecipe(${recipe.id})">Apagar</a>
                    </div>
                </div>
            </div>
            <div class="recipe-details">${detailsHtml}</div>
        `;
        container.appendChild(card);
    });
    
    addDragAndDropListeners();
}

// ========= FUNÇÕES DE ARRASTAR E SOLTAR (DRAG AND DROP) =========
function addDragAndDropListeners() {
    const cards = document.querySelectorAll('.saved-recipe-card');
    const container = document.getElementById('saved-recipes-container');

    cards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });
    
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
    draggedRecipeId = parseInt(this.dataset.id);
    this.classList.add('dragging');
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function handleDragOver(e) {
    e.preventDefault();
    const afterElement = getDragAfterElement(this, e.clientY);
    document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    if (afterElement) {
        afterElement.classList.add('drag-over');
    }
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.saved-recipe-card:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function handleDrop(e) {
    e.preventDefault();
    const afterElement = this.querySelector('.drag-over');
    const draggedIndex = savedRecipes.findIndex(r => r.id === draggedRecipeId);
    
    if (draggedIndex === -1) return;

    const [draggedRecipe] = savedRecipes.splice(draggedIndex, 1);
    
    if (afterElement == null) {
        savedRecipes.push(draggedRecipe);
    } else {
        const afterId = parseInt(afterElement.dataset.id);
        const afterIndex = savedRecipes.findIndex(r => r.id === afterId);
        savedRecipes.splice(afterIndex, 0, draggedRecipe);
    }

    draggedRecipeId = null;
    saveRecipes();
    rebuildSavedRecipes();
}

function updateAllSavedRecipes() {
    rebuildSavedRecipes();
}

function clearRecipeForm(addFirstField = true) {
    document.getElementById('recipe-form').reset();
    document.getElementById('recipe-id').value = '';
    document.getElementById('recipe-form-title').textContent = "Nova Receita";
    document.getElementById('recipe-ingredients').innerHTML = '';
    if (addFirstField) addRecipeIngredientField();
    document.getElementById('recipe-cost-result').innerHTML = '';
    document.getElementById('recipe-submit-btn').textContent = "Salvar Receita";
}

// ========= FUNÇÕES DE PERSISTÊNCIA E BACKUP =========
function saveIngredients() { localStorage.setItem('confeitaria_ingredients', JSON.stringify(ingredients)); }
function loadIngredients() {
    const data = localStorage.getItem('confeitaria_ingredients');
    if (data) ingredients = JSON.parse(data);
}
function saveRecipes() { localStorage.setItem('confeitaria_savedRecipes', JSON.stringify(savedRecipes)); }
function loadRecipes() {
    const data = localStorage.getItem('confeitaria_savedRecipes');
    if (data) savedRecipes = JSON.parse(data);
}

function exportBackup() {
    const backupData = { ingredients, savedRecipes };
    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `precificacao_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData.ingredients && importedData.savedRecipes) {
                if (confirm("Importar o backup irá APAGAR os dados atuais. Deseja continuar?")) {
                    ingredients = importedData.ingredients;
                    savedRecipes = importedData.savedRecipes;
                    saveIngredients();
                    saveRecipes();
                    rebuildIngredientsTable();
                    rebuildSavedRecipes();
                    alert("Backup importado com sucesso!");
                }
            } else {
                alert("Formato do arquivo de backup inválido.");
            }
        } catch (error) {
            alert("Erro ao ler o arquivo.");
        }
    };
    reader.readAsText(file);
}

// ========= INICIALIZAÇÃO DA APLICAÇÃO =========
document.addEventListener('DOMContentLoaded', () => {
    // Carrega os dados salvos
    loadIngredients();
    loadRecipes();
    
    // Constrói a UI inicial
    rebuildIngredientsTable();
    rebuildSavedRecipes();
    clearRecipeForm();

    // Adiciona listeners para os formulários
    document.getElementById('ingredient-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addOrUpdateIngredient();
    });

    document.getElementById('recipe-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveOrUpdateRecipe();
    });
});


