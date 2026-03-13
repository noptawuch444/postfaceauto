-- ========================================
-- Facebook AutoPost System - PostgreSQL
-- ========================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pages (
    id SERIAL PRIMARY KEY,
    page_id VARCHAR(100) UNIQUE NOT NULL,
    page_name VARCHAR(255) NOT NULL,
    page_access_token TEXT NOT NULL,
    page_picture TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY,
    page_id VARCHAR(100) NOT NULL REFERENCES pages(page_id) ON DELETE CASCADE,
    template_name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    expire_date TIMESTAMP NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    auto_reply_enabled BOOLEAN DEFAULT FALSE,
    auto_reply_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    message TEXT,
    image_url TEXT,
    schedule_time TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    fb_post_id VARCHAR(255),
    error_message TEXT,
    auto_reply_text TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT
);


-- Default admin user (password: admin123 - bcrypt hash)
INSERT INTO users (email, password, role) VALUES
('admin@autopost.com', '$2b$10$8K1p/a0dL1LXMIgoEDFrwOflFQ.DhW04KRAFIUOcFmLVAxUdYqSO.', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_schedule ON posts(schedule_time);
CREATE INDEX IF NOT EXISTS idx_templates_slug ON templates(slug);
