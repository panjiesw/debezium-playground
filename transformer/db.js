const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'password',
  host: 'db-olap',
  database: 'olap',
});

const processCustomerDim = async ({ id, first_name, last_name }) => {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `INSERT INTO customers_dim(id, first_name, last_name) VALUES($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name`,
      [id, first_name, last_name],
    );
    console.log('insert customer result', res);
  } finally {
    client.release();
  }
};

const processProductDim = async ({ id, name }) => {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `INSERT INTO products_dim(id, name) VALUES($1, $2)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [id, name],
    );
    console.log('insert product result', res);
  } finally {
    client.release();
  }
};

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
    customers: processCustomerDim,
    products: processProductDim,
    orders: processOrderDim,
  }
};
