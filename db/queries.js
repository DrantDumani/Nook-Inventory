const pool = require("./pool");

exports.countItemsAndCategories = async () => {
  const { rows } = await pool.query(
    "SELECT COUNT(items.name) AS itemTotal, COUNT(categories.name) AS categoryTotal FROM items FULL JOIN categories ON items.id = categories.id"
  );
  return rows;
};

exports.getItemList = async () => {
  const { rows } = await pool.query(
    "SELECT id, name, price FROM items ORDER BY name ASC"
  );
  return rows;
};

exports.getItemById = async (itemId) => {
  const { rows } = await pool.query(
    `
    SELECT items.id, items.name, price, items.description, inStock, item_images.image,
      json_agg(json_build_object('catId', categories.id, 'catName', categories.name)) AS categories FROM items
    JOIN item_categories ON items.id = item_categories.item_id
    JOIN categories ON item_categories.cat_id = categories.id
    LEFT JOIN item_images ON items.id = item_images.item_id
    WHERE items.id = $1
    GROUP BY items.id, item_images.image;
    `,
    [itemId]
  );
  return rows[0];
};

exports.createItem = async (item) => {
  const insertItemStr = `WITH newItem AS (
    INSERT INTO items (name, description, inStock, price) VALUES
      ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING 
      RETURNING id AS new_id
    )
    INSERT INTO item_categories (item_id, cat_id)
    SELECT new_id, UNNEST($5::int[]) FROM newItem RETURNING item_id;
    `;

  const { rows } = await pool.query(insertItemStr, [
    item.name,
    item.description,
    item.instock,
    item.price,
    item.category,
  ]);
  return rows;
};

exports.insertOrUpdateImage = async (id, imgUrl, imgId) => {
  const { rows } = await pool.query(
    `INSERT INTO item_images (item_id, image, img_public_id) VALUES
    ($1, $2, $3) ON CONFLICT (item_id) DO UPDATE SET 
    image = EXCLUDED.image,
    img_public_id = EXCLUDED.img_public_id`,
    [id, imgUrl, imgId]
  );
};

exports.getItemNameAndStock = async (id) => {
  const { rows } = await pool.query(
    "SELECT id, name, inStock FROM items WHERE id = $1",
    [id]
  );
  return rows[0];
};

exports.deleteItemById = async (id) => {
  const { rows } = await pool.query(
    `WITH deleted_item AS (
      DELETE FROM items WHERE id = $1 RETURNING id
    )
    DELETE FROM item_images WHERE item_id = (
      SELECT id FROM deleted_item
    ) RETURNING img_public_id;`,
    [id]
  );
  return rows[0];
};

exports.updateItem = async (item) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const updateItemQuery = `UPDATE items SET name = $2, description = $3, inStock = $4, price = $5
      WHERE id = $1`;
    await client.query(updateItemQuery, [
      item.id,
      item.name,
      item.description,
      item.instock,
      item.price,
    ]);
    const removeCatQuery = `DELETE FROM item_categories WHERE item_id = $1 AND cat_id <> ANY ($2)`;
    await client.query(removeCatQuery, [item.id, item.category]);
    const addNewCatQuery = `INSERT INTO item_categories (item_id, cat_id) 
      SELECT $1, UNNEST($2::int[]) ON CONFLICT DO NOTHING`;
    await client.query(addNewCatQuery, [item.id, item.category]);
    const { rows } = await client.query(
      `SELECT items.id, item_images.img_public_id FROM 
       items LEFT JOIN item_images ON items.id = item_images.item_id
       WHERE items.id = $1`,
      [item.id]
    );

    await client.query("COMMIT");
    return rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    console.log(err);
    return err;
  } finally {
    client.release();
  }
};

exports.getCategoryList = async () => {
  const { rows } = await pool.query(
    "SELECT id, name FROM categories ORDER BY name ASC"
  );
  return rows;
};
