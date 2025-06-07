import { TransactionDB, UserDB } from '../db/database.js';

// Authentication check - redirect to login if not authenticated
if (!UserDB.isLoggedIn()) {
    window.location.href = 'login.html';
}

// Load and display current user information
const currentUser = UserDB.getCurrentUser();
document.getElementById('userName').textContent = currentUser.fullName;

/**
 * Format a number as currency in USD format
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

/**
 * Format a date string into a localized date format
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

/**
 * Filter transactions based on selected criteria
 * @returns {Array} Filtered array of transactions
 */
function filterTransactions() {
    // Get filter values from UI
    const dateRange = document.getElementById('dateRangeFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    const searchText = document.getElementById('searchFilter').value.toLowerCase();
    
    let transactions = TransactionDB.getAll();
    
    // Apply date range filter
    if (dateRange !== 'all') {
        const today = new Date();
        let startDate = new Date();
        
        switch(dateRange) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(today.getDate() - today.getDay());
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'month':
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'year':
                startDate.setMonth(0, 1);
                startDate.setHours(0, 0, 0, 0);
                break;
        }
        
        transactions = transactions.filter(t => new Date(t.date) >= startDate);
    }
    
    // Apply transaction type filter (income/expense)
    if (typeFilter !== 'all') {
        transactions = transactions.filter(t => {
            if (typeFilter === 'income') return t.amount > 0;
            if (typeFilter === 'expense') return t.amount < 0;
            return true;
        });
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
        transactions = transactions.filter(t => t.category === categoryFilter);
    }
    
    // Apply search text filter
    if (searchText) {
        transactions = transactions.filter(t => 
            t.description.toLowerCase().includes(searchText) ||
            t.category.toLowerCase().includes(searchText)
        );
    }
    
    return transactions;
}

/**
 * Render the transactions table with filtered data
 * Updates the table body and summary section
 */
function renderTransactionsTable() {
    const filteredTransactions = filterTransactions();
    const tableBody = document.getElementById('transactionsTableBody');
    tableBody.innerHTML = '';
    
    // Show message if no transactions found
    if (filteredTransactions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="text-muted">
                        <i class="fas fa-search me-2"></i>
                        No transactions found matching your filters
                    </div>
                </td>
            </tr>
        `;
    } else {
        // Render each transaction row
        filteredTransactions.forEach(transaction => {
            const isIncome = transaction.amount > 0;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.description}</td>
                <td>
                    <span class="badge bg-light text-dark">${transaction.category}</span>
                </td>
                <td class="${isIncome ? 'text-success' : 'text-danger'}">
                    ${formatCurrency(transaction.amount)}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${transaction.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${transaction.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Update summary section with filtered transactions
    updateSummary(filteredTransactions);
    
    // Add event listeners to action buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editTransaction(btn.getAttribute('data-id')));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => openDeleteModal(btn.getAttribute('data-id')));
    });
}

/**
 * Update the summary section with total income, expenses, and net balance
 * @param {Array} transactions - Array of transactions to calculate summary from
 */
function updateSummary(filteredTransactions) {
    let totalIncome = 0;
    let totalExpenses = 0;
    
    // Calculate totals
    filteredTransactions.forEach(transaction => {
        if (transaction.amount > 0) {
            totalIncome += transaction.amount;
        } else {
            totalExpenses += Math.abs(transaction.amount);
        }
    });
    
    const netBalance = totalIncome - totalExpenses;
    
    // Update UI elements
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('netBalance').textContent = formatCurrency(netBalance);
    document.getElementById('netBalance').className = netBalance >= 0 ? 'text-success' : 'text-danger';
}

/**
 * Edit an existing transaction
 * @param {string} id - ID of the transaction to edit
 */
function editTransaction(id) {
    const transaction = TransactionDB.getById(id);
    if (!transaction) return;
    
    // Populate form with transaction data
    document.getElementById('transactionId').value = transaction.id;
    document.getElementById('transactionType').value = transaction.amount >= 0 ? 'income' : 'expense';
    document.getElementById('transactionAmount').value = Math.abs(transaction.amount);
    document.getElementById('transactionCategory').value = transaction.category;
    document.getElementById('transactionDescription').value = transaction.description;
    document.getElementById('transactionDate').value = transaction.date;
    
    // Update modal title and show
    document.getElementById('transactionModalTitle').textContent = 'Edit Transaction';
    const modal = new bootstrap.Modal(document.getElementById('addTransactionModal'));
    modal.show();
}

/**
 * Open the delete confirmation modal
 * @param {string} id - ID of the transaction to delete
 */
function openDeleteModal(id) {
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteTransactionModal'));
    document.getElementById('confirmDeleteBtn').setAttribute('data-id', id);
    deleteModal.show();
}

/**
 * Delete a transaction
 * @param {string} id - ID of the transaction to delete
 */
function deleteTransaction(id) {
    TransactionDB.delete(id);
    renderTransactionsTable();
    showToast('Transaction deleted successfully!', 'success');
}

/**
 * Save a new or edited transaction
 * Handles both creation and updates
 */
function saveTransaction() {
    // Get form values
    const id = document.getElementById('transactionId').value;
    const type = document.getElementById('transactionType').value;
    let amount = parseFloat(document.getElementById('transactionAmount').value);
    const category = document.getElementById('transactionCategory').value;
    const description = document.getElementById('transactionDescription').value;
    const date = document.getElementById('transactionDate').value;
    
    // Adjust amount based on transaction type
    amount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
    
    const transaction = {
        description,
        amount,
        category,
        date
    };
    
    // Save to database
    if (id) {
        TransactionDB.update(id, transaction);
    } else {
        TransactionDB.add(transaction);
    }
    
    // Reset form and UI
    document.getElementById('transactionForm').reset();
    document.getElementById('transactionId').value = '';
    document.getElementById('transactionModalTitle').textContent = 'Add Transaction';
    
    // Update display and show success message
    renderTransactionsTable();
    showToast('Transaction saved successfully!', 'success');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addTransactionModal'));
    modal.hide();
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of notification ('success' or 'error')
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastBody = toast.querySelector('.toast-body');
    
    toast.className = `toast ${type === 'success' ? 'bg-success' : 'bg-danger'} text-white`;
    toastBody.textContent = message;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add filter change listeners
    document.getElementById('dateRangeFilter').addEventListener('change', renderTransactionsTable);
    document.getElementById('typeFilter').addEventListener('change', renderTransactionsTable);
    document.getElementById('categoryFilter').addEventListener('change', renderTransactionsTable);
    document.getElementById('searchFilter').addEventListener('input', renderTransactionsTable);
    
    // Add form submission listener
    document.getElementById('saveTransactionBtn').addEventListener('click', saveTransaction);
    
    // Add delete confirmation listener
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
        const id = document.getElementById('confirmDeleteBtn').getAttribute('data-id');
        deleteTransaction(id);
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteTransactionModal'));
        modal.hide();
    });
    
    // Initial render
    renderTransactionsTable();
}); 