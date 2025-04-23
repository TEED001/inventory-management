-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 23, 2025 at 09:12 PM
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
(61, 41, 'LUSARTAN', 'test', 'test', '2025-04-26', 1000, 'Manually archived', 'active', '2025-04-24 01:32:30', NULL),
(75, 36, 'Tambal sa Bato', 'test', 'test', '2025-04-22', 1000, 'Auto-expired', 'expired', '2025-04-24 01:38:57', NULL);

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
(63, 42, 'test', 'test', 'test', '2025-03-31', 100, 'Restored from archive', '2025-04-23 17:40:12', 0, NULL);

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
(38, 'Test Bato', 'test', 'test', '2025-04-26', 100, '2025-04-23 17:36:14', '2025-04-23 17:36:14');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=88;

--
-- AUTO_INCREMENT for table `expired_medicines`
--
ALTER TABLE `expired_medicines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT for table `medicines`
--
ALTER TABLE `medicines`
  MODIFY `item_no` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
