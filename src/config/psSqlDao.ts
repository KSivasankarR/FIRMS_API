import postgresPool from './psSqlService';
import { QueryResult } from 'pg';

class PostgresDao {
  async executeQuery(
    query: string,
    params: any[] = []
  ): Promise<any[]> {
    const client = await postgresPool.connect();
    try {
      const result: QueryResult = await client.query(query, params);
      console.log("PostgreSQL rows returned:", result.rows.length);      
      return result.rows;
    } catch (err) {
      console.error('PostgreSQL Query Error:', err);
      throw err;
    } finally {
      client.release();
      console.log("Connection released");
    }
  }
}

export default new PostgresDao();