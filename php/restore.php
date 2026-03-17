<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$backupDir = __DIR__ . '/../data/backups/';
$backupFile = $backupDir . ($_GET['id'] ?? '');

if (file_exists($backupFile)) {
    echo file_get_contents($backupFile);
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Backup no encontrado']);
}
?>