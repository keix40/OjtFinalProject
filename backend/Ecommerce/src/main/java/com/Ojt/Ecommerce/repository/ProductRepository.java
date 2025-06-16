package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    public boolean existsByProductCode(String productCode);

    @Query("Select p from Product p where p.status <> 2")
    public List<Product> findAllProduct();

    @Query("Select p from Product p where p.quantity <> 0 and p.status <> 2")
    public List<Product> getAllActiveProduct();

    @Modifying
    @Query("Update Product p set p.status = 2 where p.id = :id")
    public void deleteProduct(@Param("id") Long id);

    @Modifying
    @Query("Update Product p set p.status = 0 where p.id = :id")
    public void inactiveProduct(@Param("id") Long id);

    @Modifying
    @Query("Update Product p set p.status = 1 where p.id = :id")
    public void activeProduct(@Param("id") Long id);

    @Query(value = """
        SELECT 
            p.id AS productId,
            p.product_name AS productName,
            p.product_code AS productCode,
            p.description,
            p.status,
            p.create_date AS createDate,
            p.update_date AS updateDate,

            b.id AS brandId,
            b.name AS brandName,

            c.id AS categoryId,
            c.name AS categoryName,

            pi.id AS imageId,
            pi.image_url AS imageUrl,
            pi.status AS imageStatus,
            pi.variant_id AS imageVariantId,

            pv.id AS variantId,
            pv.stock_keeping AS stockKeeping,
            pv.price,
            pv.stock,

            av.id AS attributeValueId,
            av.value AS attributeValue,
            a.id AS attributeId,
            a.name AS attributeName

        FROM products p
        LEFT JOIN brand b ON p.brand_id = b.id
        LEFT JOIN product_has_category pc ON p.id = pc.product_id
        LEFT JOIN category c ON pc.category_id = c.id
        LEFT JOIN product_image pi ON p.id = pi.product_id
        LEFT JOIN product_variants pv ON p.id = pv.product_id
        LEFT JOIN variant_attribute_value vav ON pv.id = vav.product_variants_id
        LEFT JOIN attribute_value av ON vav.attribute_value_id = av.id
        LEFT JOIN attribute a ON av.attribute_id = a.id
        WHERE p.id = :productId
        """,
            nativeQuery = true)
    List<Object[]> getAdminProductDetail(@Param("productId") Long productId);
}
