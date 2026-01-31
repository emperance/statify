const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        const dbDir = path.join(__dirname, '../database');

        // Ensure database directory exists
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        const dbPath = path.join(dbDir, 'statify.sqlite');

        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('SQLite Database Error:', err.message);
            } else {
                console.log('Connected to SQLite database.');
                this.initTables();
            }
        });
    }

    initTables() {
        // Calculation History Table
        this.db.run(`CREATE TABLE IF NOT EXISTS calculation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            input_data TEXT,
            result_json TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Voice Input Logs Table
        this.db.run(`CREATE TABLE IF NOT EXISTS voice_input_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            calculation_id INTEGER,
            transcript TEXT,
            numbers_detected TEXT,
            duration_seconds REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // File Upload Logs Table
        this.db.run(`CREATE TABLE IF NOT EXISTS file_upload_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            file_size INTEGER,
            row_count INTEGER,
            processed_data TEXT,
            upload_time DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // OCR Logs Table
        this.db.run(`CREATE TABLE IF NOT EXISTS ocr_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            raw_text TEXT,
            numbers_detected TEXT,
            confidence_score REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }

    // Save calculation history
    saveCalculation(inputData, resultJson) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO calculation_history (input_data, result_json) VALUES (?, ?)`;
            this.db.run(sql, [inputData, JSON.stringify(resultJson)], function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // Save voice log
    saveVoiceLog(transcript, numbers, duration, calculationId = null) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO voice_input_logs (calculation_id, transcript, numbers_detected, duration_seconds) VALUES (?, ?, ?, ?)`;
            this.db.run(sql, [calculationId, transcript, JSON.stringify(numbers), duration], function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // Save file log
    saveFileLog(filename, fileSize, rowCount, processedData) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO file_upload_logs (filename, file_size, row_count, processed_data) VALUES (?, ?, ?, ?)`;
            this.db.run(sql, [filename, fileSize, rowCount, JSON.stringify(processedData)], function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // Save OCR log
    saveOcrLog(rawText, numbers, confidence = 0) {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO ocr_logs (raw_text, numbers_detected, confidence_score) VALUES (?, ?, ?)`;
            this.db.run(sql, [rawText, JSON.stringify(numbers), confidence], function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // Get History (Limit 10)
    getHistory(limit = 10) {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM calculation_history ORDER BY id DESC LIMIT ?`;
            this.db.all(sql, [limit], (err, rows) => {
                if (err) reject(err);
                else {
                    // Parse JSON strings back to objects
                    const history = rows.map(row => ({
                        ...row,
                        result_json: JSON.parse(row.result_json)
                    }));
                    resolve(history);
                }
            });
        });
    }
}

module.exports = new Database();
