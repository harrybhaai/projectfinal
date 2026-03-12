-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS campus_placement;
USE campus_placement;

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  roll_no VARCHAR(20) NOT NULL UNIQUE,
  department VARCHAR(100) NOT NULL,
  cgpa DECIMAL(4,2) NOT NULL,
  skills TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(100) NOT NULL,
  role VARCHAR(100) NOT NULL,
  min_cgpa DECIMAL(4,2) NOT NULL,
  package VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO companies (company_name, role, min_cgpa, package) VALUES
  ('TechSoft',  'Software Developer',          7.50, '8 LPA'),
  ('Infosys',   'System Engineer',             6.00, '4.5 LPA'),
  ('TCS',       'Assistant System Engineer',   6.00, '3.5 LPA'),
  ('Wipro',     'Project Engineer',            6.50, '5 LPA'),
  ('Google',    'Software Engineer',           9.00, '45 LPA'),
  ('Amazon',    'SDE-1',                       8.00, '30 LPA'),
  ('Microsoft', 'Software Development Intern', 8.50, '25 LPA');
