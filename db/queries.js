const pool = require("./pool");

exports.countItemsAndCategories = async () => {
  const { rows } = await pool.query(
    "SELECT COUNT(items.name) AS itemTotal, COUNT(categories.name) AS categoryTotal FROM items FULL JOIN categories ON items.id = categories.id"
  );
  return rows;
};

exports.getItemList = async () => {
  const { rows } = await pool.query("SELECT id, name, price FROM items");
  return rows;
};

exports.getItemById = async (itemId) => {
  const { rows } = await pool.query(
    `
    SELECT items.id, items.name, price, items.description, inStock, item_images.image,
      json_agg(json_build_object('catId', categories.id, 'catName', categories.name)) AS itemCats FROM items
    JOIN item_categories ON items.id = item_categories.item_id
    JOIN categories ON item_categories.cat_id = categories.id
    JOIN item_images ON items.id = item_images.item_id
    WHERE items.id = $1
    GROUP BY items.id;
    `,
    [itemId]
  );
  return rows;
};

exports.createItem = async (item, categoryIds) => {
  const insertItemStr = `WITH newItem AS (
    INSERT INTO items (name, description, inStock, price) VALUES
      ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING 
      RETURNING id AS new_id
    );
    INSERT INTO item_categories (item_id, cat_id)
    SELECT new_id, UNNEST(ARRAY($5)) FROM newItem;
    `;

  const { rows } = await pool.query(insertItemStr, [
    item.name,
    item.description,
    item.inStock,
    item.price,
    ...categoryIds,
  ]);
};
