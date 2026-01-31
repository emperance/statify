# Luxury Glassmorphism Statistical Calculator

A beautiful, mobile-responsive statistical probability calculator with elegant glassmorphism design.

![Preview](https://via.placeholder.com/600x400/1a1a2e/d4af37?text=Statistical+Calculator)

## Features

- **Statistical Calculations**
  - Mean (average)
  - Median (middle value)
  - Mode (most frequent)
  - Standard Deviation (population & sample)
  - Variance (population & sample)
  - Quartiles (Q1, Q2, Q3)
  - Interquartile Range (IQR)
  - Class Width

- **Design**
  - Luxury glassmorphism aesthetic
  - Responsive mobile-first design
  - Smooth animations
  - Gold/rose gold accent colors
  - Dark theme

## Requirements

- PHP 8.0+
- MySQL 8.0+ (optional, for history persistence)
- Modern web browser

## Installation

### 1. Clone or Download

Place the project in your web server's document root:
```bash
# For XAMPP
cp -r stat-calculator /Applications/XAMPP/htdocs/

# For MAMP
cp -r stat-calculator /Applications/MAMP/htdocs/

# For Laravel Valet/Herd
# Just place in your Sites folder
```

### 2. Database Setup (Optional)

To enable calculation history, create the database:

```bash
mysql -u root -p < database/schema.sql
```

Or run this SQL manually:
```sql
CREATE DATABASE IF NOT EXISTS stat_calculator;
USE stat_calculator;

CREATE TABLE calculations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_session VARCHAR(255) NOT NULL,
    input_data TEXT NOT NULL,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (user_session),
    INDEX idx_created (created_at)
);
```

### 3. Configure Database Connection

Edit `config/database.php` if needed:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'stat_calculator');
define('DB_USER', 'root');
define('DB_PASS', '');
```

### 4. Access the Application

Open in browser:
```
http://localhost/stat-calculator/
```

## Usage

1. **Enter Data**: Type or paste numbers separated by commas, spaces, or newlines
2. **Set Classes**: Adjust the number of classes for class width calculation (optional)
3. **Calculate**: Click the "Calculate" button
4. **View Results**: Results appear in animated glass cards
5. **Copy**: Click any result card to copy its value

## Project Structure

```
stat-calculator/
├── index.php              # Main application
├── config/
│   └── database.php       # Database configuration
├── api/
│   ├── calculate.php      # Server-side calculations
│   └── save.php           # Save to database
├── assets/
│   ├── css/
│   │   ├── style.css      # Main styles
│   │   └── animations.css # Animations
│   └── js/
│       ├── calculator.js  # Calculation logic
│       └── app.js         # UI controller
└── README.md
```

## Browser Support

- Chrome/Edge (latest 2 versions)
- Safari (iOS 12+)
- Firefox (latest 2 versions)
- Samsung Internet

## License

MIT License - feel free to use and modify!
