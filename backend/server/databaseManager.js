import sqlite3 from 'sqlite3';
import { nanoid } from 'nanoid';
import { promisify } from 'util';
import path from 'path';

export class DatabaseManager {
  constructor() {
    const dbPath = process.env.NODE_ENV === 'production' 
      ? path.join(process.env.DATABASE_URL || '/tmp/cleansheet.db')
      : ':memory:';
    
    this.db = new sqlite3.Database(dbPath);
    this.run = promisify(this.db.run.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));
    this.get = promisify(this.db.get.bind(this.db));
    this.initDatabase();
  }

  async initDatabase() {
    await this.run(`
      CREATE TABLE IF NOT EXISTS tables (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async createTable(data) {
    const tableId = nanoid();
    await this.run(
      'INSERT INTO tables (id, data) VALUES (?, ?)',
      [tableId, JSON.stringify(data)]
    );
    return tableId;
  }

  async getData(tableId) {
    const result = await this.get(
      'SELECT data FROM tables WHERE id = ?',
      [tableId]
    );
    if (!result) {
      throw new Error('Table not found');
    }
    return JSON.parse(result.data);
  }

  async saveData(tableId, data) {
    const result = await this.run(
      'UPDATE tables SET data = ? WHERE id = ?',
      [JSON.stringify(data), tableId]
    );
    if (result.changes === 0) {
      throw new Error('Table not found');
    }
  }
}
