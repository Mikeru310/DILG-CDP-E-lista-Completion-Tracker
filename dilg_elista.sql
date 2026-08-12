-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 01, 2026 at 11:33 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dilg_elista`
--

-- --------------------------------------------------------

--
-- Table structure for table `fp_progress`
--

CREATE TABLE `fp_progress` (
  `id` int(11) NOT NULL,
  `municipality` varchar(50) NOT NULL,
  `step_number` int(11) NOT NULL,
  `category` varchar(50) NOT NULL,
  `status` tinyint(1) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `municipalities`
--

CREATE TABLE `municipalities` (
  `municipal_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `municipalities`
--

INSERT INTO `municipalities` (`municipal_id`, `name`) VALUES
(6, 'Altavas'),
(7, 'Balete'),
(2, 'Banga'),
(8, 'Batan'),
(9, 'Buruanga'),
(10, 'Ibajay'),
(1, 'Kalibo'),
(4, 'Lezo'),
(11, 'Libacao'),
(12, 'Madalag'),
(5, 'Makato'),
(13, 'Malay'),
(14, 'Malinao'),
(15, 'Nabas'),
(16, 'New Washington'),
(3, 'Numancia'),
(17, 'Tangalan');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `recipient_role` varchar(30) NOT NULL,
  `actor_user_id` int(11) NOT NULL,
  `actor_name` varchar(100) NOT NULL,
  `municipality` varchar(80) NOT NULL,
  `step_number` int(11) NOT NULL,
  `category` varchar(40) NOT NULL,
  `message` varchar(255) NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `recipient_role`, `actor_user_id`, `actor_name`, `municipality`, `step_number`, `category`, `message`, `is_read`, `created_at`) VALUES
(1, 'ENCODER', 6, 'mikeru', 'Tangalan', 1, 'Economic', 'mikeru uploaded a file: Tangalan — Step 1 (Economic)', 1, '2026-02-12 23:51:28'),
(2, 'ENCODER', 6, 'mikeru', 'Tangalan', 1, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 1 (Infrastructure)', 1, '2026-02-15 20:46:07'),
(3, 'ENCODER', 6, 'mikeru', 'Tangalan', 1, 'Environmental', 'mikeru uploaded a file: Tangalan — Step 1 (Environmental)', 1, '2026-02-15 20:46:13'),
(4, 'ENCODER', 6, 'mikeru', 'Tangalan', 1, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 1 (Institutional)', 1, '2026-02-15 20:46:16'),
(5, 'ENCODER', 5, 'LegendaryMaoMao20', 'Malinao', 1, 'Social', 'LegendaryMaoMao20 uploaded a file: Malinao — Step 1 (Social)', 1, '2026-02-15 20:51:09'),
(6, 'ENCODER', 5, 'LegendaryMaoMao20', 'Malinao', 1, 'Economic', 'LegendaryMaoMao20 uploaded a file: Malinao — Step 1 (Economic)', 1, '2026-02-15 20:51:14'),
(7, 'ENCODER', 5, 'LegendaryMaoMao20', 'Malinao', 1, 'Infrastructure', 'LegendaryMaoMao20 uploaded a file: Malinao — Step 1 (Infrastructure)', 1, '2026-02-15 20:51:24'),
(8, 'ENCODER', 5, 'LegendaryMaoMao20', 'Malinao', 1, 'Environmental', 'LegendaryMaoMao20 uploaded a file: Malinao — Step 1 (Environmental)', 1, '2026-02-15 20:51:28'),
(9, 'ENCODER', 5, 'LegendaryMaoMao20', 'Malinao', 1, 'Institutional', 'LegendaryMaoMao20 uploaded a file: Malinao — Step 1 (Institutional)', 1, '2026-02-15 20:51:35'),
(10, 'ENCODER', 6, 'mikeru', 'Tangalan', 1, 'Social', 'mikeru uploaded a file: Tangalan — Step 1 (Social)', 1, '2026-02-16 21:23:03'),
(11, 'ENCODER', 6, 'mikeru', 'Tangalan', 1, 'Economic', 'mikeru uploaded a file: Tangalan — Step 1 (Economic)', 1, '2026-02-16 22:43:37'),
(12, 'ENCODER', 6, 'mikeru', 'Tangalan', 1, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 1 (Infrastructure)', 1, '2026-02-16 22:43:41'),
(13, 'ENCODER', 6, 'mikeru', 'Tangalan', 1, 'Social', 'mikeru uploaded a file: Tangalan — Step 1 (Social)', 1, '2026-02-16 22:48:57'),
(14, 'ENCODER', 6, 'mikeru', 'Tangalan', 1, 'Economic', 'mikeru uploaded a file: Tangalan — Step 1 (Economic)', 1, '2026-02-17 00:04:21'),
(15, 'ENCODER', 6, 'mikeru', 'Tangalan', 1, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 1 (Infrastructure)', 1, '2026-02-17 19:37:24'),
(16, 'ENCODER', 6, 'mikeru', 'Tangalan', 1, 'Environmental', 'mikeru uploaded a file: Tangalan — Step 1 (Environmental)', 1, '2026-02-17 19:37:29'),
(17, 'ENCODER', 6, 'mikeru', 'Tangalan', 1, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 1 (Institutional)', 1, '2026-02-17 19:37:35'),
(18, 'ENCODER', 8, 'altavas1', 'Altavas', 1, 'Social', 'altavas1 uploaded a file: Altavas — Step 1 (Social)', 1, '2026-02-17 20:15:59'),
(19, 'ENCODER', 8, 'altavas1', 'Altavas', 1, 'Economic', 'altavas1 uploaded a file: Altavas — Step 1 (Economic)', 1, '2026-02-17 20:16:03'),
(20, 'ENCODER', 8, 'altavas1', 'Altavas', 1, 'Infrastructure', 'altavas1 uploaded a file: Altavas — Step 1 (Infrastructure)', 1, '2026-02-19 13:09:35'),
(21, 'ENCODER', 6, 'mikeru', 'Tangalan', 2, 'Social', 'mikeru uploaded a file: Tangalan — Step 2 (Social)', 1, '2026-02-20 09:35:10'),
(22, 'ENCODER', 6, 'mikeru', 'Tangalan', 2, 'Economic', 'mikeru uploaded a file: Tangalan — Step 2 (Economic)', 1, '2026-02-20 11:06:11'),
(23, 'ENCODER', 8, 'altavas1', 'Altavas', 1, 'Environmental', 'altavas1 uploaded a file: Altavas — Step 1 (Environmental)', 1, '2026-02-20 11:17:17'),
(24, 'ENCODER', 8, 'altavas1', 'Altavas', 1, 'Institutional', 'altavas1 uploaded a file: Altavas — Step 1 (Institutional)', 1, '2026-02-20 11:19:06'),
(25, 'ENCODER', 6, 'mikeru', 'Tangalan', 2, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 2 (Infrastructure)', 1, '2026-02-20 11:24:47'),
(26, 'ENCODER', 6, 'mikeru', 'Tangalan', 2, 'Environmental', 'mikeru uploaded a file: Tangalan — Step 2 (Environmental)', 1, '2026-02-20 11:25:00'),
(27, 'ENCODER', 6, 'mikeru', 'Tangalan', 2, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 2 (Institutional)', 1, '2026-02-20 11:25:06'),
(28, 'ENCODER', 6, 'mikeru', 'Tangalan', 3, 'Social', 'mikeru uploaded a file: Tangalan — Step 3 (Social)', 1, '2026-02-20 11:51:42'),
(29, 'ENCODER', 6, 'mikeru', 'Tangalan', 3, 'Economic', 'mikeru uploaded a file: Tangalan — Step 3 (Economic)', 1, '2026-02-20 13:12:28'),
(30, 'ENCODER', 6, 'mikeru', 'Tangalan', 3, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 3 (Infrastructure)', 1, '2026-02-20 13:32:06'),
(31, 'ENCODER', 8, 'altavas1', 'Altavas', 2, 'Social', 'altavas1 uploaded a file: Altavas — Step 2 (Social)', 1, '2026-02-20 13:38:12'),
(32, 'ENCODER', 8, 'altavas1', 'Altavas', 2, 'Economic', 'altavas1 uploaded a file: Altavas — Step 2 (Economic)', 1, '2026-02-20 14:11:12'),
(33, 'ENCODER', 8, 'altavas1', 'Altavas', 2, 'Infrastructure', 'altavas1 uploaded a file: Altavas — Step 2 (Infrastructure)', 1, '2026-02-20 14:18:43'),
(34, 'ENCODER', 8, 'altavas1', 'Altavas', 2, 'Infrastructure', 'altavas1 uploaded a file: Altavas — Step 2 (Infrastructure)', 1, '2026-02-20 14:18:52'),
(35, 'ENCODER', 8, 'altavas1', 'Altavas', 2, 'Environmental', 'altavas1 uploaded a file: Altavas — Step 2 (Environmental)', 1, '2026-02-20 14:19:00'),
(36, 'ENCODER', 8, 'altavas1', 'Altavas', 2, 'Environmental', 'altavas1 uploaded a file: Altavas — Step 2 (Environmental)', 1, '2026-02-20 14:19:08'),
(37, 'ENCODER', 8, 'altavas1', 'Altavas', 2, 'Institutional', 'altavas1 uploaded a file: Altavas — Step 2 (Institutional)', 1, '2026-02-20 14:19:17'),
(38, 'ENCODER', 6, 'mikeru', 'Tangalan', 3, 'Environmental', 'mikeru uploaded a file: Tangalan — Step 3 (Environmental)', 1, '2026-02-23 09:04:24'),
(39, 'ENCODER', 6, 'mikeru', 'Tangalan', 3, 'Environmental', 'mikeru uploaded a file: Tangalan — Step 3 (Environmental)', 1, '2026-02-23 09:05:36'),
(40, 'ENCODER', 6, 'mikeru', 'Tangalan', 3, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 3 (Institutional)', 1, '2026-02-23 09:08:21'),
(41, 'ENCODER', 6, 'mikeru', 'Tangalan', 3, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 3 (Institutional)', 1, '2026-02-23 09:10:04'),
(42, 'ENCODER', 6, 'mikeru', 'Tangalan', 4, 'Social', 'mikeru uploaded a file: Tangalan — Step 4 (Social)', 1, '2026-02-23 13:06:42'),
(43, 'ENCODER', 6, 'mikeru', 'Tangalan', 4, 'Economic', 'mikeru uploaded a file: Tangalan — Step 4 (Economic)', 1, '2026-02-23 13:09:02'),
(44, 'ENCODER', 6, 'mikeru', 'Tangalan', 4, 'Economic', 'mikeru uploaded a file: Tangalan — Step 4 (Economic)', 1, '2026-02-23 13:10:19'),
(45, 'ENCODER', 6, 'mikeru', 'Tangalan', 4, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 4 (Infrastructure)', 1, '2026-02-23 13:13:08'),
(46, 'ENCODER', 6, 'mikeru', 'Tangalan', 4, 'Environmental', 'mikeru uploaded a file: Tangalan — Step 4 (Environmental)', 1, '2026-02-23 13:15:24'),
(47, 'ENCODER', 6, 'mikeru', 'Tangalan', 4, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 4 (Institutional)', 1, '2026-02-23 13:20:27'),
(48, 'ENCODER', 6, 'mikeru', 'Tangalan', 4, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 4 (Institutional)', 1, '2026-02-23 13:20:31'),
(49, 'ENCODER', 8, 'altavas1', 'Altavas', 3, 'Social', 'altavas1 uploaded a file: Altavas — Step 3 (Social)', 1, '2026-02-23 13:26:39'),
(50, 'ENCODER', 6, 'mikeru', 'Tangalan', 4, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 4 (Institutional)', 1, '2026-02-23 13:29:02'),
(51, 'ENCODER', 6, 'mikeru', 'Tangalan', 5, 'Social', 'mikeru uploaded a file: Tangalan — Step 5 (Social)', 1, '2026-02-23 13:29:46'),
(52, 'ENCODER', 6, 'mikeru', 'Tangalan', 5, 'Social', 'mikeru uploaded a file: Tangalan — Step 5 (Social)', 1, '2026-02-23 13:30:18'),
(53, 'ENCODER', 6, 'mikeru', 'Tangalan', 5, 'Economic', 'mikeru uploaded a file: Tangalan — Step 5 (Economic)', 1, '2026-02-23 13:53:00'),
(54, 'ENCODER', 6, 'mikeru', 'Tangalan', 5, 'Economic', 'mikeru uploaded a file: Tangalan — Step 5 (Economic)', 1, '2026-02-23 13:54:09'),
(55, 'ENCODER', 6, 'mikeru', 'Tangalan', 5, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 5 (Infrastructure)', 1, '2026-02-23 13:58:08'),
(56, 'ENCODER', 6, 'mikeru', 'Tangalan', 5, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 5 (Infrastructure)', 1, '2026-02-23 13:59:09'),
(57, 'ENCODER', 6, 'mikeru', 'Tangalan', 5, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 5 (Infrastructure)', 1, '2026-02-23 13:59:17'),
(58, 'ENCODER', 6, 'mikeru', 'Tangalan', 5, 'Environmental', 'mikeru uploaded a file: Tangalan — Step 5 (Environmental)', 1, '2026-02-24 11:10:19'),
(59, 'ENCODER', 8, 'altavas1', 'Altavas', 3, 'Economic', 'altavas1 uploaded a file: Altavas — Step 3 (Economic)', 1, '2026-02-24 13:21:34'),
(60, 'ENCODER', 8, 'altavas1', 'Altavas', 3, 'Infrastructure', 'altavas1 uploaded a file: Altavas — Step 3 (Infrastructure)', 1, '2026-02-24 13:21:37'),
(61, 'ENCODER', 6, 'mikeru', 'Tangalan', 5, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 5 (Institutional)', 1, '2026-02-24 14:41:18'),
(62, 'ENCODER', 6, 'mikeru', 'Tangalan', 6, 'Social', 'mikeru uploaded a file: Tangalan — Step 6 (Social)', 1, '2026-02-24 15:46:11'),
(63, 'ENCODER', 6, 'mikeru', 'Tangalan', 6, 'Economic', 'mikeru uploaded a file: Tangalan — Step 6 (Economic)', 1, '2026-02-25 10:19:48'),
(64, 'ENCODER', 6, 'mikeru', 'Tangalan', 6, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 6 (Infrastructure)', 1, '2026-02-25 11:07:54'),
(65, 'ENCODER', 6, 'mikeru', 'Tangalan', 6, 'Environmental', 'mikeru uploaded a file: Tangalan — Step 6 (Environmental)', 1, '2026-02-25 11:08:02'),
(66, 'ENCODER', 6, 'mikeru', 'Tangalan', 6, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 6 (Institutional)', 1, '2026-02-25 11:08:07'),
(67, 'ENCODER', 6, 'mikeru', 'Tangalan', 7, 'Social', 'mikeru uploaded a file: Tangalan — Step 7 (Social)', 1, '2026-02-25 11:09:26'),
(68, 'ENCODER', 6, 'mikeru', 'Tangalan', 7, 'Economic', 'mikeru uploaded a file: Tangalan — Step 7 (Economic)', 1, '2026-02-25 11:09:30'),
(69, 'ENCODER', 6, 'mikeru', 'Tangalan', 7, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 7 (Infrastructure)', 1, '2026-02-25 11:09:44'),
(70, 'ENCODER', 6, 'mikeru', 'Tangalan', 7, 'Environmental', 'mikeru uploaded a file: Tangalan — Step 7 (Environmental)', 1, '2026-02-25 11:09:49'),
(71, 'ENCODER', 6, 'mikeru', 'Tangalan', 7, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 7 (Institutional)', 1, '2026-02-25 11:09:55'),
(72, 'ENCODER', 6, 'mikeru', 'Tangalan', 8, 'Social', 'mikeru uploaded a file: Tangalan — Step 8 (Social)', 1, '2026-02-25 11:11:31'),
(73, 'ENCODER', 6, 'mikeru', 'Tangalan', 8, 'Economic', 'mikeru uploaded a file: Tangalan — Step 8 (Economic)', 1, '2026-02-25 11:11:38'),
(74, 'ENCODER', 6, 'mikeru', 'Tangalan', 8, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 8 (Infrastructure)', 1, '2026-02-25 11:11:42'),
(75, 'ENCODER', 6, 'mikeru', 'Tangalan', 8, 'Environmental', 'mikeru uploaded a file: Tangalan — Step 8 (Environmental)', 1, '2026-02-25 11:11:53'),
(76, 'ENCODER', 6, 'mikeru', 'Tangalan', 8, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 8 (Institutional)', 1, '2026-02-25 11:11:58'),
(77, 'ENCODER', 6, 'mikeru', 'Tangalan', 9, 'Social', 'mikeru uploaded a file: Tangalan — Step 9 (Social)', 1, '2026-02-25 11:12:28'),
(78, 'ENCODER', 6, 'mikeru', 'Tangalan', 9, 'Economic', 'mikeru uploaded a file: Tangalan — Step 9 (Economic)', 1, '2026-02-25 11:12:32'),
(79, 'ENCODER', 6, 'mikeru', 'Tangalan', 9, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 9 (Infrastructure)', 1, '2026-02-25 11:12:38'),
(80, 'ENCODER', 6, 'mikeru', 'Tangalan', 9, 'Environmental', 'mikeru uploaded a file: Tangalan — Step 9 (Environmental)', 1, '2026-02-25 11:12:43'),
(81, 'ENCODER', 6, 'mikeru', 'Tangalan', 9, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 9 (Institutional)', 1, '2026-02-25 11:12:48'),
(82, 'ENCODER', 6, 'mikeru', 'Tangalan', 10, 'Social', 'mikeru uploaded a file: Tangalan — Step 10 (Social)', 1, '2026-02-25 11:15:31'),
(83, 'ENCODER', 6, 'mikeru', 'Tangalan', 10, 'Economic', 'mikeru uploaded a file: Tangalan — Step 10 (Economic)', 1, '2026-02-25 11:15:35'),
(84, 'ENCODER', 6, 'mikeru', 'Tangalan', 10, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 10 (Infrastructure)', 1, '2026-02-25 11:15:41'),
(85, 'ENCODER', 6, 'mikeru', 'Tangalan', 10, 'Environmental', 'mikeru uploaded a file: Tangalan — Step 10 (Environmental)', 1, '2026-02-25 11:15:46'),
(86, 'ENCODER', 6, 'mikeru', 'Tangalan', 10, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 10 (Institutional)', 1, '2026-02-25 11:15:55'),
(87, 'ENCODER', 6, 'mikeru', 'Tangalan', 11, 'Social', 'mikeru uploaded a file: Tangalan — Step 11 (Social)', 1, '2026-02-25 11:45:02'),
(88, 'ENCODER', 6, 'mikeru', 'Tangalan', 11, 'Economic', 'mikeru uploaded a file: Tangalan — Step 11 (Economic)', 1, '2026-02-25 11:45:06'),
(89, 'ENCODER', 6, 'mikeru', 'Tangalan', 11, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 11 (Infrastructure)', 1, '2026-02-25 11:45:10'),
(90, 'ENCODER', 6, 'mikeru', 'Tangalan', 11, 'Environmental', 'mikeru uploaded a file: Tangalan — Step 11 (Environmental)', 1, '2026-02-25 11:45:14'),
(91, 'ENCODER', 6, 'mikeru', 'Tangalan', 11, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 11 (Institutional)', 1, '2026-02-25 11:45:27'),
(92, 'ENCODER', 6, 'mikeru', 'Tangalan', 12, 'Social', 'mikeru uploaded a file: Tangalan — Step 12 (Social)', 1, '2026-02-25 11:46:56'),
(93, 'ENCODER', 6, 'mikeru', 'Tangalan', 12, 'Economic', 'mikeru uploaded a file: Tangalan — Step 12 (Economic)', 1, '2026-02-25 11:47:05'),
(94, 'ENCODER', 6, 'mikeru', 'Tangalan', 12, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 12 (Infrastructure)', 1, '2026-02-25 11:47:09'),
(95, 'ENCODER', 6, 'mikeru', 'Tangalan', 12, 'Environmental', 'mikeru uploaded a file: Tangalan — Step 12 (Environmental)', 1, '2026-02-25 11:47:13'),
(96, 'ENCODER', 6, 'mikeru', 'Tangalan', 12, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 12 (Institutional)', 1, '2026-02-25 11:47:23'),
(97, 'ENCODER', 6, 'mikeru', 'Tangalan', 13, 'Social', 'mikeru uploaded a file: Tangalan — Step 13 (Social)', 1, '2026-02-25 11:48:44'),
(98, 'ENCODER', 6, 'mikeru', 'Tangalan', 13, 'Economic', 'mikeru uploaded a file: Tangalan — Step 13 (Economic)', 1, '2026-02-25 11:49:21'),
(99, 'ENCODER', 6, 'mikeru', 'Tangalan', 13, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 13 (Infrastructure)', 1, '2026-02-25 11:49:26'),
(100, 'ENCODER', 6, 'mikeru', 'Tangalan', 13, 'Environmental', 'mikeru uploaded a file: Tangalan — Step 13 (Environmental)', 1, '2026-02-25 11:49:34'),
(101, 'ENCODER', 6, 'mikeru', 'Tangalan', 13, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 13 (Institutional)', 1, '2026-02-25 11:49:38'),
(102, 'ENCODER', 6, 'mikeru', 'Tangalan', 14, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 14 (Institutional)', 1, '2026-02-25 11:50:47'),
(103, 'ENCODER', 6, 'mikeru', 'Tangalan', 15, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 15 (Institutional)', 1, '2026-02-25 11:51:22'),
(104, 'ENCODER', 6, 'mikeru', 'Tangalan', 16, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 16 (Institutional)', 1, '2026-02-26 09:42:59'),
(105, 'ENCODER', 6, 'mikeru', 'Tangalan', 17, 'Social', 'mikeru uploaded a file: Tangalan — Step 17 (Social)', 1, '2026-02-26 10:47:02'),
(106, 'ENCODER', 6, 'mikeru', 'Tangalan', 17, 'Economic', 'mikeru uploaded a file: Tangalan — Step 17 (Economic)', 1, '2026-02-26 10:47:07'),
(107, 'ENCODER', 6, 'mikeru', 'Tangalan', 17, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 17 (Infrastructure)', 1, '2026-02-26 10:47:12'),
(108, 'ENCODER', 6, 'mikeru', 'Tangalan', 17, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 17 (Infrastructure)', 1, '2026-02-26 10:49:47'),
(109, 'ENCODER', 6, 'mikeru', 'Tangalan', 17, 'Social', 'mikeru uploaded a file: Tangalan — Step 17 (Social)', 1, '2026-02-26 10:56:20'),
(110, 'ENCODER', 8, 'altavas1', 'Altavas', 3, 'Environmental', 'altavas1 uploaded a file: Altavas — Step 3 (Environmental)', 1, '2026-02-26 11:36:21'),
(111, 'ENCODER', 8, 'altavas1', 'Altavas', 3, 'Environmental', 'altavas1 uploaded a file: Altavas — Step 3 (Environmental)', 1, '2026-02-26 11:37:05'),
(112, 'ENCODER', 8, 'altavas1', 'Altavas', 3, 'Institutional', 'altavas1 uploaded a file: Altavas — Step 3 (Institutional)', 1, '2026-02-26 11:44:31'),
(113, 'ENCODER', 8, 'altavas1', 'Altavas', 3, 'Institutional', 'altavas1 uploaded a file: Altavas — Step 3 (Institutional)', 1, '2026-02-26 11:46:49'),
(114, 'ENCODER', 6, 'mikeru', 'Tangalan', 17, 'Environmental', 'mikeru uploaded a file: Tangalan — Step 17 (Environmental)', 1, '2026-02-26 14:20:26'),
(115, 'ENCODER', 14, 'ibajay1', 'Ibajay', 1, 'Social', 'ibajay1 uploaded a file: Ibajay — Step 1 (Social)', 1, '2026-02-26 14:25:05'),
(116, 'ENCODER', 14, 'ibajay1', 'Ibajay', 1, 'Economic', 'ibajay1 uploaded a file: Ibajay — Step 1 (Economic)', 1, '2026-02-26 14:25:10'),
(117, 'ENCODER', 14, 'ibajay1', 'Ibajay', 1, 'Infrastructure', 'ibajay1 uploaded a file: Ibajay — Step 1 (Infrastructure)', 1, '2026-02-26 14:25:15'),
(118, 'ENCODER', 14, 'ibajay1', 'Ibajay', 1, 'Environmental', 'ibajay1 uploaded a file: Ibajay — Step 1 (Environmental)', 1, '2026-02-26 14:25:26'),
(119, 'ENCODER', 14, 'ibajay1', 'Ibajay', 1, 'Infrastructure', 'ibajay1 uploaded a file: Ibajay — Step 1 (Infrastructure)', 1, '2026-02-26 14:28:33'),
(120, 'ENCODER', 14, 'ibajay1', 'Ibajay', 1, 'Environmental', 'ibajay1 uploaded a file: Ibajay — Step 1 (Environmental)', 1, '2026-02-26 14:28:49'),
(121, 'ENCODER', 6, 'mikeru', 'Tangalan', 17, 'Environmental', 'mikeru uploaded a file: Tangalan — Step 17 (Environmental)', 1, '2026-02-26 15:42:07'),
(122, 'ENCODER', 6, 'mikeru', 'Tangalan', 17, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 17 (Institutional)', 1, '2026-02-26 16:07:39'),
(123, 'ENCODER', 6, 'mikeru', 'Tangalan', 18, 'Social', 'mikeru uploaded a file: Tangalan — Step 18 (Social)', 1, '2026-02-26 16:12:09'),
(124, 'ENCODER', 6, 'mikeru', 'Tangalan', 18, 'Economic', 'mikeru uploaded a file: Tangalan — Step 18 (Economic)', 1, '2026-02-28 00:42:49'),
(125, 'ENCODER', 6, 'mikeru', 'Tangalan', 18, 'Economic', 'mikeru uploaded a file: Tangalan — Step 18 (Economic)', 1, '2026-02-28 00:43:45'),
(126, 'ENCODER', 6, 'mikeru', 'Tangalan', 18, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 18 (Infrastructure)', 1, '2026-02-28 00:47:56'),
(127, 'ENCODER', 6, 'mikeru', 'Tangalan', 18, 'Environmental', 'mikeru uploaded a file: Tangalan — Step 18 (Environmental)', 1, '2026-02-28 00:47:58'),
(128, 'ENCODER', 6, 'mikeru', 'Tangalan', 18, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 18 (Institutional)', 1, '2026-02-28 00:48:03'),
(129, 'ENCODER', 6, 'mikeru', 'Tangalan', 18, 'Infrastructure', 'mikeru uploaded a file: Tangalan — Step 18 (Infrastructure)', 1, '2026-02-28 00:49:20'),
(130, 'ENCODER', 6, 'mikeru', 'Tangalan', 18, 'Institutional', 'mikeru uploaded a file: Tangalan — Step 18 (Institutional)', 1, '2026-02-28 00:49:25'),
(131, 'ENCODER', 6, 'mikeru', 'Tangalan', 19, 'Social', 'mikeru uploaded a file: Tangalan — Step 19 (Social)', 1, '2026-03-01 17:58:47'),
(132, 'ENCODER', 6, 'mikeru', 'Tangalan', 19, 'Economic', 'mikeru uploaded a file: Tangalan — Step 19 (Economic)', 1, '2026-03-01 17:58:50');

-- --------------------------------------------------------

--
-- Table structure for table `submissions`
--

CREATE TABLE `submissions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `municipality_id` int(11) NOT NULL,
  `step_no` int(11) NOT NULL,
  `category` enum('Social','Economic','Infrastructure','Environmental','Institutional') NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `file_path` varchar(255) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `file_name` varchar(255) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `revision_remarks` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `submissions`
--

INSERT INTO `submissions` (`id`, `user_id`, `municipality_id`, `step_no`, `category`, `status`, `file_path`, `uploaded_at`, `updated_at`, `file_name`, `approved_at`, `revision_remarks`) VALUES
(46, 6, 17, 1, 'Social', 'approved', 'uploads/user_6/step1_social_1771253337.docx', '2026-02-16 22:48:57', '2026-02-16 22:50:24', 'step1_social_1771248183.docx', NULL, NULL),
(47, 6, 17, 1, 'Economic', 'approved', 'uploads/user_6/step1_economic_1771257861.pdf', '2026-02-17 00:04:21', '2026-02-17 00:08:17', 'my cover letter.pdf', NULL, NULL),
(48, 6, 17, 1, 'Infrastructure', 'approved', 'uploads/user_6/step1_infrastructure_1771328244.pdf', '2026-02-17 19:37:24', '2026-02-17 19:38:02', '06 lab 1.pdf', NULL, NULL),
(49, 6, 17, 1, 'Environmental', 'approved', 'uploads/user_6/step1_environmental_1771328249.pdf', '2026-02-17 19:37:29', '2026-02-17 19:38:05', '03 lab 1 -MBT.pdf', NULL, NULL),
(50, 6, 17, 1, 'Institutional', 'approved', 'uploads/user_6/step1_institutional_1771328255.pdf', '2026-02-17 19:37:35', '2026-02-17 19:38:08', '03 assignment 1.pdf', NULL, NULL),
(51, 8, 6, 1, 'Social', 'approved', 'uploads/user_8/step1_social_1771330559.docx', '2026-02-17 20:15:59', '2026-02-17 20:17:12', '2026-IP_MOU_STI-FINAL-1 (1).docx', NULL, NULL),
(52, 8, 6, 1, 'Economic', 'approved', 'uploads/user_8/step1_economic_1771330563.docx', '2026-02-17 20:16:03', '2026-02-17 20:17:14', '2026-IP_MOU_STI-FINAL-1 (2).docx', NULL, NULL),
(53, 8, 6, 1, 'Infrastructure', 'approved', 'uploads/user_8/step1_infrastructure_1771477775.pdf', '2026-02-19 13:09:35', '2026-02-19 13:10:45', '06 Activity 1 in Web Systems and Technologies.pdf', NULL, NULL),
(54, 6, 17, 2, 'Social', 'approved', 'uploads/user_6/step2_social_1771551310.pdf', '2026-02-20 09:35:10', '2026-02-20 11:05:11', '(Illustrated_Classics)_Mark_Twain_-_Huckleberry_Finn-Saddleback_Educational_Publishing_(2007).pdf', NULL, NULL),
(55, 6, 17, 2, 'Economic', 'approved', 'uploads/user_6/step2_economic_1771556771.pdf', '2026-02-20 11:06:11', '2026-02-20 11:12:14', '09 Task Performance 1 in Management Information Systems2.pdf', NULL, NULL),
(56, 8, 6, 1, 'Environmental', 'approved', 'uploads/user_8/step1_environmental_1771557437.pdf', '2026-02-20 11:17:17', '2026-02-20 11:18:01', '04_Handout_3.pdf', NULL, NULL),
(57, 8, 6, 1, 'Institutional', 'approved', 'uploads/user_8/step1_institutional_1771557546.pdf', '2026-02-20 11:19:06', '2026-02-20 11:19:37', '(Illustrated_Classics)_Mark_Twain_-_Huckleberry_Finn-Saddleback_Educational_Publishing_(2007).pdf', NULL, NULL),
(58, 6, 17, 2, 'Infrastructure', 'approved', 'uploads/user_6/step2_infrastructure_1771557887.pdf', '2026-02-20 11:24:47', '2026-02-20 11:26:23', '04_Handout_2.pdf', NULL, NULL),
(59, 6, 17, 2, 'Environmental', 'approved', 'uploads/user_6/step2_environmental_1771557900.pdf', '2026-02-20 11:25:00', '2026-02-20 11:27:07', '04_Handout_1(10).pdf', NULL, NULL),
(60, 6, 17, 2, 'Institutional', 'approved', 'uploads/user_6/step2_institutional_1771557906.pdf', '2026-02-20 11:25:06', '2026-02-20 11:27:40', '09 Task Performance 1 in Management Information Systems2.pdf', NULL, NULL),
(61, 6, 17, 3, 'Social', 'approved', 'uploads/user_6/step3_social_1771559502.pdf', '2026-02-20 11:51:42', '2026-02-20 13:12:10', '06 Activity 1 in Web Systems and Technologies.pdf', NULL, NULL),
(62, 6, 17, 3, 'Economic', 'approved', 'uploads/user_6/step3_economic_1771564348.pdf', '2026-02-20 13:12:28', '2026-02-20 13:13:16', '04_Handout_1(10).pdf', NULL, NULL),
(63, 6, 17, 3, 'Infrastructure', 'approved', 'uploads/user_6/step3_infrastructure_1771565526.mp3', '2026-02-20 13:32:06', '2026-02-20 13:32:26', '11L-walking_sound_on_gra-1744474639393.mp3', NULL, NULL),
(64, 8, 6, 2, 'Social', 'approved', 'uploads/user_8/step2_social_1771565892.pdf', '2026-02-20 13:38:12', '2026-02-20 14:34:48', '04_Handout_1(10).pdf', NULL, NULL),
(65, 8, 6, 2, 'Economic', 'approved', 'uploads/user_8/step2_economic_1771567872.pdf', '2026-02-20 14:11:12', '2026-02-20 14:19:46', '08_Task_Performance_1_in_Information_Assurance_Security.pdf', NULL, NULL),
(66, 8, 6, 2, 'Infrastructure', 'approved', 'uploads/user_8/step2_infrastructure_1771568332.pdf', '2026-02-20 14:18:52', '2026-02-20 14:19:51', '04_Handout_2.pdf', NULL, NULL),
(68, 8, 6, 2, 'Environmental', 'approved', 'uploads/user_8/step2_environmental_1771568348.pdf', '2026-02-20 14:19:08', '2026-02-20 14:19:56', '04_Handout_2.pdf', NULL, NULL),
(70, 8, 6, 2, 'Institutional', 'approved', 'uploads/user_8/step2_institutional_1771568357.pdf', '2026-02-20 14:19:17', '2026-02-20 14:20:00', '04_Handout_3.pdf', NULL, NULL),
(71, 6, 17, 3, 'Environmental', 'approved', 'uploads/user_6/step3_environmental_1771808736.pdf', '2026-02-23 09:05:36', '2026-02-23 09:07:32', '08_Task_Performance_1_in_Information_Assurance_Security.pdf', NULL, NULL),
(73, 6, 17, 3, 'Institutional', 'approved', 'uploads/user_6/step3_institutional_1771809004.pdf', '2026-02-23 09:10:04', '2026-02-23 09:10:52', '04_Handout_2.pdf', NULL, NULL),
(75, 6, 17, 4, 'Social', 'approved', 'uploads/user_6/step4_social_1771823202.pptx', '2026-02-23 13:06:42', '2026-02-23 13:07:08', '05 Lab 1 - Security Awareness Training.pptx', NULL, NULL),
(76, 6, 17, 4, 'Economic', 'approved', 'uploads/user_6/step4_economic_1771823419.pdf', '2026-02-23 13:10:19', '2026-02-23 13:10:42', '05 Lab 1 - Security Awareness Reflection Paper.pdf', NULL, NULL),
(78, 6, 17, 4, 'Infrastructure', 'approved', 'uploads/user_6/step4_infrastructure_1771823588.pdf', '2026-02-23 13:13:08', '2026-02-23 13:17:28', '05 Lab 1 - Security Awareness Reflection Paper.pdf', NULL, NULL),
(79, 6, 17, 4, 'Environmental', 'approved', 'uploads/user_6/step4_environmental_1771823724.pdf', '2026-02-23 13:15:24', '2026-02-23 13:16:28', '05_Handout_1(2).pdf', NULL, NULL),
(80, 6, 17, 4, 'Institutional', 'approved', 'uploads/user_6/step4_institutional_1771824542.docx', '2026-02-23 13:29:02', '2026-02-23 13:29:27', '05 Lab 1 - Security Awareness Reflection Paper.docx', NULL, NULL),
(82, 8, 6, 3, 'Social', 'approved', 'uploads/user_8/step3_social_1771824399.pdf', '2026-02-23 13:26:39', '2026-02-23 13:27:13', '05 Lab 1 - Security Awareness Reflection Paper.pdf', NULL, NULL),
(84, 6, 17, 5, 'Social', 'approved', 'uploads/user_6/step5_social_1771824618.pdf', '2026-02-23 13:30:18', '2026-02-23 13:30:39', '05 Lab 1 - Security Awareness Training.pdf', NULL, NULL),
(86, 6, 17, 5, 'Economic', 'approved', 'uploads/user_6/step5_economic_20260223_065409_26d60b41.pdf', '2026-02-23 13:54:09', '2026-02-23 13:54:28', 'Just Dance 2016 Gdd.pdf', NULL, NULL),
(88, 6, 17, 5, 'Infrastructure', 'approved', 'uploads/user_6/step5_infrastructure_20260223_065917_511247c2.pdf', '2026-02-23 13:59:17', '2026-02-24 11:00:32', 'Dungeon Delicacies Infographic (version 1A).pdf', NULL, NULL),
(91, 6, 17, 5, 'Environmental', 'approved', 'uploads/user_6/step5_environmental_20260224_041019_bf4bd22f.pdf', '2026-02-24 11:10:19', '2026-02-24 11:59:49', 'Just Dance 2018 Documentation.pdf', NULL, 'dasdwasdasd'),
(92, 8, 6, 3, 'Economic', 'approved', 'uploads/user_8/step3_economic_20260224_062134_57cc905f.pdf', '2026-02-24 13:21:34', '2026-02-24 15:04:06', 'EMEA_Why_We_Watch_2.0_-_2024_Digital_Report.pdf', NULL, 'good job nigga'),
(93, 8, 6, 3, 'Infrastructure', 'approved', 'uploads/user_8/step3_infrastructure_20260224_062137_ecba415b.pdf', '2026-02-24 13:21:37', '2026-02-24 15:45:53', 'Just Dance 2018 Documentation.pdf', NULL, 'good game'),
(94, 6, 17, 5, 'Institutional', 'approved', 'uploads/user_6/step5_institutional_20260224_074118_b8d98c89.pdf', '2026-02-24 14:41:18', '2026-02-24 15:01:19', 'Just Dance 2016 Gdd.pdf', NULL, 'dawsfdfd'),
(95, 6, 17, 6, 'Social', 'approved', 'uploads/user_6/step6_social_20260224_084611_6fdaf07a.pdf', '2026-02-24 15:46:11', '2026-02-24 15:46:47', 'EMEA_Why_We_Watch_2.0_-_2024_Digital_Report.pdf', NULL, 'good'),
(96, 6, 17, 6, 'Economic', 'approved', 'uploads/user_6/step6_economic_20260225_031948_c83908b6.pdf', '2026-02-25 10:19:48', '2026-02-25 11:08:29', '05_Handout_1(2).pdf', NULL, NULL),
(97, 6, 17, 6, 'Infrastructure', 'approved', 'uploads/user_6/step6_infrastructure_20260225_040754_1de6654c.pdf', '2026-02-25 11:07:54', '2026-02-25 11:08:32', '05_Handout_1(2).pdf', NULL, NULL),
(98, 6, 17, 6, 'Environmental', 'approved', 'uploads/user_6/step6_environmental_20260225_040802_caf1df74.txt', '2026-02-25 11:08:02', '2026-02-25 11:08:36', '03assi1nettech2.txt', NULL, NULL),
(99, 6, 17, 6, 'Institutional', 'approved', 'uploads/user_6/step6_institutional_20260225_040807_4bdb3a5a.txt', '2026-02-25 11:08:07', '2026-02-25 11:08:39', '03quiz1websystech.txt', NULL, NULL),
(100, 6, 17, 7, 'Social', 'approved', 'uploads/user_6/step7_social_20260225_040926_23c76d01.txt', '2026-02-25 11:09:26', '2026-02-25 11:11:08', '05 task performance 1 in data comm(LINK).txt', NULL, NULL),
(101, 6, 17, 7, 'Economic', 'approved', 'uploads/user_6/step7_economic_20260225_040930_05e026f7.txt', '2026-02-25 11:09:30', '2026-02-25 11:11:11', '04 tp databaseaaaaaaaaaaaaaaaaa.txt', NULL, NULL),
(102, 6, 17, 7, 'Infrastructure', 'approved', 'uploads/user_6/step7_infrastructure_20260225_040944_4ecfa2a2.txt', '2026-02-25 11:09:44', '2026-02-25 11:11:15', '03tp1mis.txt', NULL, NULL),
(103, 6, 17, 7, 'Environmental', 'approved', 'uploads/user_6/step7_environmental_20260225_040949_681e0d83.txt', '2026-02-25 11:09:49', '2026-02-25 11:11:18', '03assi1nettech2.txt', NULL, NULL),
(104, 6, 17, 7, 'Institutional', 'approved', 'uploads/user_6/step7_institutional_20260225_040955_3ac2dab2.txt', '2026-02-25 11:09:55', '2026-02-25 11:11:20', '01AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA CAPSTONE AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA.txt', NULL, NULL),
(105, 6, 17, 8, 'Social', 'approved', 'uploads/user_6/step8_social_20260225_041131_44c51438.txt', '2026-02-25 11:11:31', '2026-02-25 11:12:09', '03tp1mis.txt', NULL, NULL),
(106, 6, 17, 8, 'Economic', 'approved', 'uploads/user_6/step8_economic_20260225_041138_852c2f71.txt', '2026-02-25 11:11:38', '2026-02-25 11:12:12', '01 SHIT I REMOVED.txt', NULL, NULL),
(107, 6, 17, 8, 'Infrastructure', 'approved', 'uploads/user_6/step8_infrastructure_20260225_041142_47059a7a.txt', '2026-02-25 11:11:42', '2026-02-25 11:12:14', '------ page 14 of 35 - manuscript.txt', NULL, NULL),
(108, 6, 17, 8, 'Environmental', 'approved', 'uploads/user_6/step8_environmental_20260225_041153_09c42fc0.txt', '2026-02-25 11:11:53', '2026-02-25 11:12:16', '04seatwproglang.txt', NULL, NULL),
(109, 6, 17, 8, 'Institutional', 'approved', 'uploads/user_6/step8_institutional_20260225_041158_18192910.txt', '2026-02-25 11:11:58', '2026-02-25 11:12:18', '05 lab app dev.txt', NULL, NULL),
(110, 6, 17, 9, 'Social', 'approved', 'uploads/user_6/step9_social_20260225_041228_2272fdf3.txt', '2026-02-25 11:12:28', '2026-02-25 11:14:15', '05 task performance 1 in data comm(LINK).txt', NULL, NULL),
(111, 6, 17, 9, 'Economic', 'approved', 'uploads/user_6/step9_economic_20260225_041232_b4a66435.txt', '2026-02-25 11:12:32', '2026-02-25 11:14:23', '04pptxinfoassu1.txt', NULL, NULL),
(112, 6, 17, 9, 'Infrastructure', 'approved', 'uploads/user_6/step9_infrastructure_20260225_041238_b91ad3eb.txt', '2026-02-25 11:12:38', '2026-02-25 11:14:31', '04pptxinfoassu1.txt', NULL, NULL),
(113, 6, 17, 9, 'Environmental', 'approved', 'uploads/user_6/step9_environmental_20260225_041243_171b3544.docx', '2026-02-25 11:12:43', '2026-02-25 11:14:47', 'A111111 AUTHORIZATION LETTER.docx', NULL, NULL),
(114, 6, 17, 9, 'Institutional', 'approved', 'uploads/user_6/step9_institutional_20260225_041248_2a94b550.txt', '2026-02-25 11:12:48', '2026-02-25 11:14:52', '07activity1and2appdev.txt', NULL, NULL),
(115, 6, 17, 10, 'Social', 'approved', 'uploads/user_6/step10_social_20260225_041531_ebdece36.txt', '2026-02-25 11:15:31', '2026-02-25 11:16:23', '------ page 14 of 35 - manuscript.txt', NULL, NULL),
(116, 6, 17, 10, 'Economic', 'approved', 'uploads/user_6/step10_economic_20260225_041535_5fe458ff.txt', '2026-02-25 11:15:35', '2026-02-25 11:16:27', '------ page 14 of 35 - manuscript.txt', NULL, NULL),
(117, 6, 17, 10, 'Infrastructure', 'approved', 'uploads/user_6/step10_infrastructure_20260225_041541_362f5f81.txt', '2026-02-25 11:15:41', '2026-02-25 11:16:30', '------ page 14 of 35 - manuscript.txt', NULL, NULL),
(118, 6, 17, 10, 'Environmental', 'approved', 'uploads/user_6/step10_environmental_20260225_041546_9852e28b.txt', '2026-02-25 11:15:46', '2026-02-25 11:16:33', '------ page 14 of 35 - manuscript.txt', NULL, NULL),
(119, 6, 17, 10, 'Institutional', 'approved', 'uploads/user_6/step10_institutional_20260225_041555_785a7ffd.txt', '2026-02-25 11:15:55', '2026-02-25 11:16:35', '03eLMSact2books.txt', NULL, NULL),
(120, 6, 17, 11, 'Social', 'approved', 'uploads/user_6/step11_social_20260225_044502_ee2dcaa8.txt', '2026-02-25 11:45:02', '2026-02-25 11:46:14', '01 SHIT I REMOVED.txt', NULL, NULL),
(121, 6, 17, 11, 'Economic', 'approved', 'uploads/user_6/step11_economic_20260225_044506_09d71146.txt', '2026-02-25 11:45:06', '2026-02-25 11:46:16', '01 SHIT I REMOVED.txt', NULL, NULL),
(122, 6, 17, 11, 'Infrastructure', 'approved', 'uploads/user_6/step11_infrastructure_20260225_044510_eb439686.txt', '2026-02-25 11:45:10', '2026-02-25 11:46:18', '01 SHIT I REMOVED.txt', NULL, NULL),
(123, 6, 17, 11, 'Environmental', 'approved', 'uploads/user_6/step11_environmental_20260225_044514_fa149d9c.txt', '2026-02-25 11:45:14', '2026-02-25 11:46:20', '01 SHIT I REMOVED.txt', NULL, NULL),
(124, 6, 17, 11, 'Institutional', 'approved', 'uploads/user_6/step11_institutional_20260225_044527_a48aa5cb.txt', '2026-02-25 11:45:27', '2026-02-25 11:46:21', '03act1books.txt', NULL, NULL),
(125, 6, 17, 12, 'Social', 'approved', 'uploads/user_6/step12_social_20260225_044656_355c57a9.txt', '2026-02-25 11:46:56', '2026-02-25 11:47:32', '01 SHIT I REMOVED.txt', NULL, NULL),
(126, 6, 17, 12, 'Economic', 'approved', 'uploads/user_6/step12_economic_20260225_044705_f7aafa10.txt', '2026-02-25 11:47:05', '2026-02-25 11:47:42', '07 lab 1 asia.txt', NULL, NULL),
(127, 6, 17, 12, 'Infrastructure', 'approved', 'uploads/user_6/step12_infrastructure_20260225_044709_f645f141.txt', '2026-02-25 11:47:09', '2026-02-25 11:47:47', 'bongo cat review steam owo.txt', NULL, NULL),
(128, 6, 17, 12, 'Environmental', 'approved', 'uploads/user_6/step12_environmental_20260225_044713_c3d4ff60.txt', '2026-02-25 11:47:13', '2026-02-25 11:47:52', 'bullshit aaaaaaaaaaaaaa.txt', NULL, NULL),
(129, 6, 17, 12, 'Institutional', 'approved', 'uploads/user_6/step12_institutional_20260225_044723_ab41b590.txt', '2026-02-25 11:47:23', '2026-02-25 11:47:57', 'seatwork shit.txt', NULL, NULL),
(130, 6, 17, 13, 'Social', 'approved', 'uploads/user_6/step13_social_20260225_044844_7a58cdb4.txt', '2026-02-25 11:48:44', '2026-02-25 11:49:55', '1q2w3e4r5t6y7u8i.txt', NULL, NULL),
(131, 6, 17, 13, 'Economic', 'approved', 'uploads/user_6/step13_economic_20260225_044921_0494320f.txt', '2026-02-25 11:49:21', '2026-02-25 11:50:01', '08 tp prof issues.txt', NULL, NULL),
(132, 6, 17, 13, 'Infrastructure', 'approved', 'uploads/user_6/step13_infrastructure_20260225_044926_7fff1d63.txt', '2026-02-25 11:49:26', '2026-02-25 11:50:07', '04seatwproglang.txt', NULL, NULL),
(133, 6, 17, 13, 'Environmental', 'approved', 'uploads/user_6/step13_environmental_20260225_044934_587c6285.txt', '2026-02-25 11:49:34', '2026-02-25 11:50:14', '06practexer1database.txt', NULL, NULL),
(134, 6, 17, 13, 'Institutional', 'approved', 'uploads/user_6/step13_institutional_20260225_044938_38566ca2.txt', '2026-02-25 11:49:38', '2026-02-25 11:50:21', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA.txt', NULL, NULL),
(135, 6, 17, 14, 'Institutional', 'approved', 'uploads/user_6/step14_institutional_20260225_045047_c10c3926.txt', '2026-02-25 11:50:47', '2026-02-25 11:50:56', '03eLMSact2books.txt', NULL, NULL),
(136, 6, 17, 15, 'Institutional', 'approved', 'uploads/user_6/step15_institutional_20260225_045122_13eba66b.txt', '2026-02-25 11:51:22', '2026-02-25 11:51:42', 'a little note for you sir Carl.txt', NULL, NULL),
(137, 6, 17, 16, 'Institutional', 'approved', 'uploads/user_6/step16_institutional_20260226_024259_69f8cc84.txt', '2026-02-26 09:42:59', '2026-02-26 09:43:29', 'afghntttjuyhujyjythttthyyjukijhngbfvcxchjiouytr.txt', NULL, 'good upload'),
(138, 6, 17, 17, 'Social', 'approved', 'uploads/user_6/step17_social_20260226_035620_29bb6fc4.txt', '2026-02-26 10:56:20', '2026-02-26 10:56:40', '08act1database.txt', NULL, 'needs revision'),
(139, 6, 17, 17, 'Economic', 'approved', 'uploads/user_6/step17_economic_20260226_034707_974a5b45.txt', '2026-02-26 10:47:07', '2026-02-26 10:48:03', 'a little note for you maam Wella.txt', NULL, 'good'),
(140, 6, 17, 17, 'Infrastructure', 'approved', 'uploads/user_6/step17_infrastructure_20260226_034947_810ec889.docx', '2026-02-26 10:49:47', '2026-02-26 10:50:06', 'A111111 AUTHORIZATION LETTER.docx', NULL, 'this shit is so ass'),
(143, 8, 6, 3, 'Environmental', 'approved', 'uploads/user_8/step3_environmental_20260226_043705_60b9813c.txt', '2026-02-26 11:37:05', '2026-02-26 11:37:27', '05 lab app dev.txt', NULL, NULL),
(145, 8, 6, 3, 'Institutional', 'approved', 'uploads/user_8/step3_institutional_20260226_044649_f83da22a.pdf', '2026-02-26 11:46:49', '2026-02-26 11:47:14', 'Just Dance 2016 Gdd.pdf', NULL, NULL),
(147, 6, 17, 17, 'Environmental', 'approved', 'uploads/user_6/step17_environmental_20260226_084207_972bb89e.pdf', '2026-02-26 15:42:07', '2026-02-26 15:42:23', 'Just Dance 2018 Documentation.pdf', NULL, NULL),
(155, 6, 17, 17, 'Institutional', 'approved', 'uploads/user_6/step17_institutional_20260226_090739_1457ab53.pdf', '2026-02-26 16:07:39', '2026-02-26 16:09:11', 'Just Dance 2016 Gdd.pdf', NULL, NULL),
(156, 6, 17, 18, 'Social', 'approved', 'uploads/user_6/step18_social_20260226_091209_7624dfe4.pdf', '2026-02-26 16:12:09', '2026-02-26 16:12:25', 'Dungeon Delicacies Infographic (version 1B).pdf', NULL, NULL),
(157, 6, 17, 18, 'Economic', 'approved', 'uploads/user_6/step18_economic_20260227_174345_6d5ba532.pdf', '2026-02-28 00:43:45', '2026-02-28 00:44:00', 'my resume.pdf', NULL, NULL),
(159, 6, 17, 18, 'Infrastructure', 'approved', 'uploads/user_6/step18_infrastructure_20260227_174920_4a1f72c6.pdf', '2026-02-28 00:49:20', '2026-02-28 00:49:42', 'Week_16_Game_Dev_Explanations.pdf', NULL, NULL),
(160, 6, 17, 18, 'Environmental', 'approved', 'uploads/user_6/step18_environmental_20260227_174758_2afbf2f4.pdf', '2026-02-28 00:47:58', '2026-02-28 00:48:36', 'SIP_Contract-Agreement 1 MBT.pdf', NULL, NULL),
(161, 6, 17, 18, 'Institutional', 'approved', 'uploads/user_6/step18_institutional_20260227_174925_2fcc9bd3.pdf', '2026-02-28 00:49:25', '2026-02-28 00:49:47', 'Sol_Luna_Chronicles_of_the_Sun_and_Moons_Rebirth-September-29.pdf', NULL, NULL),
(164, 6, 17, 19, 'Social', 'approved', 'uploads/user_6/step19_social_20260301_105847_f4ad0df5.pdf', '2026-03-01 17:58:47', '2026-03-01 18:29:55', 'SIP_Work-Plan_FINAL 1_MBT.pdf', NULL, 'fdsfsdf'),
(165, 6, 17, 19, 'Economic', 'rejected', 'uploads/user_6/step19_economic_20260301_105850_973d2eef.pdf', '2026-03-01 17:58:50', '2026-03-01 18:30:41', 'my resume (2).pdf', NULL, 'dsadfdf');

-- --------------------------------------------------------

--
-- Table structure for table `submission_history`
--

CREATE TABLE `submission_history` (
  `id` int(11) NOT NULL,
  `source_submission_id` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `municipality_id` int(11) NOT NULL,
  `step_no` int(11) NOT NULL,
  `category` enum('Social','Economic','Infrastructure','Environmental','Institutional') NOT NULL,
  `status` varchar(20) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `revision_remarks` text DEFAULT NULL,
  `archived_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `submission_history`
--

INSERT INTO `submission_history` (`id`, `source_submission_id`, `user_id`, `municipality_id`, `step_no`, `category`, `status`, `file_name`, `file_path`, `uploaded_at`, `approved_at`, `revision_remarks`, `archived_at`) VALUES
(1, 143, 8, 6, 3, 'Environmental', 'rejected', '03eLMSact2books.txt', 'uploads/user_8/step3_environmental_20260226_043621_010fa102.txt', '2026-02-26 11:36:21', NULL, 'dadwasd', '2026-02-26 11:37:05'),
(2, 145, 8, 6, 3, 'Institutional', 'rejected', '06practexer1database.txt', 'uploads/user_8/step3_institutional_20260226_044431_5c86d785.txt', '2026-02-26 11:44:31', NULL, 'what is this', '2026-02-26 11:46:49'),
(3, 150, 14, 10, 1, 'Infrastructure', 'rejected', '04 tp databaseaaaaaaaaaaaaaaaaa.txt', 'uploads/user_14/step1_infrastructure_20260226_072515_3cefe407.txt', '2026-02-26 14:25:15', NULL, 'wtf is this shit', '2026-02-26 14:28:33'),
(4, 151, 14, 10, 1, 'Environmental', 'rejected', 'EMEA_Why_We_Watch_2.0_-_2024_Digital_Report.pdf', 'uploads/user_14/step1_environmental_20260226_072526_226019d0.pdf', '2026-02-26 14:25:26', NULL, 'jsdfhsdfjs', '2026-02-26 14:28:49'),
(5, 147, 6, 17, 17, 'Environmental', 'rejected', 'Dungeon Delicacies Infographic (version 1B).pdf', 'uploads/user_6/step17_environmental_20260226_072026_11b7b4a5.pdf', '2026-02-26 14:20:26', NULL, 'dasdasdasdwadsad', '2026-02-26 15:42:07'),
(6, 157, 6, 17, 18, 'Economic', 'rejected', 'SIP_Contract-Agreement 1 MBT.pdf', 'uploads/user_6/step18_economic_20260227_174249_d0c96e70.pdf', '2026-02-28 00:42:49', NULL, 'dfgdfgdhghgfhj', '2026-02-28 00:43:45'),
(7, 159, 6, 17, 18, 'Infrastructure', 'rejected', 'GABE PARENTS 3.pdf', 'uploads/user_6/step18_infrastructure_20260227_174756_a08b4220.pdf', '2026-02-28 00:47:56', NULL, 'dsdsad', '2026-02-28 00:49:20'),
(8, 161, 6, 17, 18, 'Institutional', 'rejected', 'SIP_Contract-Agreement 1 MBT.pdf', 'uploads/user_6/step18_institutional_20260227_174803_9fc392af.pdf', '2026-02-28 00:48:03', NULL, 'gfdg', '2026-02-28 00:49:25');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `municipality` varchar(50) NOT NULL,
  `role` enum('admin','encoder','viewer','MLGOO') NOT NULL DEFAULT 'encoder',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `municipality`, `role`, `status`, `created_at`) VALUES
(2, 'Mikeru210', '$2y$10$5lENINGmfR.qqlyyQsgeO.UizInzPlAuu6P2nt1bi4hdqbAKQJFKi', '', 'encoder', 'active', '2026-02-02 13:41:22'),
(5, 'LegendaryMaoMao20', '$2y$10$/p54voM78/58FSQCC7BONumuCiv3nrwdPCADG7a2bS0cnBdsMAQpa', 'Malinao', 'MLGOO', 'active', '2026-02-09 06:09:08'),
(6, 'mikeru', '$2y$10$GAV6DR3CaGImpLF9G1L0OuGtqKKaw9TEqBWvO2i6Dhd6Et8wZKJBO', 'Tangalan', 'MLGOO', 'active', '2026-02-09 06:23:20'),
(7, 'municipal', '$2y$10$GZUWCLx/6GdeoSmMXTvcf.NugxtIvadk9y8Ks0T.1s6o6f7gp.q4W', 'Makato', 'MLGOO', 'active', '2026-02-09 06:46:48'),
(8, 'altavas1', '$2y$10$FlTjXErbqvBPqyfIJ8Et7O68Xylk5n7B6tHn0IopGUIpyPrr.ljHi', 'Altavas', 'MLGOO', 'active', '2026-02-17 12:15:47'),
(9, 'batan1', '$2y$10$wEzrKEGk7bjVEARMYFkoS.HOa1bGxMo.qF8Ke6eaBAUt8YNWV3/Ry', 'Batan', 'MLGOO', 'active', '2026-02-18 07:42:12'),
(11, 'slendermin3678', '$2y$10$kwTMs6y2.Rq/Rnrj0qzZo.z3Y112VHSBAXw3dG1eDypwBRHcp3Wy.', 'Banga', 'MLGOO', 'active', '2026-02-20 06:02:19'),
(12, 'akakak', '$2y$10$lV9Nl7MBzWzmgRsgzDgScefc1pQlO6WTVGzPvb4bGoLVKBNH6WDSK', 'Kalibo', 'MLGOO', 'active', '2026-02-25 08:06:11'),
(16, 'ibajay1', '$2y$10$pqDaxoYiksZDrziPPjETwOP.kSCMhUD6.1Jek3HvVHdh4/zD1UD9K', 'Ibajay', 'MLGOO', 'active', '2026-02-26 08:29:04');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `fp_progress`
--
ALTER TABLE `fp_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_fp` (`municipality`,`step_number`,`category`);

--
-- Indexes for table `municipalities`
--
ALTER TABLE `municipalities`
  ADD PRIMARY KEY (`municipal_id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `submissions`
--
ALTER TABLE `submissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_submission_user` (`user_id`,`step_no`,`category`),
  ADD KEY `fk_submissions_user` (`user_id`),
  ADD KEY `idx_submissions_muni_step_cat` (`municipality_id`,`step_no`,`category`);

--
-- Indexes for table `submission_history`
--
ALTER TABLE `submission_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_hist_muni_step_cat` (`municipality_id`,`step_no`,`category`,`archived_at`),
  ADD KEY `idx_hist_user` (`user_id`),
  ADD KEY `idx_hist_source` (`source_submission_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `uniq_users_municipality` (`municipality`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `fp_progress`
--
ALTER TABLE `fp_progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `municipalities`
--
ALTER TABLE `municipalities`
  MODIFY `municipal_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=133;

--
-- AUTO_INCREMENT for table `submissions`
--
ALTER TABLE `submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=166;

--
-- AUTO_INCREMENT for table `submission_history`
--
ALTER TABLE `submission_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `submissions`
--
ALTER TABLE `submissions`
  ADD CONSTRAINT `fk_submissions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
