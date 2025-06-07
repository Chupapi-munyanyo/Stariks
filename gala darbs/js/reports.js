// Import database utilities
import { TransactionDB, UserDB } from '../db/database.js';

// Check authentication
if (!UserDB.isLoggedIn()) {
    window.location.href = 'login.html';
}

// Load user info
const currentUser = UserDB.getCurrentUser();
document.getElementById('userName').textContent = currentUser.fullName;

// Load transactions
let transactions = TransactionDB.getAll();

// Format currency
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


const filterTransactionsByDateRange = (startDate, endDate) => {
    return transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
    });
};


const generateMonthlyReport = () => {
    const months = {};
    const currentYear = new Date().getFullYear();
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        if (date.getFullYear() === currentYear) {
            const month = date.getMonth();
            if (!months[month]) {
                months[month] = { income: 0, expenses: 0 };
            }
            if (transaction.type === 'income') {
                months[month].income += transaction.amount;
            } else {
                months[month].expenses += transaction.amount;
            }
        }
    });
    
    return months;
};


const generateCategoryReport = () => {
    const categories = {};
    
    transactions.forEach(transaction => {
        if (!categories[transaction.category]) {
            categories[transaction.category] = { income: 0, expenses: 0 };
        }
        if (transaction.type === 'income') {
            categories[transaction.category].income += transaction.amount;
        } else {
            categories[transaction.category].expenses += transaction.amount;
        }
    });
    
    return categories;
};

// Initialize charts
const initializeCharts = () => {
    // Monthly Income vs Expenses Chart
    const monthlyData = generateMonthlyReport();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const incomeData = months.map((_, index) => monthlyData[index]?.income || 0);
    const expensesData = months.map((_, index) => monthlyData[index]?.expenses || 0);
    
    const monthlyChartCtx = document.getElementById('monthlyChart').getContext('2d');
    new Chart(monthlyChartCtx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    borderColor: '#198754',
                    backgroundColor: 'rgba(25, 135, 84, 0.1)',
                    fill: true
                },
                {
                    label: 'Expenses',
                    data: expensesData,
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Income vs Expenses'
                }
            }
        }
    });
    
    // Category Distribution Chart
    const categoryData = generateCategoryReport();
    const categoryChartCtx = document.getElementById('categoryChart').getContext('2d');
    new Chart(categoryChartCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData),
            datasets: [{
                data: Object.values(categoryData).map(cat => cat.expenses),
                backgroundColor: [
                    '#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#dc3545',
                    '#fd7e14', '#ffc107', '#198754', '#20c997', '#0dcaf0'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Expenses by Category'
                }
            }
        }
    });
};

// Export to CSV
const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const csvContent = [
        headers.join(','),
        ...transactions.map(t => [
            formatDate(t.date),
            `"${t.description}"`,
            t.category,
            t.type,
            t.amount
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    
    // Add event listeners
    document.getElementById('exportCSV').addEventListener('click', exportToCSV);
    document.getElementById('logoutBtn').addEventListener('click', () => {
        UserDB.logout();
        window.location.href = 'login.html';
    });
    
    // Date range filter
    const dateRangeForm = document.getElementById('dateRangeForm');
    dateRangeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        const filteredTransactions = filterTransactionsByDateRange(startDate, endDate);
        // Update charts with filtered data
        initializeCharts();
    });
}); 