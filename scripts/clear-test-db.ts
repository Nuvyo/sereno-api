import { DataSource, DataSourceOptions } from 'typeorm';
import { entities, PostgresConfig } from '../src/core/datasources/postgres.datasource';
import * as dotenv from 'dotenv';

dotenv.config();

const datasource = new DataSource({
  ...PostgresConfig,
  database: process.env.PGDATABASE_TEST,
  synchronize: false,
} as DataSourceOptions);

datasource.initialize()
  .then(async () => {
    await clearTables();

    // eslint-disable-next-line no-console
    console.log('Banco de dados de teste limpo com sucesso.');
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(`Falha ao realizar limpeza do banco de dados de teste: ${error}`);
  })
  .finally(async () => {
    await datasource.destroy();
  });

async function clearTables() {
  const tableNames = entities.map(entity => datasource.getMetadata(entity).tableName);

  await datasource.query('SET session_replication_role = replica;');

  for (const table of tableNames) {
    await datasource.query(`DELETE FROM ${table};`);
  }

  await datasource.query('SET session_replication_role = DEFAULT;');
}
