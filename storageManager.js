// js/storageManager.js

const INGREDIENTS_KEY = 'confeitaria_ingredients';
const RECIPES_KEY = 'confeitaria_savedRecipes';

export function saveIngredients(ingredients) {
    localStorage.setItem(INGREDIENTS_KEY, JSON.stringify(ingredients));
}

export function loadIngredients() {
    const data = localStorage.getItem(INGREDIENTS_KEY);
    return data ? JSON.parse(data) : [];
}

export function saveRecipes(recipes) {
    localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
}

export function loadRecipes() {
    const data = localStorage.getItem(RECIPES_KEY);
    return data ? JSON.parse(data) : [];
}

export function exportBackup(ingredients, recipes) {
    const backupData = { ingredients, savedRecipes: recipes };
    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `precificacao_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export function importBackup(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            return reject(new Error("Nenhum arquivo selecionado."));
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                if (importedData.ingredients && importedData.savedRecipes) {
                    resolve(importedData);
                } else {
                    reject(new Error("Formato do arquivo de backup inválido."));
                }
            } catch (error) {
                reject(new Error("Erro ao ler o arquivo."));
            }
        };
        reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
        reader.readAsText(file);
    });
}