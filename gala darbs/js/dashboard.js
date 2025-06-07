
import { TransactionDB, BudgetDB, UserDB } from '../db/database.js';


if (!UserDB.isLoggedIn()) {
    window.location.href = 'login.html';
}


const currentUser = UserDB.getCurrentUser();
document.getElementById('userName').textContent = currentUser.fullName;


let transactions = TransactionDB.getAll();
let budgets = BudgetDB.getAll();


const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};


const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};


const updateSummary = () => {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const netBalance = totalIncome - totalExpenses;
    
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('netBalance').textContent = formatCurrency(netBalance);
    
    
    const balanceElement = document.getElementById('netBalance');
    balanceElement.className = netBalance >= 0 ? 'text-success' : 'text-danger';
};


const updateRecentTransactions = () => {
    const recentTransactions = transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    const tbody = document.getElementById('recentTransactions');
    tbody.innerHTML = '';
    
    if (recentTransactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">No recent transactions</td>
            </tr>
        `;
        return;
    }
    
    recentTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.description}</td>
            <td><span class="badge bg-${transaction.type === 'income' ? 'success' : 'danger'}">${transaction.type}</span></td>
            <td>${transaction.category}</td>
            <td class="${transaction.type === 'income' ? 'text-success' : 'text-danger'}">${formatCurrency(transaction.amount)}</td>
        `;
        tbody.appendChild(row);
    });
};

// Update budget progress
const updateBudgetProgress = () => {
    const budgetProgress = document.getElementById('budgetProgress');
    budgetProgress.innerHTML = '';
    
    if (budgets.length === 0) {
        budgetProgress.innerHTML = '<p class="text-center">No budgets set</p>';
        return;
    }
    
    budgets.forEach(budget => {
        const spent = transactions
            .filter(t => t.type === 'expense' && t.category === budget.category)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const percentage = (spent / budget.amount) * 100;
        const status = percentage > 100 ? 'danger' : percentage > 80 ? 'warning' : 'success';
        
        const progressHtml = `
            <div class="budget-item mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span>${budget.category}</span>
                    <span>${formatCurrency(spent)} / ${formatCurrency(budget.amount)}</span>
                </div>
                <div class="progress">
                    <div class="progress-bar bg-${status}" role="progressbar" 
                         style="width: ${Math.min(percentage, 100)}%" 
                         aria-valuenow="${percentage}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                    </div>
                </div>
            </div>
        `;
        budgetProgress.innerHTML += progressHtml;
    });
};

// Initialize charts
const initializeCharts = () => {
    // Income vs Expenses Chart
    const incomeVsExpensesCtx = document.getElementById('incomeVsExpensesChart').getContext('2d');
    const incomeVsExpensesChart = new Chart(incomeVsExpensesCtx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                data: [
                    transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
                    transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
                ],
                backgroundColor: ['#198754', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    // Category Distribution Chart
    const categoryDistributionCtx = document.getElementById('categoryDistributionChart').getContext('2d');
    const expensesByCategory = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});
    
    const categoryDistributionChart = new Chart(categoryDistributionCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(expensesByCategory),
            datasets: [{
                data: Object.values(expensesByCategory),
                backgroundColor: [
                    '#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545',
                    '#fd7e14', '#ffc107', '#198754', '#20c997', '#0dcaf0'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    updateSummary();
    updateRecentTransactions();
    updateBudgetProgress();
    initializeCharts();
    
    // Add event listener for logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        UserDB.logout();
        window.location.href = 'login.html';
    });
}); 