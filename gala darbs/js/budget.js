
import { BudgetDB, TransactionDB, UserDB } from '../db/database.js';


if (!UserDB.isLoggedIn()) {
    window.location.href = 'login.html';
}


const currentUser = UserDB.getCurrentUser();
document.getElementById('userName').textContent = currentUser.fullName;


let budgets = BudgetDB.getAll();
let transactions = TransactionDB.getAll();


const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};


const calculateSpentAmount = (category) => {
    return transactions
        .filter(t => t.type === 'expense' && t.category === category)
        .reduce((sum, t) => sum + t.amount, 0);
};


const calculateBudgetProgress = (budget) => {
    const spent = calculateSpentAmount(budget.category);
    const percentage = (spent / budget.amount) * 100;
    return {
        spent,
        percentage: Math.min(percentage, 100),
        status: percentage > 100 ? 'danger' : percentage > 80 ? 'warning' : 'success'
    };
};


const renderBudgetCards = () => {
    const budgetContainer = document.getElementById('budgetContainer');
    budgetContainer.innerHTML = '';
    
    if (budgets.length === 0) {
        budgetContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    No budgets set. Click "Add Budget" to create one.
                </div>
            </div>
        `;
        return;
    }
    
    budgets.forEach(budget => {
        const progress = calculateBudgetProgress(budget);
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4 mb-4';
        card.innerHTML = `
            <div class="card budget-card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">${budget.category}</h5>
                    <div class="budget-actions">
                        <button class="btn btn-sm btn-outline-primary edit-budget" data-id="${budget.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-budget" data-id="${budget.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="budget-amount mb-3">
                        <small class="text-muted">Budget Amount</small>
                        <h4>${formatCurrency(budget.amount)}</h4>
                    </div>
                    <div class="budget-progress">
                        <div class="progress">
                            <div class="progress-bar bg-${progress.status}" 
                                 role="progressbar" 
                                 style="width: ${progress.percentage}%" 
                                 aria-valuenow="${progress.percentage}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="100">
                            </div>
                        </div>
                    </div>
                    <div class="budget-stats mt-2">
                        <span class="spent">Spent: ${formatCurrency(progress.spent)}</span>
                        <span class="remaining">Remaining: ${formatCurrency(budget.amount - progress.spent)}</span>
                    </div>
                </div>
            </div>
        `;
        budgetContainer.appendChild(card);
    });
};

// Show toast notification
const showToast = (message, type = 'success') => {
    const toast = document.getElementById('toast');
    const toastBody = toast.querySelector('.toast-body');
    toastBody.textContent = message;
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
};

// Save budget
const saveBudget = (e) => {
    e.preventDefault();
    const form = e.target;
    const budgetId = form.dataset.budgetId;
    const budget = {
        category: form.category.value,
        amount: parseFloat(form.amount.value)
    };
    
    if (budgetId) {
        BudgetDB.update(budgetId, budget);
        showToast('Budget updated successfully');
    } else {
        BudgetDB.add(budget);
        showToast('Budget added successfully');
    }
    
    budgets = BudgetDB.getAll();
    renderBudgetCards();
    bootstrap.Modal.getInstance(document.getElementById('budgetModal')).hide();
    form.reset();
};

// Edit budget
const editBudget = (budgetId) => {
    const budget = BudgetDB.getById(budgetId);
    if (!budget) return;
    
    const form = document.getElementById('budgetForm');
    form.dataset.budgetId = budgetId;
    form.category.value = budget.category;
    form.amount.value = budget.amount;
    
    const modal = new bootstrap.Modal(document.getElementById('budgetModal'));
    modal.show();
};

// Delete budget
const deleteBudget = (budgetId) => {
    if (confirm('Are you sure you want to delete this budget?')) {
        BudgetDB.delete(budgetId);
        budgets = BudgetDB.getAll();
        renderBudgetCards();
        showToast('Budget deleted successfully');
    }
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    renderBudgetCards();
    
    // Add event listeners
    document.getElementById('budgetForm').addEventListener('submit', saveBudget);
    document.getElementById('logoutBtn').addEventListener('click', () => {
        UserDB.logout();
        window.location.href = 'login.html';
    });
    
    // Edit and delete buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.edit-budget')) {
            const budgetId = e.target.closest('.edit-budget').dataset.id;
            editBudget(budgetId);
        }
        if (e.target.closest('.delete-budget')) {
            const budgetId = e.target.closest('.delete-budget').dataset.id;
            deleteBudget(budgetId);
        }
    });
    
    // Reset form when modal is hidden
    document.getElementById('budgetModal').addEventListener('hidden.bs.modal', () => {
        const form = document.getElementById('budgetForm');
        form.reset();
        delete form.dataset.budgetId;
    });
}); 