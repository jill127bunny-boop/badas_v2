-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 26, 2025 at 02:02 AM
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
-- Database: `badas`
--

-- --------------------------------------------------------

--
-- Table structure for table `pemain`
--

CREATE TABLE `pemain` (
  `id` int(11) NOT NULL,
  `nama` varchar(50) DEFAULT NULL,
  `tier` enum('S','A') DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `status_marker` varchar(50) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pemain`
--

INSERT INTO `pemain` (`id`, `nama`, `tier`, `photo_url`, `status_marker`) VALUES
(1, 'Sony', 'S', 'images/Sony.png', ''),
(2, 'Agus', 'S', 'images/Model.png', ''),
(3, 'Dolly', 'S', 'images/Model.png', ''),
(4, 'Adi', 'S', 'images/Model.png', ''),
(5, 'Farid', 'S', 'images/Model.png', ''),
(6, 'Nuril', 'S', 'images/Model.png', ''),
(7, 'Adnan', 'S', 'images/Model.png', ''),
(8, 'Wisnu', 'S', 'images/Model.png', ''),
(9, 'Idan', 'A', 'images/Model.png', ''),
(10, 'Andre', 'A', 'images/Model.png', ''),
(11, 'Ikhsan', 'A', 'images/Model.png', ''),
(12, 'Arizz', 'A', 'images/Model.png', ''),
(13, 'Denny', 'A', 'images/Model.png', ''),
(14, 'Yudha', 'A', 'images/Model.png', ''),
(15, 'Aprizal', 'A', 'images/Model.png', ''),
(16, 'Kiting', 'A', 'images/Model.png', '');

-- --------------------------------------------------------

--
-- Table structure for table `riwayat_pasangan`
--

CREATE TABLE `riwayat_pasangan` (
  `id` int(11) NOT NULL,
  `pemain_a` varchar(50) NOT NULL,
  `pemain_b` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `pemain`
--
ALTER TABLE `pemain`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nama` (`nama`);

--
-- Indexes for table `riwayat_pasangan`
--
ALTER TABLE `riwayat_pasangan`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `pair_unique` (`pemain_a`,`pemain_b`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `pemain`
--
ALTER TABLE `pemain`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `riwayat_pasangan`
--
ALTER TABLE `riwayat_pasangan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
