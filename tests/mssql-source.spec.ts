import { Job, MssqlProcessor } from '../src';
import * as utils from '../src/utils';
import { CustomDestination } from './helpers';

let db: any = null;
const connection = {
    user: 'sa',
    password: 'Passw0rd*',
    server: 'mssql',
    database: 'tempdb',
};

beforeAll(async () => {
    db = await utils.getDb(connection, 'mssql');
});

beforeEach(async () => {
    await db.query(`DROP TABLE IF EXISTS test`);
    await db.query(`CREATE TABLE test
    (
        id integer
    )`);
});

afterAll(async () => {
    await utils.closeDbConnection(connection);
})

it('gets data from mssql', async () => {
    await db.query(`INSERT INTO test (id) values (123)`);
    const destination = new CustomDestination({
        batchSize: 1,
    });
    const processor = new MssqlProcessor({
        connection,
        query: `select id from test`,
    });
    const job = new Job(processor, [destination]);
    await job.run();
    expect(destination.getData()).toEqual([{
        id: 123,
    }]);
});

it('respects rowLimit', async () => {
    await db.query(`INSERT INTO test (id) values (1), (2), (3), (4)`);
    const destination = new CustomDestination();
    const processor = new MssqlProcessor({
        connection,
        query: `select id from test`,
        rowLimit: 3,
    });
    const job = new Job(processor, [destination]);
    await job.run();
    expect(destination.getData()).toEqual([{
        id: 1,
    }, {
        id: 2,
    }, {
        id: 3,
    }]);
});