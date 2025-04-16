-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 16, 2025 at 09:40 AM
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
-- Table structure for table `medicines`
--

CREATE TABLE `medicines` (
  `item_no` int(11) NOT NULL,
  `drug_description` varchar(255) NOT NULL,
  `brand_name` varchar(255) NOT NULL,
  `lot_batch_no` varchar(255) NOT NULL,
  `expiry_date` date NOT NULL,
  `physical_balance` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medicines`
--

INSERT INTO `medicines` (`item_no`, `drug_description`, `brand_name`, `lot_batch_no`, `expiry_date`, `physical_balance`) VALUES
(54, 'Paracetamol', 'Nike', '221', '1111-01-11', 5000),
(55, 'LUSARTAN', 'Nike', '552', '2025-03-21', 2),
(56, 'Biogisic', 'N/A', '500', '2025-03-29', 999),
(57, 'Tambal sa Ubo', '1111', 'Unknown', '2029-12-28', 1000),
(58, 'test-updated', 'test-updated', '521', '2025-03-29', 900),
(59, 'Tambal ni Popois', 'Gaming Nike', '202', '2025-04-30', 1000);

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
-- Indexes for table `medicines`
--
ALTER TABLE `medicines`
  ADD PRIMARY KEY (`item_no`);

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
-- AUTO_INCREMENT for table `medicines`
--
ALTER TABLE `medicines`
  MODIFY `item_no` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
