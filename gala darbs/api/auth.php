<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (isset($data->action)) {
        switch($data->action) {
            case 'register':
                // Check if username or email already exists
                $query = "SELECT id FROM users WHERE username = :username OR email = :email";
                $stmt = $db->prepare($query);
                $stmt->bindParam(":username", $data->username);
                $stmt->bindParam(":email", $data->email);
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    echo json_encode(array("message" => "Username or email already exists."));
                    exit();
                }
                
                // Hash password
                $hashed_password = password_hash($data->password, PASSWORD_DEFAULT);
                
                // Insert new user
                $query = "INSERT INTO users (username, password, email) VALUES (:username, :password, :email)";
                $stmt = $db->prepare($query);
                
                $stmt->bindParam(":username", $data->username);
                $stmt->bindParam(":password", $hashed_password);
                $stmt->bindParam(":email", $data->email);
                
                if($stmt->execute()) {
                    echo json_encode(array(
                        "message" => "User registered successfully.",
                        "user_id" => $db->lastInsertId()
                    ));
                } else {
                    echo json_encode(array("message" => "Unable to register user."));
                }
                break;
                
            case 'login':
                $query = "SELECT id, username, password FROM users WHERE username = :username";
                $stmt = $db->prepare($query);
                $stmt->bindParam(":username", $data->username);
                $stmt->execute();
                
                if ($stmt->rowCount() > 0) {
                    $row = $stmt->fetch();
                    if (password_verify($data->password, $row['password'])) {
                        echo json_encode(array(
                            "message" => "Login successful.",
                            "user_id" => $row['id'],
                            "username" => $row['username']
                        ));
                    } else {
                        echo json_encode(array("message" => "Invalid password."));
                    }
                } else {
                    echo json_encode(array("message" => "User not found."));
                }
                break;
                
            default:
                echo json_encode(array("message" => "Invalid action."));
                break;
        }
    } else {
        echo json_encode(array("message" => "No action specified."));
    }
} else {
    echo json_encode(array("message" => "Invalid request method."));
}
?> 