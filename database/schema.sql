-- Statistical Calculator Database Schema
-- Run this file to create the required database and tables

CREATE DATABASE IF NOT EXISTS stat_calculator;
USE stat_calculator;

-- Main calculations table
CREATE TABLE IF NOT EXISTS calculations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_session VARCHAR(255) NOT NULL,
    input_data TEXT NOT NULL,
    input_method ENUM('manual', 'voice', 'ocr', 'csv', 'sample') DEFAULT 'manual',
    mean_value DECIMAL(15,6),
    median_value DECIMAL(15,6),
    mode_value VARCHAR(255),
    std_deviation_pop DECIMAL(15,6),
    std_deviation_sample DECIMAL(15,6),
    variance_pop DECIMAL(15,6),
    variance_sample DECIMAL(15,6),
    q1_value DECIMAL(15,6),
    q2_value DECIMAL(15,6),
    q3_value DECIMAL(15,6),
    iqr_value DECIMAL(15,6),
    class_width DECIMAL(15,6),
    num_classes INT DEFAULT 5,
    data_count INT,
    data_min DECIMAL(15,6),
    data_max DECIMAL(15,6),
    data_range DECIMAL(15,6),
    ai_insights JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (user_session),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Voice input logs table
CREATE TABLE IF NOT EXISTS voice_input_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    calculation_id INT,
    transcript TEXT,
    numbers_detected JSON,
    duration_seconds INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (calculation_id) REFERENCES calculations(id) ON DELETE CASCADE,
    INDEX idx_calculation (calculation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- OCR input logs table
CREATE TABLE IF NOT EXISTS ocr_input_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    calculation_id INT,
    raw_text TEXT,
    numbers_detected JSON,
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (calculation_id) REFERENCES calculations(id) ON DELETE CASCADE,
    INDEX idx_calculation (calculation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- File upload logs table (PDF & CSV)
CREATE TABLE IF NOT EXISTS file_upload_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    calculation_id INT NULL,
    file_type ENUM('csv', 'pdf') NOT NULL,
    filename VARCHAR(500) NOT NULL,
    file_size INT DEFAULT 0,
    extracted_text TEXT,
    numbers_detected JSON,
    processing_time_ms INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (calculation_id) REFERENCES calculations(id) ON DELETE SET NULL,
    INDEX idx_file_type (file_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User theme preferences table
CREATE TABLE IF NOT EXISTS user_themes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_session VARCHAR(255) NOT NULL,
    theme_name VARCHAR(100) NOT NULL,
    is_custom BOOLEAN DEFAULT FALSE,
    theme_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session (user_session)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data for testing (optional)
-- INSERT INTO calculations (user_session, input_data, mean_value, median_value, mode_value, data_count)
-- VALUES ('test-session', '10, 20, 30, 40, 50', 30.0, 30.0, 'No mode', 5);

-- Alter existing calculations table to add 'pdf' and 'ai_text' to input_method if needed
-- ALTER TABLE calculations MODIFY COLUMN input_method ENUM('manual', 'voice', 'ocr', 'csv', 'pdf', 'ai_text', 'sample') DEFAULT 'manual';

-- AI interaction logs table
CREATE TABLE IF NOT EXISTS ai_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_session VARCHAR(255) NOT NULL,
    interaction_type ENUM('extraction', 'query', 'insight') NOT NULL,
    input_text TEXT,
    ai_response TEXT,
    tokens_used INT DEFAULT 0,
    processing_time_ms INT DEFAULT 0,
    is_fallback BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (user_session),
    INDEX idx_type (interaction_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Natural language queries log
CREATE TABLE IF NOT EXISTS nl_queries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    calculation_id INT,
    question TEXT NOT NULL,
    answer TEXT,
    visualization_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (calculation_id) REFERENCES calculations(id) ON DELETE CASCADE,
    INDEX idx_calculation (calculation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI insights cache table
CREATE TABLE IF NOT EXISTS insights_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data_hash VARCHAR(64) NOT NULL,
    insights JSON,
    summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 24 HOUR),
    UNIQUE KEY idx_hash (data_hash),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
