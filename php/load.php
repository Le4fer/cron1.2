<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$dataFile = __DIR__ . '/../data/storage.json';

if (file_exists($dataFile)) {
    $data = file_get_contents($dataFile);
    echo $data;
} else {
    // Datos por defecto
    echo json_encode([
        'user' => [
            'name' => 'Usuario',
            'streak' => 0,
            'joinedDate' => date('c')
        ],
        'goals' => [],
        'journals' => [],
        'stats' => [
            'completedGoals' => 0,
            'totalEntries' => 0,
            'currentStreak' => 0
        ]
    ]);
}
?>