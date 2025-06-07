/**
 * Database utility functions for the Finance Tracker application
 * This module provides CRUD operations for transactions, users, and budgets
 * using localStorage as the data storage mechanism
 */

/**
 * Transaction Database Operations
 * Handles all transaction-related database operations
 */
const TransactionDB = {
    /**
     * Retrieve all transactions from storage
     * @returns {Array} Array of transaction objects
     */
    getAll: function() {
        return JSON.parse(localStorage.getItem('financeTrackerTransactions')) || [];
    },

    /**
     * Find a specific transaction by its ID
     * @param {string|number} id - The transaction ID to find
     * @returns {Object|null} The found transaction or null if not found
     */
    getById: function(id) {
        const transactions = this.getAll();
        return transactions.find(t => t.id == id);
    },

    /**
     * Add a new transaction to storage
     * @param {Object} transaction - The transaction object to add
     * @returns {Object} The added transaction with generated ID
     */
    add: function(transaction) {
        const transactions = this.getAll();
        transaction.id = Date.now(); // Use timestamp as ID
        transactions.push(transaction);
        localStorage.setItem('financeTrackerTransactions', JSON.stringify(transactions));
        return transaction;
    },

    /**
     * Update an existing transaction
     * @param {string|number} id - The ID of the transaction to update
     * @param {Object} updatedTransaction - The updated transaction data
     * @returns {Object|null} The updated transaction or null if not found
     */
    update: function(id, updatedTransaction) {
        const transactions = this.getAll();
        const index = transactions.findIndex(t => t.id == id);
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updatedTransaction };
            localStorage.setItem('financeTrackerTransactions', JSON.stringify(transactions));
            return transactions[index];
        }
        return null;
    },

    /**
     * Delete a transaction by ID
     * @param {string|number} id - The ID of the transaction to delete
     * @returns {boolean} True if deletion was successful
     */
    delete: function(id) {
        const transactions = this.getAll();
        const filteredTransactions = transactions.filter(t => t.id != id);
        localStorage.setItem('financeTrackerTransactions', JSON.stringify(filteredTransactions));
        return true;
    },

    /**
     * Get transactions within a specific date range
     * @param {Date} startDate - The start date of the range
     * @param {Date} endDate - The end date of the range
     * @returns {Array} Array of transactions within the date range
     */
    getByDateRange: function(startDate, endDate) {
        const transactions = this.getAll();
        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= startDate && transactionDate <= endDate;
        });
    },

    /**
     * Get transactions by category
     * @param {string} category - The category to filter by
     * @returns {Array} Array of transactions in the specified category
     */
    getByCategory: function(category) {
        const transactions = this.getAll();
        return transactions.filter(t => t.category === category);
    },

    /**
     * Get transactions by type (income/expense)
     * @param {string} type - The type to filter by ('income' or 'expense')
     * @returns {Array} Array of transactions of the specified type
     */
    getByType: function(type) {
        const transactions = this.getAll();
        return transactions.filter(t => {
            if (type === 'income') return t.amount > 0;
            if (type === 'expense') return t.amount < 0;
            return true;
        });
    }
};

/**
 * User Database Operations
 * Handles user authentication and session management
 */
const UserDB = {
    /**
     * Get the currently logged-in user
     * @returns {Object|null} The current user object or null if not logged in
     */
    getCurrentUser: function() {
        return JSON.parse(localStorage.getItem('financeTrackerCurrentUser'));
    },

    /**
     * Set the current user in storage
     * @param {Object} user - The user object to store
     */
    setCurrentUser: function(user) {
        localStorage.setItem('financeTrackerCurrentUser', JSON.stringify(user));
    },

    /**
     * Check if a user is currently logged in
     * @returns {boolean} True if a user is logged in
     */
    isLoggedIn: function() {
        return localStorage.getItem('financeTrackerLoggedIn') === 'true';
    },

    /**
     * Set the login status
     * @param {boolean} status - The login status to set
     */
    setLoginStatus: function(status) {
        localStorage.setItem('financeTrackerLoggedIn', status);
    },

    /**
     * Log out the current user
     * Removes user data and login status from storage
     */
    logout: function() {
        localStorage.removeItem('financeTrackerLoggedIn');
        localStorage.removeItem('financeTrackerCurrentUser');
    }
};

/**
 * Budget Database Operations
 * Handles all budget-related database operations
 */
const BudgetDB = {
    /**
     * Retrieve all budgets from storage
     * @returns {Array} Array of budget objects
     */
    getAll: function() {
        return JSON.parse(localStorage.getItem('financeTrackerBudgets')) || [];
    },

    /**
     * Find a specific budget by its ID
     * @param {string|number} id - The budget ID to find
     * @returns {Object|null} The found budget or null if not found
     */
    getById: function(id) {
        const budgets = this.getAll();
        return budgets.find(b => b.id == id);
    },

    /**
     * Add a new budget to storage
     * @param {Object} budget - The budget object to add
     * @returns {Object} The added budget with generated ID
     */
    add: function(budget) {
        const budgets = this.getAll();
        budget.id = Date.now(); // Use timestamp as ID
        budgets.push(budget);
        localStorage.setItem('financeTrackerBudgets', JSON.stringify(budgets));
        return budget;
    },

    /**
     * Update an existing budget
     * @param {string|number} id - The ID of the budget to update
     * @param {Object} updatedBudget - The updated budget data
     * @returns {Object|null} The updated budget or null if not found
     */
    update: function(id, updatedBudget) {
        const budgets = this.getAll();
        const index = budgets.findIndex(b => b.id == id);
        if (index !== -1) {
            budgets[index] = { ...budgets[index], ...updatedBudget };
            localStorage.setItem('financeTrackerBudgets', JSON.stringify(budgets));
            return budgets[index];
        }
        return null;
    },

    /**
     * Delete a budget by ID
     * @param {string|number} id - The ID of the budget to delete
     * @returns {boolean} True if deletion was successful
     */
    delete: function(id) {
        const budgets = this.getAll();
        const filteredBudgets = budgets.filter(b => b.id != id);
        localStorage.setItem('financeTrackerBudgets', JSON.stringify(filteredBudgets));
        return true;
    },

    /**
     * Get budgets by category
     * @param {string} category - The category to filter by
     * @returns {Array} Array of budgets in the specified category
     */
    getByCategory: function(category) {
        const budgets = this.getAll();
        return budgets.filter(b => b.category === category);
    }
};

// Export the database utilities for use in other modules
export { TransactionDB, UserDB, BudgetDB }; 