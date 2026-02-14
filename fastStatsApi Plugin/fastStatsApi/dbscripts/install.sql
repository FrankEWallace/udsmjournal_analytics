-- Fast Stats API Plugin - Citation Counts Table
-- Run this to create the citation counts table

CREATE TABLE IF NOT EXISTS fast_stats_citation_counts (
    citation_count_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    publication_id BIGINT NOT NULL,
    doi VARCHAR(255) NOT NULL,
    citation_count INT NOT NULL DEFAULT 0,
    last_updated DATETIME NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'crossref',
    UNIQUE INDEX idx_doi (doi),
    INDEX idx_publication_id (publication_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
