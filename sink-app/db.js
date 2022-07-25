const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'password',
  host: 'db-olap-sink',
  database: 'olap',
});

const processOrderDim = async ({ date_id, customer_id, product_id, quantity }) => {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `INSERT INTO orders_fact(date_id, customer_id, product_id, quantity)
      VALUES($1, $2, $3, $4)
      ON CONFLICT(date_id, customer_id, product_id) DO UPDATE SET
        quantity = orders_fact.quantity + EXCLUDED.quantity`,
      [date_id, customer_id, product_id, quantity],
    );
    console.log('insert order result', res);
  } finally {
    client.release();
  }
};

const queryDate = async () => {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM dates_dim LIMIT 10');
    console.dir(res.rows);
  } finally {
    client.release();
  }
};

module.exports = {
  queryDate,
  olap: {
    orders: processOrderDim,
  }
};
