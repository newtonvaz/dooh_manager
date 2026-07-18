<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$url = 'https://yjwgsxedgechoicdunik.supabase.co';
$key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlqd2dzeGVkZ2VjaG9pY2R1bmlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDMyNjMxNCwiZXhwIjoyMDk5OTAyMzE0fQ.RlXxJv9OJah_-OYUHoXfy_XAknZU4ywl3OuZXJD-HJM';

function camelToSnake($str) {
  $str = lcfirst($str);
  return strtolower(preg_replace('/(?<![A-Z])[A-Z]/', '_$0', $str));
}

function mapKeys($obj) {
  $r = [];
  foreach ($obj as $k => $v) {
    $r[camelToSnake($k)] = $v;
  }
  return $r;
}

function upsert($url, $key, $table, $rows) {
  $ch = curl_init($url . '/rest/v1/' . $table . '?on_conflict=id');
  curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
      'apikey: ' . $key,
      'Authorization: Bearer ' . $key,
      'Content-Type: application/json',
      'Prefer: resolution=merge-duplicates',
    ],
    CURLOPT_POSTFIELDS => json_encode($rows),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
  ]);
  $res = curl_exec($ch);
  $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return ($http >= 200 && $http < 300) ? null : ($res ?: "HTTP $http");
}

$tables = [
  'groups.json'       => 'groups',
  'categories.json'   => 'categories',
  'content.json'      => 'content',
  'playlists.json'    => 'playlists',
  'players.json'      => 'players',
  'schedules.json'    => 'schedules',
  'activities.json'   => 'activities',
  'playback_log.json' => 'playback_logs',
];

echo '<pre>';
echo 'Seeding Supabase database from JSON files...' . "\n\n";

foreach ($tables as $file => $table) {
  $path = __DIR__ . '/Data/' . $file;
  if (!file_exists($path)) {
    echo "Skip $file (not found)\n";
    continue;
  }
  $json = json_decode(file_get_contents($path), true);
  if (!$json || !is_array($json) || count($json) === 0) {
    echo "Skip $file (empty or invalid)\n";
    continue;
  }
  $data = array_map('mapKeys', $json);
  $err = upsert($url, $key, $table, $data);
  if ($err) {
    echo "Error seeding $table: $err\n";
  } else {
    echo "Seeded " . count($data) . " rows into $table\n";
  }
}

echo "\nSeed complete.\n";
echo '</pre>';
