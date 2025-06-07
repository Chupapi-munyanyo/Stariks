<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get user ID from query parameters
$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
$report_type = isset($_GET['report_type']) ? $_GET['report_type'] : 'summary';
$date_range = isset($_GET['date_range']) ? $_GET['date_range'] : 'thisMonth';

if (!$user_id) {
    http_response_code(400);
    echo json_encode(['error' => 'User ID is required']);
    exit;
}

// Calculate date range
function getDateRange($range) {
    $end = new DateTime();
    $start = new DateTime();
    
    switch ($range) {
        case 'today':
            $start->setTime(0, 0, 0);
            break;
        case 'thisWeek':
            $start->modify('monday this week');
            break;
        case 'thisMonth':
            $start->modify('first day of this month');
            break;
        case 'last3Months':
            $start->modify('-3 months');
            break;
        case 'thisYear':
            $start->modify('first day of january this year');
            break;
        case 'lastYear':
            $start->modify('first day of january last year');
            $end->modify('last day of december last year');
            break;
        case 'custom':
            if (isset($_GET['start_date']) && isset($_GET['end_date'])) {
                $start = new DateTime($_GET['start_date']);
                $end = new DateTime($_GET['end_date']);
            }
            break;
    }
    
    return [
        'start' => $start->format('Y-m-d'),
        'end' => $end->format('Y-m-d')
    ];
}

$dateRange = getDateRange($date_range);

// Base query for transactions
$query = "SELECT t.*, c.name as category_name, c.type as category_type 
          FROM transactions t 
          JOIN categories c ON t.category_id = c.id 
          WHERE t.user_id = :user_id 
          AND t.transaction_date BETWEEN :start_date AND :end_date";

$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $user_id);
$stmt->bindParam(':start_date', $dateRange['start']);
$stmt->bindParam(':end_date', $dateRange['end']);
$stmt->execute();

$transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Get budgets
$query = "SELECT b.*, c.name as category_name 
          FROM budgets b 
          JOIN categories c ON b.category_id = c.id 
          WHERE b.user_id = :user_id 
          AND b.start_date <= :end_date 
          AND b.end_date >= :start_date";

$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $user_id);
$stmt->bindParam(':start_date', $dateRange['start']);
$stmt->bindParam(':end_date', $dateRange['end']);
$stmt->execute();

$budgets = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Generate report based on type
function generateReport($type, $transactions, $budgets) {
    switch ($type) {
        case 'summary':
            return generateSummaryReport($transactions);
        case 'category':
            return generateCategoryReport($transactions);
        case 'trends':
            return generateTrendsReport($transactions);
        case 'budget':
            return generateBudgetReport($transactions, $budgets);
        case 'forecast':
            return generateForecastReport($transactions);
        case 'savings':
            return generateSavingsReport($transactions);
        case 'goals':
            return generateGoalsReport($transactions);
        case 'comparison':
            return generateComparisonReport($transactions);
        default:
            return generateSummaryReport($transactions);
    }
}

function generateSummaryReport($transactions) {
    $totalIncome = 0;
    $totalExpenses = 0;
    $categoryTotals = [];
    
    foreach ($transactions as $transaction) {
        if ($transaction['amount'] > 0) {
            $totalIncome += $transaction['amount'];
        } else {
            $totalExpenses += abs($transaction['amount']);
        }
        
        $category = $transaction['category_name'];
        if (!isset($categoryTotals[$category])) {
            $categoryTotals[$category] = 0;
        }
        $categoryTotals[$category] += $transaction['amount'];
    }
    
    return [
        'total_income' => $totalIncome,
        'total_expenses' => $totalExpenses,
        'net_balance' => $totalIncome - $totalExpenses,
        'category_totals' => $categoryTotals
    ];
}

function generateCategoryReport($transactions) {
    $categoryData = [];
    
    foreach ($transactions as $transaction) {
        $category = $transaction['category_name'];
        if (!isset($categoryData[$category])) {
            $categoryData[$category] = [
                'total' => 0,
                'count' => 0,
                'type' => $transaction['category_type']
            ];
        }
        
        $categoryData[$category]['total'] += $transaction['amount'];
        $categoryData[$category]['count']++;
    }
    
    return $categoryData;
}

function generateTrendsReport($transactions) {
    $monthlyData = [];
    
    foreach ($transactions as $transaction) {
        $month = substr($transaction['transaction_date'], 0, 7);
        if (!isset($monthlyData[$month])) {
            $monthlyData[$month] = [
                'income' => 0,
                'expenses' => 0
            ];
        }
        
        if ($transaction['amount'] > 0) {
            $monthlyData[$month]['income'] += $transaction['amount'];
        } else {
            $monthlyData[$month]['expenses'] += abs($transaction['amount']);
        }
    }
    
    ksort($monthlyData);
    return $monthlyData;
}

function generateBudgetReport($transactions, $budgets) {
    $budgetData = [];
    
    foreach ($budgets as $budget) {
        $spent = 0;
        foreach ($transactions as $transaction) {
            if ($transaction['category_id'] == $budget['category_id'] && $transaction['amount'] < 0) {
                $spent += abs($transaction['amount']);
            }
        }
        
        $budgetData[] = [
            'category' => $budget['category_name'],
            'budget' => $budget['amount'],
            'spent' => $spent,
            'remaining' => $budget['amount'] - $spent,
            'percentage' => ($spent / $budget['amount']) * 100
        ];
    }
    
    return $budgetData;
}

function generateForecastReport($transactions) {
    $monthlySpending = [];
    
    foreach ($transactions as $transaction) {
        if ($transaction['amount'] < 0) {
            $month = substr($transaction['transaction_date'], 0, 7);
            if (!isset($monthlySpending[$month])) {
                $monthlySpending[$month] = 0;
            }
            $monthlySpending[$month] += abs($transaction['amount']);
        }
    }
    
    $avgMonthlySpending = array_sum($monthlySpending) / count($monthlySpending);
    
    $forecast = [];
    $currentDate = new DateTime();
    for ($i = 0; $i < 6; $i++) {
        $forecast[] = [
            'month' => $currentDate->format('Y-m'),
            'amount' => $avgMonthlySpending
        ];
        $currentDate->modify('+1 month');
    }
    
    return $forecast;
}

function generateSavingsReport($transactions) {
    $monthlyData = [];
    
    foreach ($transactions as $transaction) {
        $month = substr($transaction['transaction_date'], 0, 7);
        if (!isset($monthlyData[$month])) {
            $monthlyData[$month] = [
                'income' => 0,
                'expenses' => 0
            ];
        }
        
        if ($transaction['amount'] > 0) {
            $monthlyData[$month]['income'] += $transaction['amount'];
        } else {
            $monthlyData[$month]['expenses'] += abs($transaction['amount']);
        }
    }
    
    $savingsData = [];
    foreach ($monthlyData as $month => $data) {
        $savingsData[$month] = [
            'income' => $data['income'],
            'expenses' => $data['expenses'],
            'savings' => $data['income'] - $data['expenses'],
            'savings_rate' => $data['income'] > 0 ? 
                (($data['income'] - $data['expenses']) / $data['income'] * 100) : 0
        ];
    }
    
    return $savingsData;
}

function generateGoalsReport($transactions) {
    // In a real application, this would fetch goals from the database
    $goals = [
        [
            'name' => 'Emergency Fund',
            'target' => 10000,
            'current' => 7500
        ],
        [
            'name' => 'Vacation Savings',
            'target' => 5000,
            'current' => 3000
        ],
        [
            'name' => 'New Car Fund',
            'target' => 25000,
            'current' => 15000
        ]
    ];
    
    return $goals;
}

function generateComparisonReport($transactions) {
    $yearlyData = [];
    
    foreach ($transactions as $transaction) {
        $date = new DateTime($transaction['transaction_date']);
        $year = $date->format('Y');
        $month = $date->format('m');
        
        if (!isset($yearlyData[$year])) {
            $yearlyData[$year] = array_fill(0, 12, 0);
        }
        
        $yearlyData[$year][$month - 1] += $transaction['amount'];
    }
    
    return $yearlyData;
}

// Generate and return the report
$report = generateReport($report_type, $transactions, $budgets);
echo json_encode($report); 