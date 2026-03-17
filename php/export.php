<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $format = $input['format'] ?? 'json';
    $data = $input['data'] ?? [];
    
    switch ($format) {
        case 'json':
            header('Content-Disposition: attachment; filename="cronosmind_export_' . date('Y-m-d') . '.json"');
            echo json_encode($data, JSON_PRETTY_PRINT);
            break;
            
        case 'csv':
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="cronosmind_export_' . date('Y-m-d') . '.csv"');
            
            $output = fopen('php://output', 'w');
            
            // Exportar journals
            fputcsv($output, ['Fecha', 'Texto', 'Timestamp', 'Tipo']);
            foreach ($data['journals'] as $date => $entries) {
                foreach ($entries as $entry) {
                    fputcsv($output, [$date, $entry['text'], $entry['timestamp'], $entry['type']]);
                }
            }
            
            fputcsv($output, []); // Línea en blanco
            
            // Exportar metas
            fputcsv($output, ['ID', 'Título', 'Tipo', 'Completada', 'Fecha', 'Creada']);
            foreach ($data['goals'] as $goal) {
                fputcsv($output, [
                    $goal['id'],
                    $goal['title'],
                    $goal['type'],
                    $goal['completed'] ? 'Sí' : 'No',
                    $goal['date'],
                    $goal['createdAt']
                ]);
            }
            
            fclose($output);
            break;
            
        case 'pdf':
            // Requiere biblioteca adicional como dompdf
            // Por simplicidad, exportamos como HTML
            header('Content-Type: text/html');
            ?>
            <!DOCTYPE html>
            <html>
            <head>
                <title>CronosMind Export</title>
                <style>
                    body { font-family: Arial; margin: 40px; }
                    h1 { color: #2563eb; }
                    .section { margin: 30px 0; }
                    .entry { border-left: 3px solid #2563eb; padding: 10px; margin: 10px 0; }
                    .goal { display: inline-block; padding: 5px 10px; margin: 5px; border-radius: 5px; }
                </style>
            </head>
            <body>
                <h1>CronosMind - Reporte <?php echo date('Y-m-d'); ?></h1>
                
                <div class="section">
                    <h2>Estadísticas</h2>
                    <p>Metas Completadas: <?php echo $data['stats']['completedGoals']; ?></p>
                    <p>Total Registros: <?php echo count($data['journals']); ?></p>
                    <p>Racha Actual: <?php echo $data['stats']['currentStreak']; ?></p>
                </div>
                
                <div class="section">
                    <h2>Registros Diarios</h2>
                    <?php foreach ($data['journals'] as $date => $entries): ?>
                        <h3><?php echo $date; ?></h3>
                        <?php foreach ($entries as $entry): ?>
                            <div class="entry">
                                <p><?php echo htmlspecialchars($entry['text']); ?></p>
                                <small><?php echo $entry['timestamp']; ?></small>
                            </div>
                        <?php endforeach; ?>
                    <?php endforeach; ?>
                </div>
                
                <div class="section">
                    <h2>Metas</h2>
                    <?php foreach ($data['goals'] as $goal): ?>
                        <div class="goal" style="background: <?php echo $goal['completed'] ? '#22c55e' : '#f97316'; ?>20">
                            <?php echo htmlspecialchars($goal['title']); ?> (<?php echo $goal['type']; ?>)
                        </div>
                    <?php endforeach; ?>
                </div>
            </body>
            </html>
            <?php
            break;
            
        default:
            echo json_encode(['error' => 'Formato no soportado']);
    }
}
?>