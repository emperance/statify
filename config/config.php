<?php
/**
 * Application Configuration
 * Database and Groq AI API settings
 */

// ============================================
// DATABASE CONFIGURATION
// ============================================
define('DB_HOST', 'localhost');
define('DB_NAME', 'stat_calculator');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// ============================================
// GROQ API CONFIGURATION
// ============================================
define('AI_PROVIDER', 'groq');
define('GROQ_API_KEY', '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');
define('GROQ_API_URL', 'https://api.groq.com/openai/v1/chat/completions');

// AI Settings
define('AI_MODEL', 'llama-3.3-70b-versatile');
define('AI_TIMEOUT', 30);
define('AI_MAX_RETRIES', 3);
define('AI_TEMPERATURE', 0.3);

// ============================================
// APPLICATION SETTINGS
// ============================================
define('MAX_UPLOAD_SIZE', 10 * 1024 * 1024); // 10MB
define('ALLOWED_FILE_TYPES', ['pdf', 'csv']);
define('SESSION_LIFETIME', 86400); // 24 hours

// Enable error reporting for development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

/**
 * Get database connection
 * @return PDO|null Database connection instance
 */
function getDBConnection()
{
    static $pdo = null;

    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            return null;
        }
    }

    return $pdo;
}

/**
 * Check if database connection is available
 * @return bool
 */
function isDatabaseAvailable()
{
    $pdo = getDBConnection();
    return $pdo !== null;
}
