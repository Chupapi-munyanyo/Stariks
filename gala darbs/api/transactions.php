<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Get transactions with filters
        $user_id = isset($_GET['user_id']) ? $_GET['user_id'] : die();
        $date_range = isset($_GET['date_range']) ? $_GET['date_range'] : 'all';
        $type = isset($_GET['type']) ? $_GET['type'] : 'all';
        $category = isset($_GET['category']) ? $_GET['category'] : 'all';
        $search = isset($_GET['search']) ? $_GET['search'] : '';

        $query = "SELECT t.*, c.name as category_name 
                 FROM transactions t 
                 JOIN categories c ON t.category_id = c.id 
                 WHERE t.user_id = :user_id";

        // Add date range filter
        switch($date_range) {
            case 'today':
                $query .= " AND DATE(t.transaction_date) = CURDATE()";
                break;
            case 'thisWeek':
                $query .= " AND YEARWEEK(t.transaction_date) = YEARWEEK(CURDATE())";
                break;
            case 'thisMonth':
                $query .= " AND MONTH(t.transaction_date) = MONTH(CURDATE()) AND YEAR(t.transaction_date) = YEAR(CURDATE())";
                break;
            case 'last3Months':
                $query .= " AND t.transaction_date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)";
                break;
            case 'thisYear':
                $query .= " AND YEAR(t.transaction_date) = YEAR(CURDATE())";
                break;
        }

        // Add type filter
        if ($type !== 'all') {
            $query .= " AND c.type = :type";
        }

        // Add category filter
        if ($category !== 'all') {
            $query .= " AND t.category_id = :category";
        }

        // Add search filter
        if ($search !== '') {
            $query .= " AND (t.description LIKE :search OR t.notes LIKE :search)";
        }

        $query .= " ORDER BY t.transaction_date DESC";

        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        
        if ($type !== 'all') {
            $stmt->bindParam(":type", $type);
        }
        if ($category !== 'all') {
            $stmt->bindParam(":category", $category);
        }
        if ($search !== '') {
            $search = "%$search%";
            $stmt->bindParam(":search", $search);
        }

        $stmt->execute();
        $transactions = $stmt->fetchAll();

        echo json_encode($transactions);
        break;

    case 'POST':
        // Create new transaction
        $data = json_decode(file_get_contents("php://input"));
        
        $query = "INSERT INTO transactions 
                 (user_id, description, amount, category_id, transaction_date, notes) 
                 VALUES 
                 (:user_id, :description, :amount, :category_id, :transaction_date, :notes)";

        $stmt = $db->prepare($query);
        
        $stmt->bindParam(":user_id", $data->user_id);
        $stmt->bindParam(":description", $data->description);
        $stmt->bindParam(":amount", $data->amount);
        $stmt->bindParam(":category_id", $data->category_id);
        $stmt->bindParam(":transaction_date", $data->transaction_date);
        $stmt->bindParam(":notes", $data->notes);

        if($stmt->execute()) {
            echo json_encode(array("message" => "Transaction created successfully."));
        } else {
            echo json_encode(array("message" => "Unable to create transaction."));
        }
        break;

    case 'PUT':
        // Update transaction
        $data = json_decode(file_get_contents("php://input"));
        
        $query = "UPDATE transactions 
                 SET description = :description,
                     amount = :amount,
                     category_id = :category_id,
                     transaction_date = :transaction_date,
                     notes = :notes
                 WHERE id = :id AND user_id = :user_id";

        $stmt = $db->prepare($query);
        
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":user_id", $data->user_id);
        $stmt->bindParam(":description", $data->description);
        $stmt->bindParam(":amount", $data->amount);
        $stmt->bindParam(":category_id", $data->category_id);
        $stmt->bindParam(":transaction_date", $data->transaction_date);
        $stmt->bindParam(":notes", $data->notes);

        if($stmt->execute()) {
            echo json_encode(array("message" => "Transaction updated successfully."));
        } else {
            echo json_encode(array("message" => "Unable to update transaction."));
        }
        break;

    case 'DELETE':
        // Delete transaction
        $data = json_decode(file_get_contents("php://input"));
        
        $query = "DELETE FROM transactions WHERE id = :id AND user_id = :user_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":user_id", $data->user_id);

        if($stmt->execute()) {
            echo json_encode(array("message" => "Transaction deleted successfully."));
        } else {
            echo json_encode(array("message" => "Unable to delete transaction."));
        }
        break;
}
?> 