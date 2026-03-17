<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');

$backupDir = __DIR__ . '/../data/backups/';

if (!file_exists($backupDir)) {
    mkdir($backupDir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Guardar backup
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($input) {
        $filename = $backupDir . 'backup_' . date('Y-m-d_H-i-s') . '.json';
        file_put_contents($filename, json_encode($input, JSON_PRETTY_PRINT));
        
        // Limpiar backups antiguos (mantener últimos 20)
        $backups = glob($backupDir . '*.json');
        usort($backups, function($a, $b) {
            return filemtime($b) - filemtime($a);
        });
        
        while (count($backups) > 20) {
            $oldest = array_pop($backups);
            unlink($oldest);
        }
        
        echo json_encode(['success' => true, 'file' => basename($filename)]);
    }
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Listar backups
    $backups = glob($backupDir . '*.json');
    $backupList = [];
    
    foreach ($backups as $backup) {
        $backupList[] = [
            'name' => basename($backup),
            'date' => date('Y-m-d H:i:s', filemtime($backup)),
            'size' => filesize($backup)
        ];
    }
    
    // Ordenar por fecha descendente
    usort($backupList, function($a, $b) {
        return strtotime($b['date']) - strtotime($a['date']);
    });
    
    echo json_encode($backupList);
}
?>