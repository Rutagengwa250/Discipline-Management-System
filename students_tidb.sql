-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: students
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `academic_year_history`
--

DROP TABLE IF EXISTS `academic_year_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_year_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `academic_year` varchar(20) NOT NULL,
  `student_count` int NOT NULL,
  `avg_conduct` decimal(5,2) NOT NULL,
  `promotion_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academic_year_history`
--

LOCK TABLES `academic_year_history` WRITE;
/*!40000 ALTER TABLE `academic_year_history` DISABLE KEYS */;
INSERT INTO `academic_year_history` VALUES (2,'2024',42,40.00,'2025-11-19','2025-11-18 11:15:38'),(3,'2024',22,39.41,'2026-01-22','2026-01-21 11:30:53');
/*!40000 ALTER TABLE `academic_year_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `administrator`
--

DROP TABLE IF EXISTS `administrator`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administrator` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL DEFAULT 'director',
  `admin_name` varchar(255) DEFAULT NULL,
  `admin_password` varchar(255) DEFAULT NULL,
  `date_registered` datetime DEFAULT CURRENT_TIMESTAMP,
  `role_id` int DEFAULT NULL,
  `otp_secret` varchar(32) DEFAULT NULL,
  `otp_enabled` tinyint(1) DEFAULT '0',
  `otp_last_used` datetime DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_role_id` (`role_id`),
  CONSTRAINT `fk_role_id` FOREIGN KEY (`role_id`) REFERENCES `user_roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `administrator`
--

LOCK TABLES `administrator` WRITE;
/*!40000 ALTER TABLE `administrator` DISABLE KEYS */;
INSERT INTO `administrator` VALUES (1,'director','sample1','$2b$10$U6.00H0yunUG3WrvYkUNLOLUD84dreoC4H.EALaPE8aI/uaDMKDyC','2025-02-17 20:43:43',NULL,NULL,0,NULL,'rutjunior8@gmail.com'),(2,'director','ifak don bosco','$2b$10$/xwdmbYUUAppS7Ct6w0lVeh/X.dbZ1YKtclNYSmeRQAsfr.Y2Kwla','2025-02-17 20:52:12',NULL,NULL,0,NULL,NULL),(3,'director','ifak don bosco','$2b$10$i1LZm.46bB9XzNI4KIGupOPTkj7k43KxQ2nvBMrPzWbqGk.TvW97m','2025-02-21 12:08:24',NULL,NULL,0,NULL,'rutagengwa36@gmail.com'),(4,'director','1','$2b$10$VORYWObUiGSMEAB61Q7TlePo9P6chVSmLxwYypDTUnyacrwt9Ini.','2025-02-21 12:08:59',NULL,NULL,0,NULL,NULL),(5,'director','12','$2b$10$PUfQIdLBN8b.exvoQqGRDuLAnc7faJg9/DgnbrsbFcRhXUqml6EEy','2025-02-22 11:31:22',NULL,NULL,0,NULL,NULL),(6,'director','12','$2b$10$3uf7y0l3QMzo9fAk3srUCuiWww6zgxtawCWD6nH4po3cmG.bwGdgy','2025-03-04 09:54:38',NULL,NULL,0,NULL,NULL),(7,'Dean of Discipline','Dean of Discipline','$2b$10$gnFjECFWgaTS8eZULOv4DuE66x9ZuGAvF9XSkq8rIFiDIq6lNWsIC','2025-05-05 22:01:49',1,NULL,0,NULL,'rutagengwa36@gmail.com'),(8,'director','mbarimo mbazi','$2b$10$6AVqiNbinTfeTD2WUPkCzevuykyx4qBTYjsdaJziSV.81XWLzAlna','2025-05-05 22:15:59',NULL,NULL,0,NULL,NULL),(9,'director','rutaneshwa','$2b$10$.yHlKFP0Pqfyyw4LqgxMqOWOMnIY35.3m02zfiI7y1JdnSba7wd2K','2025-05-24 12:50:56',NULL,NULL,0,NULL,NULL),(10,'director','mungwaneza christian','$2b$10$Z9G/zZsH68wnSwrg0gXMce97nvFSqoKaPbu7kJ0HWqIpqFhqyPDx.','2025-05-27 11:00:48',NULL,NULL,0,NULL,NULL),(16,'director','director','$2b$10$eG/jaKVJWchH.cd9Rwr4ruS/KQMVaC2xB.r2LDeuNbd0YL6a6OAyu','2025-10-11 01:32:36',3,NULL,0,NULL,'rutagengwa36@gmail.com'),(17,'director','rudasingwa kelly','$2b$10$KJiY4OkGJFmKM/6ds.R.BeGozS4jvpWuxvCfFhFCI4e3Gdtl5PJ3u','2026-01-21 03:32:51',NULL,NULL,0,NULL,NULL),(18,'Bizimungu Alex','Bizimungu Alex','$2b$10$uSXfqhN2SddzMx4wNmhYvezXNtfa7C/../QvCD8lUK9n6ThVgxAlS','2026-02-13 11:05:17',2,NULL,0,NULL,NULL),(19,'ishimwe jackson','ishimwe jackson','$2b$10$uSXfqhN2SddzMx4wNmhYvezXNtfa7C/../QvCD8lUK9n6ThVgxAlS','2026-02-13 11:05:17',2,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `administrator` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alumni_students`
--

DROP TABLE IF EXISTS `alumni_students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alumni_students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `student_firstName` varchar(100) NOT NULL,
  `student_middleName` varchar(100) DEFAULT NULL,
  `student_lastName` varchar(100) NOT NULL,
  `student_class` varchar(50) NOT NULL,
  `student_conduct` decimal(5,2) NOT NULL,
  `graduated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `alumni_students_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alumni_students`
--

LOCK TABLES `alumni_students` WRITE;
/*!40000 ALTER TABLE `alumni_students` DISABLE KEYS */;
/*!40000 ALTER TABLE `alumni_students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backup_conduct_data`
--

DROP TABLE IF EXISTS `backup_conduct_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_conduct_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `backup_id` int NOT NULL,
  `student_id` int NOT NULL,
  `conduct_score` decimal(5,2) NOT NULL,
  `backup_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `backup_id` (`backup_id`),
  CONSTRAINT `backup_conduct_data_ibfk_1` FOREIGN KEY (`backup_id`) REFERENCES `backups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_conduct_data`
--

LOCK TABLES `backup_conduct_data` WRITE;
/*!40000 ALTER TABLE `backup_conduct_data` DISABLE KEYS */;
/*!40000 ALTER TABLE `backup_conduct_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backup_conduct_history`
--

DROP TABLE IF EXISTS `backup_conduct_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_conduct_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `backup_id` int NOT NULL,
  `history_id` int NOT NULL,
  `student_id` int NOT NULL,
  `term_id` int NOT NULL,
  `conduct_score` decimal(5,2) NOT NULL,
  `faults_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `backup_id` (`backup_id`),
  CONSTRAINT `backup_conduct_history_ibfk_1` FOREIGN KEY (`backup_id`) REFERENCES `backups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_conduct_history`
--

LOCK TABLES `backup_conduct_history` WRITE;
/*!40000 ALTER TABLE `backup_conduct_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `backup_conduct_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backup_faults`
--

DROP TABLE IF EXISTS `backup_faults`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_faults` (
  `id` int NOT NULL AUTO_INCREMENT,
  `backup_id` int NOT NULL,
  `fault_id` int NOT NULL,
  `student_id` int NOT NULL,
  `fault_description` text NOT NULL,
  `points_deducted` int NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `backup_id` (`backup_id`),
  CONSTRAINT `backup_faults_ibfk_1` FOREIGN KEY (`backup_id`) REFERENCES `backups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_faults`
--

LOCK TABLES `backup_faults` WRITE;
/*!40000 ALTER TABLE `backup_faults` DISABLE KEYS */;
/*!40000 ALTER TABLE `backup_faults` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backup_students`
--

DROP TABLE IF EXISTS `backup_students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `backup_id` int NOT NULL,
  `student_id` int NOT NULL,
  `student_firstName` varchar(100) NOT NULL,
  `student_middleName` varchar(100) DEFAULT NULL,
  `student_lastName` varchar(100) NOT NULL,
  `student_class` varchar(50) NOT NULL,
  `student_conduct` decimal(5,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `backup_id` (`backup_id`),
  CONSTRAINT `backup_students_ibfk_1` FOREIGN KEY (`backup_id`) REFERENCES `backups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_students`
--

LOCK TABLES `backup_students` WRITE;
/*!40000 ALTER TABLE `backup_students` DISABLE KEYS */;
/*!40000 ALTER TABLE `backup_students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backup_terms`
--

DROP TABLE IF EXISTS `backup_terms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_terms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `backup_id` int NOT NULL,
  `term_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('active','archived') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `backup_id` (`backup_id`),
  CONSTRAINT `backup_terms_ibfk_1` FOREIGN KEY (`backup_id`) REFERENCES `backups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_terms`
--

LOCK TABLES `backup_terms` WRITE;
/*!40000 ALTER TABLE `backup_terms` DISABLE KEYS */;
/*!40000 ALTER TABLE `backup_terms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backups`
--

DROP TABLE IF EXISTS `backups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `backup_type` enum('full','students','conduct') DEFAULT 'full',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `backups_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `administrator` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backups`
--

LOCK TABLES `backups` WRITE;
/*!40000 ALTER TABLE `backups` DISABLE KEYS */;
INSERT INTO `backups` VALUES (1,'Auto-Pre-Term-Reset-2025-11-01','Automatic backup created before: Pre-Term-Reset','full',16,'2025-11-01 19:48:11'),(2,'term 1 backup','backup of term1','full',16,'2025-11-01 19:49:58'),(3,'Auto-Pre-Promotion-2025-11-01','Automatic backup created before: Pre-Promotion','full',16,'2025-11-01 19:51:25');
/*!40000 ALTER TABLE `backups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faults`
--

DROP TABLE IF EXISTS `faults`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faults` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `fault_description` text NOT NULL,
  `fault_type` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `points_deducted` int DEFAULT '0',
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `faults_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=301 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faults`
--

LOCK TABLES `faults` WRITE;
/*!40000 ALTER TABLE `faults` DISABLE KEYS */;
INSERT INTO `faults` VALUES (1,1,'Late to class','lateness','2026-02-13 19:20:29',2,18),(2,1,'Missing homework assignment','academic','2026-02-13 19:20:29',2,19),(3,2,'Missing homework assignment','academic','2026-02-13 19:20:29',2,19),(4,2,'No school uniform','discipline','2026-02-13 19:20:29',1,18),(5,3,'No school uniform','discipline','2026-02-13 19:20:29',1,18),(6,3,'Disruptive talking during lesson','behavior','2026-02-13 19:20:29',3,19),(7,4,'Disruptive talking during lesson','behavior','2026-02-13 19:20:29',3,19),(8,4,'Using phone during class hours','discipline','2026-02-13 19:20:29',3,18),(9,5,'Using phone during class hours','discipline','2026-02-13 19:20:29',3,18),(10,5,'Incomplete class notes','academic','2026-02-13 19:20:29',1,19),(11,6,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(12,6,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(13,7,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(14,7,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(15,8,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(16,8,'Late to class','lateness','2026-02-13 19:20:30',2,18),(17,9,'Late to class','lateness','2026-02-13 19:20:30',2,18),(18,9,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(19,10,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(20,10,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(21,11,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(22,11,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(23,12,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(24,12,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(25,13,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(26,13,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(27,14,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(28,14,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(29,15,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(30,15,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(31,16,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(32,16,'Late to class','lateness','2026-02-13 19:20:30',2,18),(33,17,'Late to class','lateness','2026-02-13 19:20:30',2,18),(34,17,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(35,18,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(36,18,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(37,19,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(38,19,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(39,20,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(40,20,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(41,21,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(42,21,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(43,22,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(44,22,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(45,23,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(46,23,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(47,24,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(48,24,'Late to class','lateness','2026-02-13 19:20:30',2,18),(49,25,'Late to class','lateness','2026-02-13 19:20:30',2,18),(50,25,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(51,26,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(52,26,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(53,27,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(54,27,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(55,28,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(56,28,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(57,29,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(58,29,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(59,30,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(60,30,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(61,31,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(62,31,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(63,32,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(64,32,'Late to class','lateness','2026-02-13 19:20:30',2,18),(65,33,'Late to class','lateness','2026-02-13 19:20:30',2,18),(66,33,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(67,34,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(68,34,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(69,35,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(70,35,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(71,36,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(72,36,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(73,37,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(74,37,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(75,38,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(76,38,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(77,39,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(78,39,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(79,40,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(80,40,'Late to class','lateness','2026-02-13 19:20:30',2,18),(81,41,'Late to class','lateness','2026-02-13 19:20:30',2,18),(82,41,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(83,42,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(84,42,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(85,43,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(86,43,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(87,44,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(88,44,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(89,45,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(90,45,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(91,46,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(92,46,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(93,47,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(94,47,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(95,48,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(96,48,'Late to class','lateness','2026-02-13 19:20:30',2,18),(97,49,'Late to class','lateness','2026-02-13 19:20:30',2,18),(98,49,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(99,50,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(100,50,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(101,51,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(102,51,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(103,52,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(104,52,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(105,53,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(106,53,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(107,54,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(108,54,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(109,55,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(110,55,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(111,56,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(112,56,'Late to class','lateness','2026-02-13 19:20:30',2,18),(113,57,'Late to class','lateness','2026-02-13 19:20:30',2,18),(114,57,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(115,58,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(116,58,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(117,59,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(118,59,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(119,60,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(120,60,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(121,61,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(122,61,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(123,62,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(124,62,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(125,63,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(126,63,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(127,64,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(128,64,'Late to class','lateness','2026-02-13 19:20:30',2,18),(129,65,'Late to class','lateness','2026-02-13 19:20:30',2,18),(130,65,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(131,66,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(132,66,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(133,67,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(134,67,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(135,68,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(136,68,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(137,69,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(138,69,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(139,70,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(140,70,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(141,71,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(142,71,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(143,72,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(144,72,'Late to class','lateness','2026-02-13 19:20:30',2,18),(145,73,'Late to class','lateness','2026-02-13 19:20:30',2,18),(146,73,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(147,74,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(148,74,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(149,75,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(150,75,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(151,76,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(152,76,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(153,77,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(154,77,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(155,78,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(156,78,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(157,79,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(158,79,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(159,80,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(160,80,'Late to class','lateness','2026-02-13 19:20:30',2,18),(161,81,'Late to class','lateness','2026-02-13 19:20:30',2,18),(162,81,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(163,82,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(164,82,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(165,83,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(166,83,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(167,84,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(168,84,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(169,85,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(170,85,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(171,86,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(172,86,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(173,87,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(174,87,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(175,88,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(176,88,'Late to class','lateness','2026-02-13 19:20:30',2,18),(177,89,'Late to class','lateness','2026-02-13 19:20:30',2,18),(178,89,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(179,90,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(180,90,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(181,91,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(182,91,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(183,92,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(184,92,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(185,93,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(186,93,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(187,94,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(188,94,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(189,95,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(190,95,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(191,96,'Absent from morning prep without permission','attendance','2026-02-13 19:20:30',4,19),(192,96,'Late to class','lateness','2026-02-13 19:20:30',2,18),(193,97,'Late to class','lateness','2026-02-13 19:20:30',2,18),(194,97,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(195,98,'Missing homework assignment','academic','2026-02-13 19:20:30',2,19),(196,98,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(197,99,'No school uniform','discipline','2026-02-13 19:20:30',1,18),(198,99,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(199,100,'Disruptive talking during lesson','behavior','2026-02-13 19:20:30',3,19),(200,100,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(201,101,'Using phone during class hours','discipline','2026-02-13 19:20:30',3,18),(202,101,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(203,102,'Incomplete class notes','academic','2026-02-13 19:20:30',1,19),(204,102,'Late return after break time','lateness','2026-02-13 19:20:30',2,18),(205,103,'Late return after break time','lateness','2026-02-13 19:20:31',2,18),(206,103,'Absent from morning prep without permission','attendance','2026-02-13 19:20:31',4,19),(207,104,'Absent from morning prep without permission','attendance','2026-02-13 19:20:31',4,19),(208,104,'Late to class','lateness','2026-02-13 19:20:31',2,18),(209,105,'Late to class','lateness','2026-02-13 19:20:31',2,18),(210,105,'Missing homework assignment','academic','2026-02-13 19:20:31',2,19),(211,106,'Missing homework assignment','academic','2026-02-13 19:20:31',2,19),(212,106,'No school uniform','discipline','2026-02-13 19:20:31',1,18),(213,107,'No school uniform','discipline','2026-02-13 19:20:31',1,18),(214,107,'Disruptive talking during lesson','behavior','2026-02-13 19:20:31',3,19),(215,108,'Disruptive talking during lesson','behavior','2026-02-13 19:20:31',3,19),(216,108,'Using phone during class hours','discipline','2026-02-13 19:20:31',3,18),(217,109,'Using phone during class hours','discipline','2026-02-13 19:20:31',3,18),(218,109,'Incomplete class notes','academic','2026-02-13 19:20:31',1,19),(219,110,'Incomplete class notes','academic','2026-02-13 19:20:31',1,19),(220,110,'Late return after break time','lateness','2026-02-13 19:20:31',2,18),(221,111,'Late return after break time','lateness','2026-02-13 19:20:31',2,18),(222,111,'Absent from morning prep without permission','attendance','2026-02-13 19:20:31',4,19),(223,112,'Absent from morning prep without permission','attendance','2026-02-13 19:20:31',4,19),(224,112,'Late to class','lateness','2026-02-13 19:20:31',2,18),(225,113,'Late to class','lateness','2026-02-13 19:20:31',2,18),(226,113,'Missing homework assignment','academic','2026-02-13 19:20:31',2,19),(227,114,'Missing homework assignment','academic','2026-02-13 19:20:31',2,19),(228,114,'No school uniform','discipline','2026-02-13 19:20:31',1,18),(229,115,'No school uniform','discipline','2026-02-13 19:20:31',1,18),(230,115,'Disruptive talking during lesson','behavior','2026-02-13 19:20:31',3,19),(231,116,'Disruptive talking during lesson','behavior','2026-02-13 19:20:31',3,19),(232,116,'Using phone during class hours','discipline','2026-02-13 19:20:31',3,18),(233,117,'Using phone during class hours','discipline','2026-02-13 19:20:31',3,18),(234,117,'Incomplete class notes','academic','2026-02-13 19:20:31',1,19),(235,118,'Incomplete class notes','academic','2026-02-13 19:20:31',1,19),(236,118,'Late return after break time','lateness','2026-02-13 19:20:31',2,18),(237,119,'Late return after break time','lateness','2026-02-13 19:20:31',2,18),(238,119,'Absent from morning prep without permission','attendance','2026-02-13 19:20:31',4,19),(239,120,'Absent from morning prep without permission','attendance','2026-02-13 19:20:31',4,19),(240,120,'Late to class','lateness','2026-02-13 19:20:31',2,18),(241,121,'Late to class','lateness','2026-02-13 19:20:31',2,18),(242,121,'Missing homework assignment','academic','2026-02-13 19:20:31',2,19),(243,122,'Missing homework assignment','academic','2026-02-13 19:20:31',2,19),(244,122,'No school uniform','discipline','2026-02-13 19:20:31',1,18),(245,123,'No school uniform','discipline','2026-02-13 19:20:31',1,18),(246,123,'Disruptive talking during lesson','behavior','2026-02-13 19:20:31',3,19),(247,124,'Disruptive talking during lesson','behavior','2026-02-13 19:20:31',3,19),(248,124,'Using phone during class hours','discipline','2026-02-13 19:20:31',3,18),(249,125,'Using phone during class hours','discipline','2026-02-13 19:20:31',3,18),(250,125,'Incomplete class notes','academic','2026-02-13 19:20:31',1,19),(251,126,'Incomplete class notes','academic','2026-02-13 19:20:31',1,19),(252,126,'Late return after break time','lateness','2026-02-13 19:20:31',2,18),(253,127,'Late return after break time','lateness','2026-02-13 19:20:31',2,18),(254,127,'Absent from morning prep without permission','attendance','2026-02-13 19:20:31',4,19),(255,128,'Absent from morning prep without permission','attendance','2026-02-13 19:20:31',4,19),(256,128,'Late to class','lateness','2026-02-13 19:20:31',2,18),(257,129,'Late to class','lateness','2026-02-13 19:20:31',2,18),(258,129,'Missing homework assignment','academic','2026-02-13 19:20:31',2,19),(259,130,'Missing homework assignment','academic','2026-02-13 19:20:31',2,19),(260,130,'No school uniform','discipline','2026-02-13 19:20:31',1,18),(261,131,'No school uniform','discipline','2026-02-13 19:20:31',1,18),(262,131,'Disruptive talking during lesson','behavior','2026-02-13 19:20:31',3,19),(263,132,'Disruptive talking during lesson','behavior','2026-02-13 19:20:31',3,19),(264,132,'Using phone during class hours','discipline','2026-02-13 19:20:31',3,18),(265,133,'Using phone during class hours','discipline','2026-02-13 19:20:31',3,18),(266,133,'Incomplete class notes','academic','2026-02-13 19:20:31',1,19),(267,134,'Incomplete class notes','academic','2026-02-13 19:20:31',1,19),(268,134,'Late return after break time','lateness','2026-02-13 19:20:31',2,18),(269,135,'Late return after break time','lateness','2026-02-13 19:20:31',2,18),(270,135,'Absent from morning prep without permission','attendance','2026-02-13 19:20:31',4,19),(271,136,'Absent from morning prep without permission','attendance','2026-02-13 19:20:31',4,19),(272,136,'Late to class','lateness','2026-02-13 19:20:31',2,18),(273,137,'Late to class','lateness','2026-02-13 19:20:31',2,18),(274,137,'Missing homework assignment','academic','2026-02-13 19:20:31',2,19),(275,138,'Missing homework assignment','academic','2026-02-13 19:20:31',2,19),(276,138,'No school uniform','discipline','2026-02-13 19:20:31',1,18),(277,139,'No school uniform','discipline','2026-02-13 19:20:31',1,18),(278,139,'Disruptive talking during lesson','behavior','2026-02-13 19:20:31',3,19),(279,140,'Disruptive talking during lesson','behavior','2026-02-13 19:20:31',3,19),(280,140,'Using phone during class hours','discipline','2026-02-13 19:20:31',3,18),(281,141,'Using phone during class hours','discipline','2026-02-13 19:20:31',3,18),(282,141,'Incomplete class notes','academic','2026-02-13 19:20:31',1,19),(283,142,'Incomplete class notes','academic','2026-02-13 19:20:31',1,19),(284,142,'Late return after break time','lateness','2026-02-13 19:20:31',2,18),(285,143,'Late return after break time','lateness','2026-02-13 19:20:31',2,18),(286,143,'Absent from morning prep without permission','attendance','2026-02-13 19:20:31',4,19),(287,144,'Absent from morning prep without permission','attendance','2026-02-13 19:20:31',4,19),(288,144,'Late to class','lateness','2026-02-13 19:20:31',2,18),(289,145,'Late to class','lateness','2026-02-13 19:20:31',2,18),(290,145,'Missing homework assignment','academic','2026-02-13 19:20:31',2,19),(291,146,'Missing homework assignment','academic','2026-02-13 19:20:31',2,19),(292,146,'No school uniform','discipline','2026-02-13 19:20:31',1,18),(293,147,'No school uniform','discipline','2026-02-13 19:20:31',1,18),(294,147,'Disruptive talking during lesson','behavior','2026-02-13 19:20:31',3,19),(295,148,'Disruptive talking during lesson','behavior','2026-02-13 19:20:31',3,19),(296,148,'Using phone during class hours','discipline','2026-02-13 19:20:31',3,18),(297,149,'Using phone during class hours','discipline','2026-02-13 19:20:31',3,18),(298,149,'Incomplete class notes','academic','2026-02-13 19:20:31',1,19),(299,150,'Incomplete class notes','academic','2026-02-13 19:20:31',1,19),(300,150,'Late return after break time','lateness','2026-02-13 19:20:31',2,18);
/*!40000 ALTER TABLE `faults` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faults_archive`
--

DROP TABLE IF EXISTS `faults_archive`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faults_archive` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `fault_description` text NOT NULL,
  `points_deducted` int NOT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `archived_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `faults_archive_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`),
  CONSTRAINT `faults_archive_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `administrator` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faults_archive`
--

LOCK TABLES `faults_archive` WRITE;
/*!40000 ALTER TABLE `faults_archive` DISABLE KEYS */;
/*!40000 ALTER TABLE `faults_archive` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `penalty_requests`
--

DROP TABLE IF EXISTS `penalty_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `penalty_requests` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `fault_description` text,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `penalty_requests_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`user_id`),
  CONSTRAINT `penalty_requests_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `penalty_requests`
--

LOCK TABLES `penalty_requests` WRITE;
/*!40000 ALTER TABLE `penalty_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `penalty_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permission_history`
--

DROP TABLE IF EXISTS `permission_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permission_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `permission_id` int NOT NULL,
  `change_type` enum('create','status_change','update','return_recorded') NOT NULL,
  `old_value` text,
  `new_value` text,
  `change_reason` text,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `changed_by` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `permission_history_ibfk_1` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permission_history`
--

LOCK TABLES `permission_history` WRITE;
/*!40000 ALTER TABLE `permission_history` DISABLE KEYS */;
INSERT INTO `permission_history` VALUES (1,1,'create',NULL,'{\"studentName\":\"rutagengwa eric\",\"studentClass\":\"S5Mpc\",\"permissionType\":\"medical\",\"status\":\"approved\",\"departureTime\":\"2025-05-03 13:05\",\"returnTime\":\"2025-05-04 12:00\",\"destination\":\"home\",\"reason\":\"sick\",\"guardianInfo\":\"\"}',NULL,'2025-05-03 18:30:48',NULL),(2,1,'return_recorded','Not recorded','2025-05-04 12:00',NULL,'2025-05-03 18:39:06',NULL),(3,2,'create',NULL,'{\"studentName\":\"rugambwa marcus\",\"studentClass\":\"S5Mpc\",\"permissionType\":\"weekend\",\"status\":\"pending\",\"departureTime\":\"2025-05-06 12:00\",\"returnTime\":\"2025-05-12 12:00\",\"destination\":\"hospital\",\"reason\":\"sick\",\"guardianInfo\":\"none\"}',NULL,'2025-05-03 18:40:25',NULL),(4,2,'status_change','pending','denied','has to come back','2025-05-03 18:41:03',NULL),(5,5,'create',NULL,'{\"studentName\":\"rugambwa marcus\",\"studentClass\":\"S5Mpc\",\"permissionType\":\"medical\",\"status\":\"approved\",\"departureTime\":\"2025-05-24 12:00\",\"returnTime\":\"2025-05-24 12:00\",\"destination\":\"home\",\"reason\":\"sick\",\"guardianInfo\":\"sick\"}',NULL,'2025-05-23 20:05:51',NULL),(6,6,'create',NULL,'{\"studentName\":\"kamanzi marvel\",\"studentClass\":\"s5PCB\",\"permissionType\":\"medical\",\"status\":\"approved\",\"departureTime\":\"2025-05-25 15:10\",\"returnTime\":\"2025-05-30 12:00\",\"destination\":\"home\",\"reason\":\"sick\",\"guardianInfo\":\"\"}',NULL,'2025-05-24 19:48:26',NULL),(7,7,'create',NULL,'{\"studentName\":\"kamanzi marvel\",\"studentClass\":\"S5PCB\",\"permissionType\":\"weekend\",\"status\":\"approved\",\"departureTime\":\"2025-05-29 12:00\",\"returnTime\":\"2025-05-30 12:00\",\"destination\":\"hospital\",\"reason\":\"weekend\",\"guardianInfo\":\"weekend\"}',NULL,'2025-05-24 19:56:13',NULL),(8,8,'create',NULL,'{\"studentName\":\"kagabe guy\",\"studentClass\":\"S5Mpc\",\"permissionType\":\"medical\",\"status\":\"approved\",\"departureTime\":\"2025-05-27 13:00\",\"returnTime\":\"2025-05-28 12:00\",\"destination\":\"hospital\",\"reason\":\"medical\",\"guardianInfo\":\"\"}',NULL,'2025-05-27 17:59:03',NULL),(9,9,'create',NULL,'{\"studentName\":\"usabase aime\",\"studentClass\":\"s6pcm\",\"permissionType\":\"medical\",\"status\":\"approved\",\"departureTime\":\"2025-08-04 12:00\",\"returnTime\":\"2025-08-05 12:00\",\"destination\":\"hospital\",\"reason\":\"he was sick\",\"guardianInfo\":\"\"}',NULL,'2025-08-04 18:37:14',NULL),(10,10,'create',NULL,'{\"studentName\":\"rutagengwa\",\"studentClass\":\"s5mpc\",\"permissionType\":\"weekend\",\"status\":\"pending\",\"departureTime\":\"2025-08-07 19:33\",\"returnTime\":\"2025-08-09 19:33\",\"destination\":\"home\",\"reason\":\"no reason\",\"guardianInfo\":\"\"}',NULL,'2025-08-06 17:35:07',NULL),(11,11,'create',NULL,'{\"studentId\":\"2\",\"studentName\":\"rugambwa marcus\",\"studentClass\":\"S5 MPC\",\"permissionType\":\"medical\",\"status\":\"approved\",\"departureTime\":\"2025-08-06 22:04\",\"returnTime\":\"2025-08-06 22:08\",\"destination\":\"home\",\"reason\":\"it is personal\"}',NULL,'2025-08-06 20:05:31',NULL),(12,12,'create',NULL,'{\"studentId\":\"2\",\"studentName\":\"rugambwa marcus\",\"studentClass\":\"S5 MPC\",\"permissionType\":\"weekend\",\"status\":\"pending\",\"departureTime\":\"2025-08-06 22:07\",\"returnTime\":\"2025-08-07 22:12\",\"destination\":\"hh\",\"reason\":\"grgr\"}',NULL,'2025-08-06 20:09:48',NULL),(13,13,'create',NULL,'{\"studentId\":\"29\",\"studentName\":\"usabase Aime\",\"studentClass\":\"S6 PCM\",\"permissionType\":\"weekend\",\"status\":\"pending\",\"departureTime\":\"2025-08-06 22:15\",\"returnTime\":\"2025-08-06 22:20\",\"destination\":\"home\",\"reason\":\"rut\\n\"}',NULL,'2025-08-06 20:15:40',NULL),(14,14,'create',NULL,'{\"studentId\":\"14\",\"studentName\":\"kayinamura ntaganira elvaron\",\"studentClass\":\"S5 MPC\",\"permissionType\":\"personal\",\"status\":\"pending\",\"departureTime\":\"2025-08-06 22:15\",\"returnTime\":\"2025-08-07 22:20\",\"destination\":\"home\",\"reason\":\"yeah\"}',NULL,'2025-08-06 20:16:31',NULL),(15,15,'create',NULL,'{\"studentId\":\"4\",\"studentName\":\"rutagengwa eric\",\"studentClass\":\"S5 MPC\",\"permissionType\":\"weekend\",\"status\":\"pending\",\"departureTime\":\"2025-08-06 22:15\",\"returnTime\":\"2025-08-07 22:20\",\"destination\":\"home\",\"reason\":\"jj\"}',NULL,'2025-08-06 20:18:47',NULL),(16,16,'create',NULL,'{\"studentId\":\"29\",\"studentName\":\"usabase Aime\",\"studentClass\":\"S6 PCM\",\"permissionType\":\"medical\",\"status\":\"denied\",\"departureTime\":\"2025-08-06 22:23\",\"returnTime\":\"2025-08-07 22:23\",\"destination\":\"home\",\"reason\":\"ret\"}',NULL,'2025-08-06 20:23:56',NULL),(17,17,'create',NULL,'{\"studentId\":\"4\",\"studentName\":\"rutagengwa eric\",\"studentClass\":\"S5 MPC\",\"permissionType\":\"weekend\",\"status\":\"pending\",\"departureTime\":\"2025-08-06 22:23\",\"returnTime\":\"2025-08-07 22:23\",\"destination\":\"home\",\"reason\":\"rutt\"}',NULL,'2025-08-06 20:25:14',NULL),(18,18,'create',NULL,'{\"studentId\":\"3\",\"studentName\":\"rutagengwa eric\",\"studentClass\":\"S5 MPC\",\"permissionType\":\"medical\",\"status\":\"approved\",\"departureTime\":\"2025-08-06 22:26\",\"returnTime\":\"2025-08-07 22:26\",\"destination\":\"home\",\"reason\":\"rutnd\"}',NULL,'2025-08-06 20:26:50',NULL),(19,19,'create',NULL,'{\"studentId\":\"26\",\"studentName\":\"mbarimo mbazi fideri\",\"studentClass\":\"S6 PCM\",\"permissionType\":\"other\",\"status\":\"pending\",\"departureTime\":\"2025-08-06 22:27\",\"returnTime\":\"2025-08-07 22:27\",\"destination\":\"home\",\"reason\":\"ejfifje\"}',NULL,'2025-08-06 20:27:50',NULL),(20,20,'create',NULL,'{\"studentId\":\"29\",\"studentName\":\"usabase Aime\",\"studentClass\":\"S6 PCM\",\"permissionType\":\"medical\",\"status\":\"denied\",\"departureTime\":\"2025-08-06 22:28\",\"returnTime\":\"2025-08-07 22:28\",\"destination\":\"home\",\"reason\":\"hkhk\"}',NULL,'2025-08-06 20:28:45',NULL),(21,21,'create',NULL,'{\"studentId\":\"14\",\"studentName\":\"kayinamura ntaganira elvaron\",\"studentClass\":\"S5 MPC\",\"permissionType\":\"medical\",\"status\":\"approved\",\"departureTime\":\"2025-08-06 22:28\",\"returnTime\":\"2025-08-07 22:28\",\"destination\":\"home\",\"reason\":\"guhjblj\"}',NULL,'2025-08-06 20:29:51',NULL),(22,17,'status_change','pending','approved','No reason provided','2025-08-06 20:55:00',NULL),(23,12,'status_change','pending','denied','No reason provided','2025-08-06 20:55:37',NULL),(24,22,'create',NULL,'{\"studentId\":\"29\",\"studentName\":\"usabase Aime\",\"studentClass\":\"S6 PCM\",\"permissionType\":\"medical\",\"status\":\"approved\",\"departureTime\":\"2025-08-07 21:19\",\"returnTime\":\"2025-08-08 12:19\",\"destination\":\"home\",\"reason\":\"nago bikureb wanna\"}',NULL,'2025-08-07 19:20:09',NULL),(25,23,'create',NULL,'{\"studentId\":\"1\",\"studentName\":\"rutagengwa eric\",\"studentClass\":\"S1\",\"permissionType\":\"weekend\",\"status\":\"denied\",\"departureTime\":\"2025-08-07 22:01\",\"returnTime\":\"2025-08-08 22:01\",\"destination\":\"home\",\"reason\":\"wer[poiu\"}',NULL,'2025-08-07 20:43:39',NULL),(26,24,'create',NULL,'{\"studentId\":\"29\",\"studentName\":\"usabase Aime\",\"studentClass\":\"S6 PCM\",\"permissionType\":\"weekend\",\"status\":\"approved\",\"departureTime\":\"2025-08-24 17:55\",\"returnTime\":\"2025-08-25 17:55\",\"destination\":\"home\",\"reason\":\"he is sick\"}',NULL,'2025-08-24 15:59:34',NULL),(27,25,'create',NULL,'{\"studentId\":\"1\",\"studentName\":\"rutagengwa eric\",\"studentClass\":\"S1\",\"permissionType\":\"weekend\",\"status\":\"approved\",\"departureTime\":\"2025-08-24 18:18\",\"returnTime\":\"2025-08-25 18:18\",\"destination\":\"home\",\"reason\":\"jkjandjkdc\"}',NULL,'2025-08-24 16:19:50',NULL),(28,10,'status_change','pending','approved','No reason provided','2025-08-24 16:26:49',NULL),(29,26,'create',NULL,'{\"studentId\":\"31\",\"studentName\":\"Abatesi Kellia\",\"studentClass\":\"S6 MPC\",\"permissionType\":\"weekend\",\"status\":\"approved\",\"departureTime\":\"2025-08-30 16:57\",\"returnTime\":\"2025-12-23 16:57\",\"destination\":\"school issues\",\"reason\":\"fuygyguyoui\"}',NULL,'2025-08-30 14:59:04',NULL),(30,27,'create',NULL,'{\"studentId\":\"2\",\"studentName\":\"rugambwa marcus\",\"studentClass\":\"S5 MPC\",\"permissionType\":\"weekend\",\"status\":\"approved\",\"departureTime\":\"2025-09-03 11:28\",\"returnTime\":\"2025-09-04 11:28\",\"destination\":\"home\",\"reason\":\"sick\\n\"}',NULL,'2025-09-03 09:29:35',NULL),(31,28,'create',NULL,'{\"studentId\":\"32\",\"studentName\":\"hirwa emile\",\"studentClass\":\"S6 MPC\",\"permissionType\":\"medical\",\"status\":\"approved\",\"departureTime\":\"2025-09-24 11:12\",\"returnTime\":\"2025-09-25 11:12\",\"destination\":\"home\",\"reason\":\"ararwaye\"}',NULL,'2025-09-24 18:13:05',NULL),(32,29,'create',NULL,'{\"studentId\":\"40\",\"studentName\":\"Semutera nsanga Amede\",\"studentClass\":\"S6 MPC\",\"permissionType\":\"medical\",\"status\":\"approved\",\"departureTime\":\"2025-10-03 13:02\",\"returnTime\":\"2025-10-04 13:02\",\"destination\":\"hospital\",\"reason\":\"amenyo yatanye fooo\"}',NULL,'2025-10-03 20:03:14',NULL),(33,30,'create',NULL,'{\"studentId\":\"14\",\"studentName\":\"kayinamura ntaganira elvaron\",\"studentClass\":\"S6 MPC\",\"permissionType\":\"medical\",\"status\":\"approved\",\"departureTime\":\"2025-11-18 03:23\",\"returnTime\":\"2025-11-19 03:23\",\"destination\":\"home\",\"reason\":\"he was sick\"}',NULL,'2025-11-18 11:24:15',NULL),(34,31,'create',NULL,'{\"studentId\":\"18\",\"studentName\":\"munezero bruce\",\"studentClass\":\"S6 MPC\",\"permissionType\":\"medical\",\"status\":\"approved\",\"departureTime\":\"2026-01-21 00:56\",\"returnTime\":\"2026-01-22 00:56\",\"destination\":\"home\",\"reason\":\"he was sick\"}',NULL,'2026-01-21 08:56:47',NULL),(35,32,'create',NULL,'{\"studentId\":\"35\",\"studentName\":\"Nturengwa Masengesho Loic\",\"studentClass\":\"S6 MSSI\",\"permissionType\":\"medical\",\"status\":\"approved\",\"departureTime\":\"2026-01-21 03:34\",\"returnTime\":\"2026-01-22 03:34\",\"destination\":\"hospital\",\"reason\":\"sick\"}',NULL,'2026-01-21 11:35:23',NULL);
/*!40000 ALTER TABLE `permission_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_name` varchar(100) NOT NULL,
  `student_class` varchar(50) NOT NULL,
  `permission_type` enum('weekend','medical','personal','other') NOT NULL,
  `departure_time` datetime NOT NULL,
  `return_time` datetime NOT NULL,
  `actual_return_time` datetime DEFAULT NULL,
  `destination` varchar(255) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','denied','revoked') DEFAULT 'pending',
  `guardian_info` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'rutagengwa eric','S5Mpc','medical','2025-05-03 13:05:00','2025-05-04 12:00:00','2025-05-04 12:00:00','home','sick','approved','','2025-05-03 18:30:48','2025-05-03 18:39:06',NULL),(2,'rugambwa marcus','S5Mpc','weekend','2025-05-06 12:00:00','2025-05-12 12:00:00',NULL,'hospital','sick','denied','none','2025-05-03 18:40:25','2025-05-03 18:41:03',NULL),(3,'rutagengwa eric','S5Mpc','weekend','2025-05-24 12:00:00','2025-05-24 12:00:00',NULL,'home','sick','approved','sick','2025-05-23 20:02:03','2025-05-23 20:02:03',NULL),(4,'rugambwa marcus','S5Mpc','medical','2025-05-24 12:00:00','2025-05-24 12:00:00',NULL,'home','sick','approved','sick','2025-05-23 20:05:29','2025-05-23 20:05:29',NULL),(5,'rugambwa marcus','S5Mpc','medical','2025-05-24 12:00:00','2025-05-24 12:00:00',NULL,'home','sick','approved','sick','2025-05-23 20:05:51','2025-05-23 20:05:51',NULL),(6,'kamanzi marvel','s5PCB','medical','2025-05-25 15:10:00','2025-05-30 12:00:00',NULL,'home','sick','approved','','2025-05-24 19:48:26','2025-05-24 19:48:26',NULL),(7,'kamanzi marvel','S5PCB','weekend','2025-05-29 12:00:00','2025-05-30 12:00:00',NULL,'hospital','weekend','approved','weekend','2025-05-24 19:56:13','2025-05-24 19:56:13',NULL),(8,'kagabe guy','S5Mpc','medical','2025-05-27 13:00:00','2025-05-28 12:00:00',NULL,'hospital','medical','approved','','2025-05-27 17:59:03','2025-05-27 17:59:03',NULL),(9,'usabase aime','s6pcm','medical','2025-08-04 12:00:00','2025-08-05 12:00:00',NULL,'hospital','he was sick','approved','','2025-08-04 18:37:14','2025-08-04 18:37:14',NULL),(10,'rutagengwa','s5mpc','weekend','2025-08-07 19:33:00','2025-08-09 19:33:00',NULL,'home','no reason','approved','','2025-08-06 17:35:07','2025-08-24 16:26:49',NULL),(11,'rugambwa marcus','S5 MPC','medical','2025-08-06 22:04:00','2025-08-06 22:08:00',NULL,'home','it is personal','approved',NULL,'2025-08-06 20:05:31','2025-08-06 20:05:31',NULL),(12,'rugambwa marcus','S5 MPC','weekend','2025-08-06 22:07:00','2025-08-07 22:12:00',NULL,'hh','grgr','denied',NULL,'2025-08-06 20:09:48','2025-08-06 20:55:37',NULL),(13,'usabase Aime','S6 PCM','weekend','2025-08-06 22:15:00','2025-08-06 22:20:00',NULL,'home','rut\n','pending',NULL,'2025-08-06 20:15:40','2025-08-06 20:15:40',NULL),(14,'kayinamura ntaganira elvaron','S5 MPC','personal','2025-08-06 22:15:00','2025-08-07 22:20:00',NULL,'home','yeah','pending',NULL,'2025-08-06 20:16:31','2025-08-06 20:16:31',NULL),(15,'rutagengwa eric','S5 MPC','weekend','2025-08-06 22:15:00','2025-08-07 22:20:00',NULL,'home','jj','pending',NULL,'2025-08-06 20:18:47','2025-08-06 20:18:47',NULL),(16,'usabase Aime','S6 PCM','medical','2025-08-06 22:23:00','2025-08-07 22:23:00',NULL,'home','ret','denied',NULL,'2025-08-06 20:23:56','2025-08-06 20:23:56',NULL),(17,'rutagengwa eric','S5 MPC','weekend','2025-08-06 22:23:00','2025-08-07 22:23:00',NULL,'home','rutt','approved',NULL,'2025-08-06 20:25:14','2025-08-06 20:55:00',NULL),(18,'rutagengwa eric','S5 MPC','medical','2025-08-06 22:26:00','2025-08-07 22:26:00',NULL,'home','rutnd','approved',NULL,'2025-08-06 20:26:50','2025-08-06 20:26:50',NULL),(19,'mbarimo mbazi fideri','S6 PCM','other','2025-08-06 22:27:00','2025-08-07 22:27:00',NULL,'home','ejfifje','pending',NULL,'2025-08-06 20:27:50','2025-08-06 20:27:50',NULL),(20,'usabase Aime','S6 PCM','medical','2025-08-06 22:28:00','2025-08-07 22:28:00',NULL,'home','hkhk','denied',NULL,'2025-08-06 20:28:45','2025-08-06 20:28:45',NULL),(21,'kayinamura ntaganira elvaron','S5 MPC','medical','2025-08-06 22:28:00','2025-08-07 22:28:00',NULL,'home','guhjblj','approved',NULL,'2025-08-06 20:29:51','2025-08-06 20:29:51',NULL),(22,'usabase Aime','S6 PCM','medical','2025-08-07 21:19:00','2025-08-08 12:19:00',NULL,'home','nago bikureb wanna','approved',NULL,'2025-08-07 19:20:09','2025-08-07 19:20:09',NULL),(23,'rutagengwa eric','S1','weekend','2025-08-07 22:01:00','2025-08-08 22:01:00',NULL,'home','wer[poiu','denied',NULL,'2025-08-07 20:43:38','2025-08-07 20:43:38',NULL),(24,'usabase Aime','S6 PCM','weekend','2025-08-24 17:55:00','2025-08-25 17:55:00',NULL,'home','he is sick','approved',NULL,'2025-08-24 15:59:34','2025-08-24 15:59:34',NULL),(25,'rutagengwa eric','S1','weekend','2025-08-24 18:18:00','2025-08-25 18:18:00',NULL,'home','jkjandjkdc','approved',NULL,'2025-08-24 16:19:50','2025-08-24 16:19:50',NULL),(26,'Abatesi Kellia','S6 MPC','weekend','2025-08-30 16:57:00','2025-12-23 16:57:00',NULL,'school issues','fuygyguyoui','approved',NULL,'2025-08-30 14:59:04','2025-08-30 14:59:04',NULL),(27,'rugambwa marcus','S5 MPC','weekend','2025-09-03 11:28:00','2025-09-04 11:28:00',NULL,'home','sick\n','approved',NULL,'2025-09-03 09:29:34','2025-09-03 09:29:34',NULL),(28,'hirwa emile','S6 MPC','medical','2025-09-24 11:12:00','2025-09-25 11:12:00',NULL,'home','ararwaye','approved',NULL,'2025-09-24 18:13:05','2025-09-24 18:13:05',NULL),(29,'Semutera nsanga Amede','S6 MPC','medical','2025-10-03 13:02:00','2025-10-04 13:02:00',NULL,'hospital','amenyo yatanye fooo','approved',NULL,'2025-10-03 20:03:14','2025-10-03 20:03:14',NULL),(30,'kayinamura ntaganira elvaron','S6 MPC','medical','2025-11-18 03:23:00','2025-11-19 03:23:00',NULL,'home','he was sick','approved',NULL,'2025-11-18 11:24:15','2025-11-18 11:24:15',NULL),(31,'munezero bruce','S6 MPC','medical','2026-01-21 00:56:00','2026-01-22 00:56:00',NULL,'home','he was sick','approved',NULL,'2026-01-21 08:56:47','2026-01-21 08:56:47',NULL),(32,'Nturengwa Masengesho Loic','S6 MSSI','medical','2026-01-21 03:34:00','2026-01-22 03:34:00',NULL,'hospital','sick','approved',NULL,'2026-01-21 11:35:23','2026-01-21 11:35:23',NULL);
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `removal_requests`
--

DROP TABLE IF EXISTS `removal_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `removal_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `fault_id` int DEFAULT NULL,
  `student_id` int NOT NULL,
  `requester_id` int NOT NULL,
  `reason` text NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolved_by` int DEFAULT NULL,
  `admin_comment` varchar(255) DEFAULT NULL,
  `points_deducted` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fault_id` (`fault_id`),
  KEY `student_id` (`student_id`),
  KEY `requester_id` (`requester_id`),
  KEY `resolved_by` (`resolved_by`),
  CONSTRAINT `removal_requests_ibfk_1` FOREIGN KEY (`fault_id`) REFERENCES `faults` (`id`),
  CONSTRAINT `removal_requests_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`),
  CONSTRAINT `removal_requests_ibfk_3` FOREIGN KEY (`requester_id`) REFERENCES `administrator` (`id`),
  CONSTRAINT `removal_requests_ibfk_4` FOREIGN KEY (`resolved_by`) REFERENCES `administrator` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `removal_requests`
--

LOCK TABLES `removal_requests` WRITE;
/*!40000 ALTER TABLE `removal_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `removal_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student`
--

DROP TABLE IF EXISTS `student`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_firstName` varchar(50) NOT NULL,
  `student_middleName` varchar(100) DEFAULT NULL,
  `student_lastName` varchar(50) NOT NULL,
  `student_class` varchar(50) DEFAULT NULL,
  `student_conduct` int DEFAULT '40',
  `date_registered` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=151 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student`
--

LOCK TABLES `student` WRITE;
/*!40000 ALTER TABLE `student` DISABLE KEYS */;
INSERT INTO `student` VALUES (1,'Aline','Jean','Habimana','S1',36,'2026-02-13 11:20:29'),(2,'Diane',NULL,'Niyonsaba','S1',37,'2026-02-13 11:20:29'),(3,'Claude',NULL,'Hakizimana','S1',36,'2026-02-13 11:20:29'),(4,'Aurore',NULL,'Mugisha','S1',34,'2026-02-13 11:20:29'),(5,'Emmanuel','Jean','Nyirahabimana','S1',36,'2026-02-13 11:20:29'),(6,'Brenda','Marie','Nkundimana','S1',37,'2026-02-13 11:20:29'),(7,'Thierry',NULL,'Nshimye','S1',34,'2026-02-13 11:20:29'),(8,'Pacifique',NULL,'Niyomugabo','S1',34,'2026-02-13 11:20:29'),(9,'Rosine','Jean','Ntezimana','S1',36,'2026-02-13 11:20:29'),(10,'Janvier',NULL,'Nduwayezu','S1',37,'2026-02-13 11:20:29'),(11,'Bosco','Jean','Mugiraneza','S2',36,'2026-02-13 11:20:29'),(12,'Yvette',NULL,'Rwigema','S2',34,'2026-02-13 11:20:29'),(13,'Serge',NULL,'Munyentwari','S2',36,'2026-02-13 11:20:29'),(14,'Ange',NULL,'Nshimiyimana','S2',37,'2026-02-13 11:20:29'),(15,'Gloriose','Jean','Ndayishimiye','S2',34,'2026-02-13 11:20:29'),(16,'Yvan','Marie','Niyigena','S2',34,'2026-02-13 11:20:29'),(17,'Alice',NULL,'Rukundo','S2',36,'2026-02-13 11:20:29'),(18,'Aimable',NULL,'Uwase','S2',37,'2026-02-13 11:20:29'),(19,'Moise','Jean','Dusengimana','S2',36,'2026-02-13 11:20:29'),(20,'Sonia',NULL,'Nkundabagenzi','S2',34,'2026-02-13 11:20:29'),(21,'Joyeuse','Jean','Nkundimana','S3',36,'2026-02-13 11:20:29'),(22,'Elie',NULL,'Nshimye','S3',37,'2026-02-13 11:20:29'),(23,'Olive',NULL,'Niyomugabo','S3',34,'2026-02-13 11:20:29'),(24,'Fabrice',NULL,'Ntezimana','S3',34,'2026-02-13 11:20:29'),(25,'Noella','Jean','Nduwayezu','S3',36,'2026-02-13 11:20:29'),(26,'Nadine','Marie','Habimana','S3',37,'2026-02-13 11:20:29'),(27,'Ericson',NULL,'Niyonsaba','S3',36,'2026-02-13 11:20:29'),(28,'Eric',NULL,'Hakizimana','S3',34,'2026-02-13 11:20:29'),(29,'Patrick','Jean','Mugisha','S3',36,'2026-02-13 11:20:29'),(30,'Chantal',NULL,'Nyirahabimana','S3',37,'2026-02-13 11:20:29'),(31,'Vestine','Jean','Niyigena','S4 MSSI',34,'2026-02-13 11:20:29'),(32,'Micheline',NULL,'Rukundo','S4 MSSI',34,'2026-02-13 11:20:29'),(33,'Darius',NULL,'Uwase','S4 MSSI',36,'2026-02-13 11:20:29'),(34,'Louise',NULL,'Dusengimana','S4 MSSI',37,'2026-02-13 11:20:29'),(35,'Kevin','Jean','Nkundabagenzi','S4 MSSI',36,'2026-02-13 11:20:29'),(36,'Clarisse','Marie','Mugiraneza','S4 MSSI',34,'2026-02-13 11:20:29'),(37,'Jean',NULL,'Rwigema','S4 MSSI',36,'2026-02-13 11:20:29'),(38,'Sandrine',NULL,'Munyentwari','S4 MSSI',37,'2026-02-13 11:20:29'),(39,'Didier','Jean','Nshimiyimana','S4 MSSI',34,'2026-02-13 11:20:29'),(40,'Belise',NULL,'Ndayishimiye','S4 MSSI',34,'2026-02-13 11:20:29'),(41,'Aline','Jean','Habimana','S4 MSSII',36,'2026-02-13 11:20:29'),(42,'Diane',NULL,'Niyonsaba','S4 MSSII',37,'2026-02-13 11:20:29'),(43,'Claude',NULL,'Hakizimana','S4 MSSII',36,'2026-02-13 11:20:29'),(44,'Aurore',NULL,'Mugisha','S4 MSSII',34,'2026-02-13 11:20:29'),(45,'Emmanuel','Jean','Nyirahabimana','S4 MSSII',36,'2026-02-13 11:20:29'),(46,'Brenda','Marie','Nkundimana','S4 MSSII',37,'2026-02-13 11:20:29'),(47,'Thierry',NULL,'Nshimye','S4 MSSII',34,'2026-02-13 11:20:29'),(48,'Pacifique',NULL,'Niyomugabo','S4 MSSII',34,'2026-02-13 11:20:29'),(49,'Rosine','Jean','Ntezimana','S4 MSSII',36,'2026-02-13 11:20:29'),(50,'Janvier',NULL,'Nduwayezu','S4 MSSII',37,'2026-02-13 11:20:29'),(51,'Bosco','Jean','Mugiraneza','S5 MPC',36,'2026-02-13 11:20:29'),(52,'Yvette',NULL,'Rwigema','S5 MPC',34,'2026-02-13 11:20:29'),(53,'Serge',NULL,'Munyentwari','S5 MPC',36,'2026-02-13 11:20:29'),(54,'Ange',NULL,'Nshimiyimana','S5 MPC',37,'2026-02-13 11:20:29'),(55,'Gloriose','Jean','Ndayishimiye','S5 MPC',34,'2026-02-13 11:20:29'),(56,'Yvan','Marie','Niyigena','S5 MPC',34,'2026-02-13 11:20:29'),(57,'Alice',NULL,'Rukundo','S5 MPC',36,'2026-02-13 11:20:29'),(58,'Aimable',NULL,'Uwase','S5 MPC',37,'2026-02-13 11:20:29'),(59,'Moise','Jean','Dusengimana','S5 MPC',36,'2026-02-13 11:20:29'),(60,'Sonia',NULL,'Nkundabagenzi','S5 MPC',34,'2026-02-13 11:20:29'),(61,'Joyeuse','Jean','Nkundimana','S5 MCB',36,'2026-02-13 11:20:29'),(62,'Elie',NULL,'Nshimye','S5 MCB',37,'2026-02-13 11:20:29'),(63,'Olive',NULL,'Niyomugabo','S5 MCB',34,'2026-02-13 11:20:29'),(64,'Fabrice',NULL,'Ntezimana','S5 MCB',34,'2026-02-13 11:20:29'),(65,'Noella','Jean','Nduwayezu','S5 MCB',36,'2026-02-13 11:20:29'),(66,'Nadine','Marie','Habimana','S5 MCB',37,'2026-02-13 11:20:29'),(67,'Ericson',NULL,'Niyonsaba','S5 MCB',36,'2026-02-13 11:20:29'),(68,'Eric',NULL,'Hakizimana','S5 MCB',34,'2026-02-13 11:20:29'),(69,'Patrick','Jean','Mugisha','S5 MCB',36,'2026-02-13 11:20:29'),(70,'Chantal',NULL,'Nyirahabimana','S5 MCB',37,'2026-02-13 11:20:29'),(71,'Vestine','Jean','Niyigena','S5 PCM',34,'2026-02-13 11:20:29'),(72,'Micheline',NULL,'Rukundo','S5 PCM',34,'2026-02-13 11:20:29'),(73,'Darius',NULL,'Uwase','S5 PCM',36,'2026-02-13 11:20:29'),(74,'Louise',NULL,'Dusengimana','S5 PCM',37,'2026-02-13 11:20:29'),(75,'Kevin','Jean','Nkundabagenzi','S5 PCM',36,'2026-02-13 11:20:29'),(76,'Clarisse','Marie','Mugiraneza','S5 PCM',34,'2026-02-13 11:20:29'),(77,'Jean',NULL,'Rwigema','S5 PCM',36,'2026-02-13 11:20:29'),(78,'Sandrine',NULL,'Munyentwari','S5 PCM',37,'2026-02-13 11:20:29'),(79,'Didier','Jean','Nshimiyimana','S5 PCM',34,'2026-02-13 11:20:29'),(80,'Belise',NULL,'Ndayishimiye','S5 PCM',34,'2026-02-13 11:20:29'),(81,'Aline','Jean','Habimana','S5 PCB',36,'2026-02-13 11:20:29'),(82,'Diane',NULL,'Niyonsaba','S5 PCB',37,'2026-02-13 11:20:29'),(83,'Claude',NULL,'Hakizimana','S5 PCB',36,'2026-02-13 11:20:29'),(84,'Aurore',NULL,'Mugisha','S5 PCB',34,'2026-02-13 11:20:29'),(85,'Emmanuel','Jean','Nyirahabimana','S5 PCB',36,'2026-02-13 11:20:29'),(86,'Brenda','Marie','Nkundimana','S5 PCB',37,'2026-02-13 11:20:29'),(87,'Thierry',NULL,'Nshimye','S5 PCB',34,'2026-02-13 11:20:29'),(88,'Pacifique',NULL,'Niyomugabo','S5 PCB',34,'2026-02-13 11:20:29'),(89,'Rosine','Jean','Ntezimana','S5 PCB',36,'2026-02-13 11:20:29'),(90,'Janvier',NULL,'Nduwayezu','S5 PCB',37,'2026-02-13 11:20:29'),(91,'Bosco','Jean','Mugiraneza','S5 MCE',36,'2026-02-13 11:20:29'),(92,'Yvette',NULL,'Rwigema','S5 MCE',34,'2026-02-13 11:20:29'),(93,'Serge',NULL,'Munyentwari','S5 MCE',36,'2026-02-13 11:20:29'),(94,'Ange',NULL,'Nshimiyimana','S5 MCE',37,'2026-02-13 11:20:29'),(95,'Gloriose','Jean','Ndayishimiye','S5 MCE',34,'2026-02-13 11:20:29'),(96,'Yvan','Marie','Niyigena','S5 MCE',34,'2026-02-13 11:20:29'),(97,'Alice',NULL,'Rukundo','S5 MCE',36,'2026-02-13 11:20:29'),(98,'Aimable',NULL,'Uwase','S5 MCE',37,'2026-02-13 11:20:29'),(99,'Moise','Jean','Dusengimana','S5 MCE',36,'2026-02-13 11:20:29'),(100,'Sonia',NULL,'Nkundabagenzi','S5 MCE',34,'2026-02-13 11:20:29'),(101,'Joyeuse','Jean','Nkundimana','S6 MPC',36,'2026-02-13 11:20:29'),(102,'Elie',NULL,'Nshimye','S6 MPC',37,'2026-02-13 11:20:29'),(103,'Olive',NULL,'Niyomugabo','S6 MPC',34,'2026-02-13 11:20:29'),(104,'Fabrice',NULL,'Ntezimana','S6 MPC',34,'2026-02-13 11:20:29'),(105,'Noella','Jean','Nduwayezu','S6 MPC',36,'2026-02-13 11:20:29'),(106,'Nadine','Marie','Habimana','S6 MPC',37,'2026-02-13 11:20:29'),(107,'Ericson',NULL,'Niyonsaba','S6 MPC',36,'2026-02-13 11:20:29'),(108,'Eric',NULL,'Hakizimana','S6 MPC',34,'2026-02-13 11:20:29'),(109,'Patrick','Jean','Mugisha','S6 MPC',36,'2026-02-13 11:20:29'),(110,'Chantal',NULL,'Nyirahabimana','S6 MPC',37,'2026-02-13 11:20:29'),(111,'Vestine','Jean','Niyigena','S6 MCB',34,'2026-02-13 11:20:29'),(112,'Micheline',NULL,'Rukundo','S6 MCB',34,'2026-02-13 11:20:29'),(113,'Darius',NULL,'Uwase','S6 MCB',36,'2026-02-13 11:20:29'),(114,'Louise',NULL,'Dusengimana','S6 MCB',37,'2026-02-13 11:20:29'),(115,'Kevin','Jean','Nkundabagenzi','S6 MCB',36,'2026-02-13 11:20:29'),(116,'Clarisse','Marie','Mugiraneza','S6 MCB',34,'2026-02-13 11:20:29'),(117,'Jean',NULL,'Rwigema','S6 MCB',36,'2026-02-13 11:20:29'),(118,'Sandrine',NULL,'Munyentwari','S6 MCB',37,'2026-02-13 11:20:29'),(119,'Didier','Jean','Nshimiyimana','S6 MCB',34,'2026-02-13 11:20:29'),(120,'Belise',NULL,'Ndayishimiye','S6 MCB',34,'2026-02-13 11:20:29'),(121,'Aline','Jean','Habimana','S6 PCM',36,'2026-02-13 11:20:29'),(122,'Diane',NULL,'Niyonsaba','S6 PCM',37,'2026-02-13 11:20:29'),(123,'Claude',NULL,'Hakizimana','S6 PCM',36,'2026-02-13 11:20:29'),(124,'Aurore',NULL,'Mugisha','S6 PCM',34,'2026-02-13 11:20:29'),(125,'Emmanuel','Jean','Nyirahabimana','S6 PCM',36,'2026-02-13 11:20:29'),(126,'Brenda','Marie','Nkundimana','S6 PCM',37,'2026-02-13 11:20:29'),(127,'Thierry',NULL,'Nshimye','S6 PCM',34,'2026-02-13 11:20:29'),(128,'Pacifique',NULL,'Niyomugabo','S6 PCM',34,'2026-02-13 11:20:29'),(129,'Rosine','Jean','Ntezimana','S6 PCM',36,'2026-02-13 11:20:29'),(130,'Janvier',NULL,'Nduwayezu','S6 PCM',37,'2026-02-13 11:20:29'),(131,'Bosco','Jean','Mugiraneza','S6 PCB',36,'2026-02-13 11:20:29'),(132,'Yvette',NULL,'Rwigema','S6 PCB',34,'2026-02-13 11:20:29'),(133,'Serge',NULL,'Munyentwari','S6 PCB',36,'2026-02-13 11:20:29'),(134,'Ange',NULL,'Nshimiyimana','S6 PCB',37,'2026-02-13 11:20:29'),(135,'Gloriose','Jean','Ndayishimiye','S6 PCB',34,'2026-02-13 11:20:29'),(136,'Yvan','Marie','Niyigena','S6 PCB',34,'2026-02-13 11:20:29'),(137,'Alice',NULL,'Rukundo','S6 PCB',36,'2026-02-13 11:20:29'),(138,'Aimable',NULL,'Uwase','S6 PCB',37,'2026-02-13 11:20:29'),(139,'Moise','Jean','Dusengimana','S6 PCB',36,'2026-02-13 11:20:29'),(140,'Sonia',NULL,'Nkundabagenzi','S6 PCB',34,'2026-02-13 11:20:29'),(141,'Joyeuse','Jean','Nkundimana','S6 MCE',36,'2026-02-13 11:20:29'),(142,'Elie',NULL,'Nshimye','S6 MCE',37,'2026-02-13 11:20:29'),(143,'Olive',NULL,'Niyomugabo','S6 MCE',34,'2026-02-13 11:20:29'),(144,'Fabrice',NULL,'Ntezimana','S6 MCE',34,'2026-02-13 11:20:29'),(145,'Noella','Jean','Nduwayezu','S6 MCE',36,'2026-02-13 11:20:29'),(146,'Nadine','Marie','Habimana','S6 MCE',37,'2026-02-13 11:20:29'),(147,'Ericson',NULL,'Niyonsaba','S6 MCE',36,'2026-02-13 11:20:29'),(148,'Eric',NULL,'Hakizimana','S6 MCE',34,'2026-02-13 11:20:29'),(149,'Patrick','Jean','Mugisha','S6 MCE',36,'2026-02-13 11:20:29'),(150,'Chantal',NULL,'Nyirahabimana','S6 MCE',37,'2026-02-13 11:20:29');
/*!40000 ALTER TABLE `student` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_conduct_history`
--

DROP TABLE IF EXISTS `student_conduct_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_conduct_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `term_id` int NOT NULL,
  `conduct_score` decimal(5,2) NOT NULL,
  `faults_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `term_id` (`term_id`),
  CONSTRAINT `student_conduct_history_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `student` (`id`),
  CONSTRAINT `student_conduct_history_ibfk_2` FOREIGN KEY (`term_id`) REFERENCES `terms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_conduct_history`
--

LOCK TABLES `student_conduct_history` WRITE;
/*!40000 ALTER TABLE `student_conduct_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_conduct_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_usernames` varchar(50) DEFAULT NULL,
  `teacher_password` varchar(255) DEFAULT NULL,
  `date_registered` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
INSERT INTO `teachers` VALUES (1,'bizimana franscwa','$2b$10$cjH5tCLouLiiEJXa6ZHdhehVHYtvh/uASwh4RrVCya8cCxBjh/McG','2025-02-21 10:52:17');
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `terms`
--

DROP TABLE IF EXISTS `terms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `terms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('active','archived') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `terms`
--

LOCK TABLES `terms` WRITE;
/*!40000 ALTER TABLE `terms` DISABLE KEYS */;
INSERT INTO `terms` VALUES (1,'Term 1','2025-11-01','2025-11-01','archived','2025-11-01 19:26:26'),(3,'Term 1','2025-11-01','2025-11-01','archived','2025-11-01 19:52:39'),(4,'Term 2','2026-01-04','2026-04-02','active','2025-11-01 19:55:50');
/*!40000 ALTER TABLE `terms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_otps`
--

DROP TABLE IF EXISTS `user_otps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_otps` (
  `otp_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `otp_secret` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL,
  `is_used` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`otp_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_otps_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=124 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_otps`
--

LOCK TABLES `user_otps` WRITE;
/*!40000 ALTER TABLE `user_otps` DISABLE KEYS */;
INSERT INTO `user_otps` VALUES (79,15,'N4SVQ5BEMFSDK6ZZO5ZD623IF44GG2LZ','2025-10-11 08:29:40','2025-10-11 08:34:40',0),(111,8,'GR6WML2YLBQX2USSIYXSMSKIFZGD4QDN','2026-01-14 13:22:37','2026-01-14 13:27:37',0),(122,16,'EFPEY2KHMFECML3RLZCEW6DIO5TSMVRP','2026-02-06 19:03:21','2026-02-06 19:08:21',0),(123,7,'N5WEETLVNMUWY5CJNBCECZCUJQSSML2M','2026-02-07 19:32:18','2026-02-07 19:37:18',0);
/*!40000 ALTER TABLE `user_otps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  `description` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name` (`role_name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,'admin','Full system access'),(2,'teacher','Can view students and request mark removal'),(3,'director','Can view all records and reports');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','teacher') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (7,'admin','','admin','2025-07-19 04:16:19','2025-07-19 04:16:19'),(8,'mbarimo mbazi','','admin','2025-07-19 05:26:54','2025-07-19 05:26:54'),(15,'','','admin','2025-10-11 08:06:58','2025-10-11 08:06:58'),(16,'director','','admin','2025-10-11 08:39:44','2025-10-11 08:39:44');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-19  7:07:04

