<?php
session_start();
require 'config.php';

if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
}

$user_id = $_SESSION['user_id'];

$expenses_stmt = $conn->prepare("SELECT * FROM expenses WHERE user_id = ?");
$expenses_stmt->bind_param("i", $user_id);
$expenses_stmt->execute();
$expenses_result = $expenses_stmt->get_result();

$incomes_stmt = $conn->prepare("SELECT * FROM incomes WHERE user_id = ?");
$incomes_stmt->bind_param("i", $user_id);
$incomes_stmt->execute();
$incomes_result = $incomes_stmt->get_result();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resultados</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <section class="container">
        <div class="logo">
            <h1>Controle Financeiro</h1>
        </div>
        <div class="results">
            <div class="expenses">
                <h2>Despesas</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Categoria</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        while ($expense = $expenses_result->fetch_assoc()) {
                            echo "<tr>";
                            echo "<td>{$expense['date']}</td>";
                            echo "<td>{$expense['description']}</td>";
                            echo "<td>{$expense['category']}</td>";
                            echo "<td>{$expense['amount']}</td>";
                            echo "</tr>";
                        }
                        ?>
                    </tbody>
                </table>
            </div>
            <div class="incomes">
                <h2>Receitas</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        while ($income = $incomes_result->fetch_assoc()) {
                            echo "<tr>";
                            echo "<td>{$income['date']}</td>";
                            echo "<td>{$income['description']}</td>";
                            echo "<td>{$income['amount']}</td>";
                            echo "</tr>";
                        }
                        ?>
                    </tbody>
                </table>
            </div>
        </div>
    </section>
    <script src="scripts.js"></script>
</body>
</html>