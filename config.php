<?php
$servername = "sqlite:database.db";
$username = "";
$password = "";

try {
    $conn = new PDO($servername);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo "Erro ao conectar ao banco de dados: " . $e->getMessage();
}
?>