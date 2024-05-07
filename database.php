<?php
require_once 'config.php';

// Função para verificar se o usuário existe
function user_exists($username)
{
    global $db;

    $query = $db->prepare("SELECT COUNT(id) FROM users WHERE username = :username");
    $query->bindParam(':username', $username, PDO::PARAM_STR);
    $query->execute();

    return $query->fetchColumn() > 0;
}

// Função para cadastrar o usuário
function register($username, $password)
{
    global $db;

    // Salvar a senha criptografada no banco de dados
    $password = password_hash($password, PASSWORD_DEFAULT);

    $query = $db->prepare("INSERT INTO users (username, password) VALUES (:username, :password)");
    $query->bindParam(':username', $username, PDO::PARAM_STR);
    $query->bindParam(':password', $password, PDO::PARAM_STR);

    return $query->execute();
}

// Função para verificar a senha
function check_password($username, $password)
{
    global $db;

    $query = $db->prepare("SELECT COUNT(id) FROM users WHERE username = :username");
    $query->bindParam(':username', $username, PDO::PARAM_STR);
    $query->execute();
    $count = $query->fetchColumn();

    if ($count > 0) {
        $query = $db->prepare("SELECT password FROM users WHERE username = :username");
        $query->bindParam(':username', $username, PDO::PARAM_STR);
        $query->execute();
        $hashed_password = $query->fetchColumn();

        return password_verify($password, $hashed_password);
    }

    return false;
}

// Função para obter o ID do usuário
function get_user_id($username)
{
    global $db;

    $query = $db->prepare("SELECT id FROM users WHERE username = :username");
    $query->bindParam(':username', $username, PDO::PARAM_STR);
    $query->execute();

    return $query->fetchColumn();
}
?>