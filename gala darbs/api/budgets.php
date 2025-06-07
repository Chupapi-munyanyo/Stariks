<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Get user_id from query parameters
        $user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
        
        if (!$user_id) {
            http_response_code(400);
            echo json_encode(array("message" => "User ID is required."));
            exit();
        }

        // Prepare query
        $query = "SELECT b.*, c.name as category_name 
                 FROM budgets b 
                 JOIN categories c ON b.category_id = c.id 
                 WHERE b.user_id = :user_id 
                 ORDER BY b.created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
        
        $budgets = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            array_push($budgets, $row);
        }
        
        echo json_encode($budgets);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->user_id) || !isset($data->category_id) || !isset($data->amount) || !isset($data->period)) {
            http_response_code(400);
            echo json_encode(array("message" => "Missing required fields."));
            exit();
        }

        $query = "INSERT INTO budgets (user_id, category_id, amount, period, notes, created_at, updated_at) 
                 VALUES (:user_id, :category_id, :amount, :period, :notes, NOW(), NOW())";
        
        $stmt = $db->prepare($query);
        
        $stmt->bindParam(":user_id", $data->user_id);
        $stmt->bindParam(":category_id", $data->category_id);
        $stmt->bindParam(":amount", $data->amount);
        $stmt->bindParam(":period", $data->period);
        $stmt->bindParam(":notes", $data->notes);
        
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(array("message" => "Budget created successfully.", "id" => $db->lastInsertId()));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Unable to create budget."));
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->id) || !isset($data->user_id) || !isset($data->category_id) || !isset($data->amount) || !isset($data->period)) {
            http_response_code(400);
            echo json_encode(array("message" => "Missing required fields."));
            exit();
        }

        $query = "UPDATE budgets 
                 SET category_id = :category_id, 
                     amount = :amount, 
                     period = :period, 
                     notes = :notes, 
                     updated_at = NOW() 
                 WHERE id = :id AND user_id = :user_id";
        
        $stmt = $db->prepare($query);
        
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":user_id", $data->user_id);
        $stmt->bindParam(":category_id", $data->category_id);
        $stmt->bindParam(":amount", $data->amount);
        $stmt->bindParam(":period", $data->period);
        $stmt->bindParam(":notes", $data->notes);
        
        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) {
                http_response_code(200);
                echo json_encode(array("message" => "Budget updated successfully."));
            } else {
                http_response_code(404);
                echo json_encode(array("message" => "Budget not found or no changes made."));
            }
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Unable to update budget."));
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->id) || !isset($data->user_id)) {
            http_response_code(400);
            echo json_encode(array("message" => "Missing required fields."));
            exit();
        }

        $query = "DELETE FROM budgets WHERE id = :id AND user_id = :user_id";
        
        $stmt = $db->prepare($query);
        
        $stmt->bindParam(":id", $data->id);
        $stmt->bindParam(":user_id", $data->user_id);
        
        if ($stmt->execute()) {
            if ($stmt->rowCount() > 0) {
                http_response_code(200);
                echo json_encode(array("message" => "Budget deleted successfully."));
            } else {
                http_response_code(404);
                echo json_encode(array("message" => "Budget not found."));
            }
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Unable to delete budget."));
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(array("message" => "Method not allowed."));
        break;
}
?> 