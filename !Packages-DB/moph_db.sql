-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 08, 2025 at 10:40 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `moph_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `archived_medicines`
--

CREATE TABLE `archived_medicines` (
  `id` int(11) NOT NULL,
  `original_item_no` int(11) NOT NULL,
  `drug_description` varchar(255) NOT NULL,
  `brand_name` varchar(255) NOT NULL,
  `lot_batch_no` varchar(100) NOT NULL,
  `expiry_date` date NOT NULL,
  `physical_balance` int(11) NOT NULL,
  `reason` varchar(255) DEFAULT 'Manually archived',
  `type` enum('active','expired') NOT NULL,
  `archived_at` datetime DEFAULT current_timestamp(),
  `archived_by` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `archived_medicines`
--

INSERT INTO `archived_medicines` (`id`, `original_item_no`, `drug_description`, `brand_name`, `lot_batch_no`, `expiry_date`, `physical_balance`, `reason`, `type`, `archived_at`, `archived_by`) VALUES
(129, 89, 'Omeprazole 20mg', 'Losec      ', 'O802     ', '2025-06-07', 200, 'Manually archived', 'active', '2025-05-09 04:38:20', NULL),
(130, 94, 'Metoprolol 50mg', 'Betaloc    ', 'MT901    ', '2028-12-15', 10000, 'Manually archived', 'active', '2025-05-09 04:38:22', NULL),
(131, 87, 'Metformin 500mg', 'Glucophage ', 'M177     ', '2025-07-25', 10000, 'Manually archived', 'active', '2025-05-09 04:38:24', NULL),
(132, 88, 'Losartan 50mg ', 'Cozaar     ', 'L490     ', '2025-09-27', 600, 'Manually archived', 'active', '2025-05-09 04:38:26', NULL),
(133, 97, 'Loperamide 2mg', 'Imodium    ', 'LPM909   ', '2029-03-09', 10, 'Manually archived', 'active', '2025-05-09 04:38:28', NULL),
(134, 106, 'Losartan 50mg', 'Cozaar', 'L321', '2024-10-01', 300, 'Auto-expired', 'expired', '2025-05-09 04:38:46', NULL),
(135, 115, 'Loperamide 2mg', 'Imodium', 'LPM799', '2023-05-05', 250, 'Auto-expired', 'expired', '2025-05-09 04:38:47', NULL),
(136, 105, 'Metformin 500mg', 'Glucophage', 'M166', '2024-03-31', 120, 'Auto-expired', 'expired', '2025-05-09 04:38:48', NULL),
(137, 112, 'Metoprolol 50mg', 'Betaloc', 'MT800', '2024-11-11', 980, 'Auto-expired', 'expired', '2025-05-09 04:38:49', NULL),
(138, 98, 'Paracetamol 500mg', 'Biogesic   ', 'B089     ', '2022-08-13', 10000, 'Auto-expired', 'expired', '2025-05-09 04:38:51', NULL),
(139, 101, 'Paracetamol 500mg', 'Biogesic', 'B089', '2024-04-10', 150, 'Auto-expired', 'expired', '2025-05-09 04:38:53', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `expired_medicines`
--

CREATE TABLE `expired_medicines` (
  `id` int(11) NOT NULL,
  `original_item_no` int(11) NOT NULL,
  `drug_description` varchar(255) NOT NULL,
  `brand_name` varchar(255) NOT NULL,
  `lot_batch_no` varchar(100) NOT NULL,
  `expiry_date` date NOT NULL,
  `physical_balance` int(11) NOT NULL,
  `reason` varchar(255) DEFAULT 'Expired',
  `expired_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_archived` tinyint(1) DEFAULT 0,
  `archived_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `expired_medicines`
--

INSERT INTO `expired_medicines` (`id`, `original_item_no`, `drug_description`, `brand_name`, `lot_batch_no`, `expiry_date`, `physical_balance`, `reason`, `expired_at`, `is_archived`, `archived_at`) VALUES
(99, 99, 'Amoxicillin 500mg ', 'Amoxil     ', 'A198     ', '2022-05-14', 10000, 'Auto-expired', '2025-05-08 20:35:55', 0, NULL),
(103, 102, 'Amoxicillin 500mg', 'Amoxil', 'A198', '2023-11-01', 220, 'Auto-expired', '2025-05-08 20:36:53', 0, NULL),
(104, 103, 'Ibuprofen 400mg', 'Advil', 'IB101', '2024-08-20', 175, 'Auto-expired', '2025-05-08 20:36:53', 0, NULL),
(105, 104, 'Cetirizine 10mg', 'Virlix', 'C672', '2023-12-12', 340, 'Auto-expired', '2025-05-08 20:36:53', 0, NULL),
(108, 107, 'Omeprazole 20mg', 'Losec', 'O751', '2023-09-15', 500, 'Auto-expired', '2025-05-08 20:36:53', 0, NULL),
(109, 108, 'Amlodipine 5mg', 'Norvasc', 'A601', '2024-12-01', 180, 'Auto-expired', '2025-05-08 20:36:53', 0, NULL),
(110, 109, 'Salbutamol Syrup', 'Ventolin', 'S391', '2024-07-07', 210, 'Auto-expired', '2025-05-08 20:36:53', 0, NULL),
(111, 110, 'Clopidogrel 75mg', 'Plavix', 'CL220', '2023-10-18', 600, 'Auto-expired', '2025-05-08 20:36:53', 0, NULL),
(112, 111, 'Azithromycin 250mg', 'Zithromax', 'AZ142', '2024-05-10', 450, 'Auto-expired', '2025-05-08 20:36:53', 0, NULL),
(114, 113, 'Vitamin C 500mg', 'Cecon', 'VITC03', '2024-01-22', 360, 'Auto-expired', '2025-05-08 20:36:53', 0, NULL),
(115, 114, 'Ferrous Sulfate 325mg', 'Fer-In-Sol', 'FERR15', '2023-08-30', 400, 'Auto-expired', '2025-05-08 20:36:53', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `medicines`
--

CREATE TABLE `medicines` (
  `item_no` int(11) NOT NULL,
  `drug_description` varchar(255) NOT NULL,
  `brand_name` varchar(255) NOT NULL,
  `lot_batch_no` varchar(100) NOT NULL,
  `expiry_date` date NOT NULL,
  `physical_balance` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medicines`
--

INSERT INTO `medicines` (`item_no`, `drug_description`, `brand_name`, `lot_batch_no`, `expiry_date`, `physical_balance`, `created_at`, `updated_at`) VALUES
(84, 'Amoxicillin 500mg ', 'Amoxil     ', 'A256     ', '2025-06-07', 1000, '2025-05-08 20:24:13', '2025-05-08 20:24:13'),
(85, 'Ibuprofen 400mg', 'Advil      ', 'IB333    ', '2025-06-07', 1006, '2025-05-08 20:24:46', '2025-05-08 20:24:46'),
(86, 'Cetirizine 10mg', 'Virlix     ', 'C984     ', '2025-05-30', 10000, '2025-05-08 20:25:07', '2025-05-08 20:25:07'),
(90, 'Amlodipine 5mg', 'Norvasc    ', 'A669     ', '2025-06-07', 200, '2025-05-08 20:26:24', '2025-05-08 20:26:24'),
(92, 'Clopidogrel 75mg', 'Plavix     ', 'CL321    ', '2027-12-17', 95, '2025-05-08 20:26:58', '2025-05-08 20:26:58'),
(93, 'Azithromycin 250mg', 'Zithromax  ', 'AZ204    ', '2031-09-26', 10000, '2025-05-08 20:27:15', '2025-05-08 20:27:15'),
(96, 'Ferrous Sulfate 325mg', 'Fer-In-Sol', 'FERR22   ', '2028-10-26', 10000, '2025-05-08 20:28:13', '2025-05-08 20:28:13');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password`, `created_at`) VALUES
(11, 'Test', 'User', 'user@gmail.com', '$2b$10$wcQAAfgr3VKsnGR.Tq4he.wUV7F.nNosu2ybHpy1ZkuWWL6Aj3G96', '2025-04-23 18:41:07');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `archived_medicines`
--
ALTER TABLE `archived_medicines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_original_item` (`original_item_no`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_archived_at` (`archived_at`);

--
-- Indexes for table `expired_medicines`
--
ALTER TABLE `expired_medicines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_original_item` (`original_item_no`),
  ADD KEY `idx_expiry` (`expiry_date`),
  ADD KEY `idx_archive_status` (`is_archived`);

--
-- Indexes for table `medicines`
--
ALTER TABLE `medicines`
  ADD PRIMARY KEY (`item_no`),
  ADD UNIQUE KEY `unique_medicine` (`drug_description`,`brand_name`,`lot_batch_no`),
  ADD KEY `idx_expiry` (`expiry_date`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `archived_medicines`
--
ALTER TABLE `archived_medicines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=140;

--
-- AUTO_INCREMENT for table `expired_medicines`
--
ALTER TABLE `expired_medicines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=117;

--
-- AUTO_INCREMENT for table `medicines`
--
ALTER TABLE `medicines`
  MODIFY `item_no` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=116;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
