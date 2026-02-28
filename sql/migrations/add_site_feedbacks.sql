CREATE TABLE site_feedbacks (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(id),
    nickname    VARCHAR(100),
    contact     VARCHAR(100),
    content     TEXT NOT NULL,
    status      VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PUBLISHED', 'REJECTED', 'HIDDEN')),
    ip_address  INET,
    created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedbacks_created_at ON site_feedbacks(created_at DESC);
CREATE INDEX idx_feedbacks_status ON site_feedbacks(status);
