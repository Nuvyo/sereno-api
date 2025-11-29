import { DataSource, DataSourceOptions } from 'typeorm';
import { entities, PostgresConfig } from '../src/core/datasources/postgres.datasource';
import * as dotenv from 'dotenv';

dotenv.config();

const datasource = new DataSource({
  ...PostgresConfig,
  database: process.env.PGDATABASE_TEST,
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
  const deletes = entities.map(entity => {
    const metadata = datasource.getMetadata(entity);

    return `DELETE FROM ${metadata.tableName};`;
  });

  // Desabilitar restrições de chave estrangeira no PostgreSQL
  deletes.unshift('SET session_replication_role = replica;');
  deletes.push('SET session_replication_role = DEFAULT;');

  await datasource.query(deletes.join('\n'));
}
