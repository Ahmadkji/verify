import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (db) return db;

  db = await open({
    filename: path.join(process.cwd(), 'verification.db'),
    driver: sqlite3.Database
  });

  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS verification_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK (type IN ('email', 'phone')),
      value TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
      verification_code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT,
      validation_data TEXT,
      reputation_data TEXT,
      api_response_time INTEGER,
      quality_score REAL,
      risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high'))
    );

    CREATE INDEX IF NOT EXISTS idx_verification_type_value ON verification_requests(type, value);
    CREATE INDEX IF NOT EXISTS idx_verification_status ON verification_requests(status);
    CREATE INDEX IF NOT EXISTS idx_verification_created_at ON verification_requests(created_at);
    CREATE INDEX IF NOT EXISTS idx_verification_quality_score ON verification_requests(quality_score);
    CREATE INDEX IF NOT EXISTS idx_verification_risk_level ON verification_requests(risk_level);
  `);

  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}

// Database interface functions
export interface VerificationRequest {
  id?: number;
  type: 'email' | 'phone';
  value: string;
  status: 'pending' | 'verified' | 'failed';
  verification_code?: string;
  created_at?: string;
  updated_at?: string;
  ip_address?: string;
  user_agent?: string;
  validation_data?: unknown;
  reputation_data?: unknown;
  api_response_time?: number;
  quality_score?: number;
  risk_level?: 'low' | 'medium' | 'high';
}

export async function createVerificationRequest(
  request: Omit<VerificationRequest, 'id' | 'created_at' | 'updated_at'>
): Promise<VerificationRequest> {
  const db = await getDatabase();
  const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const result = await db.run(
    `INSERT INTO verification_requests (type, value, status, verification_code, ip_address, user_agent, validation_data, reputation_data, api_response_time, quality_score, risk_level)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      request.type, 
      request.value, 
      request.status || 'pending', 
      verificationCode, 
      request.ip_address, 
      request.user_agent,
      request.validation_data ? JSON.stringify(request.validation_data) : null,
      request.reputation_data ? JSON.stringify(request.reputation_data) : null,
      request.api_response_time || null,
      request.quality_score || null,
      request.risk_level || null
    ]
  );

  return {
    id: result.lastID,
    ...request,
    status: request.status || 'pending',
    verification_code: verificationCode,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export async function updateVerificationStatus(
  id: number,
  status: 'verified' | 'failed'
): Promise<void> {
  const db = await getDatabase();
  await db.run(
    'UPDATE verification_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, id]
  );
}

export async function getVerificationRequestsByValue(
  type: 'email' | 'phone',
  value: string
): Promise<VerificationRequest[]> {
  const db = await getDatabase();
  const rows = await db.all(
    'SELECT * FROM verification_requests WHERE type = ? AND value = ? ORDER BY created_at DESC',
    [type, value]
  );
  
  // Parse JSON fields
  return rows.map(row => ({
    ...row,
    validation_data: row.validation_data ? JSON.parse(row.validation_data) : undefined,
    reputation_data: row.reputation_data ? JSON.parse(row.reputation_data) : undefined,
  }));
}

export async function getVerificationRequest(id: number): Promise<VerificationRequest | null> {
  const db = await getDatabase();
  const row = await db.get('SELECT * FROM verification_requests WHERE id = ?', [id]);
  if (!row) return null;
  
  return {
    ...row,
    validation_data: row.validation_data ? JSON.parse(row.validation_data) : undefined,
    reputation_data: row.reputation_data ? JSON.parse(row.reputation_data) : undefined,
  };
}

export async function updateVerificationRequest(
  id: number,
  updates: Partial<VerificationRequest>
): Promise<void> {
  const db = await getDatabase();
  const fields = [];
  const values = [];
  
  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.validation_data !== undefined) {
    fields.push('validation_data = ?');
    values.push(JSON.stringify(updates.validation_data));
  }
  if (updates.reputation_data !== undefined) {
    fields.push('reputation_data = ?');
    values.push(JSON.stringify(updates.reputation_data));
  }
  if (updates.api_response_time !== undefined) {
    fields.push('api_response_time = ?');
    values.push(updates.api_response_time);
  }
  if (updates.quality_score !== undefined) {
    fields.push('quality_score = ?');
    values.push(updates.quality_score);
  }
  if (updates.risk_level !== undefined) {
    fields.push('risk_level = ?');
    values.push(updates.risk_level);
  }
  
  if (fields.length > 0) {
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await db.run(
      `UPDATE verification_requests SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }
}

export async function getVerificationStats(): Promise<{
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  average_quality_score: number;
  risk_distribution: { low: number; medium: number; high: number };
}> {
  const db = await getDatabase();
  
  const total = await db.get('SELECT COUNT(*) as count FROM verification_requests');
  const successful = await db.get('SELECT COUNT(*) as count FROM verification_requests WHERE status = "verified"');
  const failed = await db.get('SELECT COUNT(*) as count FROM verification_requests WHERE status = "failed"');
  const avgResponseTime = await db.get('SELECT AVG(api_response_time) as avg FROM verification_requests WHERE api_response_time IS NOT NULL');
  const avgQualityScore = await db.get('SELECT AVG(quality_score) as avg FROM verification_requests WHERE quality_score IS NOT NULL');
  
  const riskDistribution = await db.get(`
    SELECT 
      SUM(CASE WHEN risk_level = 'low' THEN 1 ELSE 0 END) as low,
      SUM(CASE WHEN risk_level = 'medium' THEN 1 ELSE 0 END) as medium,
      SUM(CASE WHEN risk_level = 'high' THEN 1 ELSE 0 END) as high
    FROM verification_requests 
    WHERE risk_level IS NOT NULL
  `);
  
  return {
    total_requests: total.count,
    successful_requests: successful.count,
    failed_requests: failed.count,
    average_response_time: avgResponseTime.avg || 0,
    average_quality_score: avgQualityScore.avg || 0,
    risk_distribution: riskDistribution || { low: 0, medium: 0, high: 0 }
  };
}
