-- get shop and activity from  cart
SELECT
    sp.product_sid as rel_sid,
    sp.name as rel_name,
    spd.product_detail_sid as rel_seq_sid,
    spd.name as rel_seq_name,
    spd.price as prod_price,
    oc.product_qty as prod_qty,
    oc.rel_type as rel_type,
    0 as adult_price,
    0 as child_price,
    0 as adult_qty,
    0 as child_qty
FROM
    order_cart oc
    JOIN shop_product sp ON oc.rel_sid = sp.product_sid
    JOIN shop_product_detail spd ON sp.product_sid = spd.product_sid
    AND oc.rel_seq_sid = spd.product_detail_sid
WHERE
    oc.member_sid = 'mem00471'
    AND oc.order_status = '001'
UNION
ALL -- get activity in cart
SELECT
    ai.activity_sid as rel_sid,
    ai.name as rel_name,
    ag.activity_group_sid as rel_seq_sid,
    ag.date as rel_seq_name,
    0 as prod_price,
    0 as prod_qty,
    oc.rel_type as rel_type,
    ag.price_adult as adult_price,
    ag.price_kid as child_price,
    oc.adult_qty as adult_qty,
    oc.child_qty as child_qty
FROM
    order_cart oc
    JOIN activity_info ai ON oc.rel_sid = ai.activity_sid
    JOIN activity_group ag ON ai.activity_sid = ag.activity_sid
    AND oc.rel_seq_sid = ag.activity_group_sid
WHERE
    oc.member_sid = 'mem00471'
    AND oc.order_status = '001'