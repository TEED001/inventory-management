-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 22, 2025 at 11:47 AM
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
(26, 22, 'test2', 'test2', 'test2', '2025-04-22', 1000, 'Manually archived', 'active', '2025-04-21 20:55:20', NULL),
(30, 25, 'Bato', 'bato', 'bato', '2025-04-01', 1, 'Auto-expired', 'expired', '2025-04-21 22:06:53', NULL),
(32, 24, 'test', 'test', '15000', '2025-04-23', 90, 'Manually archived', 'active', '2025-04-22 17:46:30', NULL),
(33, 0, 'test3', 'test3', 'test3', '2025-04-16', 1000, 'Restored from archive', 'expired', '2025-04-22 17:46:40', NULL);

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
(27, 21, 'test1', 'test1', 'test1', '2025-03-01', 900, 'Restored from archive', '2025-04-21 13:25:28', 0, NULL);

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
(26, 'test', 'test', 'test', '2025-04-24', 1, '2025-04-22 09:21:20', '2025-04-22 09:23:46'),
(27, 'test', 'test1', 'test', '2025-04-30', 123123, '2025-04-22 09:22:19', '2025-04-22 09:22:19'),
(28, 'aa', 'aa', 'aa', '2025-04-23', 111, '2025-04-22 09:22:57', '2025-04-22 09:22:57'),
(29, 'test', 'test11', 'test', '2025-05-07', 0, '2025-04-22 09:45:17', '2025-04-22 09:45:17');

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
(1, 'John', 'Doe', 'john@example.com', 'password123', '2025-03-21 15:50:37'),
(2, 'qwe', 'qwe', 'qwe@qwe', '$2b$10$j3WpS4b.FAiqS5TpAowkkuThOfxR9bJ6K66NPC8ua0MHeCdVsW1PS', '2025-03-22 12:02:37'),
(3, 'Cyrus', 'Dagoc', 'cyrus@gmail.com', '$2b$10$uuumNQ8kh5jU9GTMB0RcVOMnVF3fJ/.cocpgO8zBtYvrBsIYZtECy', '2025-03-22 12:16:17'),
(4, 'one', 'one', 'one@gmail.com', '$2b$10$Cb6NkwJI9htxC19Mh.CrdOCVbEOQHTP3x9ViqChx3dc.aUkPXnZ1u', '2025-03-28 15:50:01'),
(5, 'two', 'two', 'two@gmail.com', '$2b$10$J0L1.rKFqFiQPQsJIBOryOv2zzXSK.wBzWxcIMd7ycNv3K8II3/Xu', '2025-03-28 15:50:46'),
(6, 'Popois', 'pois', 'pois@gmail.com', '$2b$10$wHIcZE70ljfQXdOSIcoX2uxvGp5RoOQ80QO3LYagKzdV5T.wPWWQy', '2025-03-28 16:09:04');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `expired_medicines`
--
ALTER TABLE `expired_medicines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `medicines`
--
ALTER TABLE `medicines`
  MODIFY `item_no` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
