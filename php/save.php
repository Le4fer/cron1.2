<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$dataDir = __DIR__ . '/../data/';

// Crear directorio si no existe
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0777, true);
}

$dataFile = $dataDir . 'storage.json';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if ($input) {
        // Crear backup automático
        if (file_exists($dataFile)) {
            $backupDir = $dataDir . 'backups/';
            if (!file_exists($backupDir)) {
                mkdir($backupDir, 0777, true);
            }
            
            $backupFile = $backupDir . 'backup_' . date('Y-m-d_H-i-s') . '.json';
            copy($dataFile, $backupFile);
            
            // Mantener solo los últimos 10 backups
            $backups = glob($backupDir . '*.json');
            usort($backups, function($a, $b) {
                return filemtime($b) - filemtime($a);
            });
            
            while (count($backups) > 10) {
                $oldest = array_pop($backups);
                unlink($oldest);
            }
        }
        
        // Guardar datos actuales
        $result = file_put_contents($dataFile, json_encode($input, JSON_PRETTY_PRINT));
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Datos guardados correctamente']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Error al guardar los datos']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>