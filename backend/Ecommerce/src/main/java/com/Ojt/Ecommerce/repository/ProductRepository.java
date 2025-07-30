package com.Ojt.Ecommerce.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.Ojt.Ecommerce.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {
    public boolean existsByProductCode(String productCode);

    @Query("Select p from Product p where p.status <> 2")
    public List<Product> findAllProduct();

    @Query("Select p from Product p where p.quantity <> 0 and p.status <> 2 ORDER BY p.id DESC")
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

    @EntityGraph(attributePaths = {
            "productCategories.category",
            "productCategories.brand",
            "brand",
            "productImages",
            "productVariants",
            "productVariants.variantAttributeValues",
            "productVariants.variantAttributeValues.attributeValue",
            "productVariants.variantAttributeValues.attributeValue.attribute"
    })
    Optional<Product> findById(Long id);

    // Methods for finding products by brand, category, and brand-category
    @Query("SELECT p FROM Product p WHERE p.brand.id = :brandId")
    List<Product> findByBrandId(@Param("brandId") Long brandId);

    @Query("SELECT p FROM Product p JOIN p.productCategories pc WHERE pc.category.id = :categoryId")
    List<Product> findByCategoryId(@Param("categoryId") Long categoryId);

    @Query("SELECT p FROM Product p JOIN p.productCategories pc WHERE pc.brand.id = :brandId AND pc.category.id = :categoryId")
    List<Product> findByBrandIdAndCategoryId(@Param("brandId") Long brandId, @Param("categoryId") Long categoryId);

    List<Product> findByIdIn(List<Long> ids);

    @Query("select p.quantity from Product p where p.id = :productId")
    Long findProductQuantity(@Param("productId") Long productId);

    @Query("SELECT p FROM Product p WHERE p.status = 1 ORDER BY p.createDate DESC")
    List<Product> findTop4ByOrderByCreateDateDesc();

    @Query("SELECT p FROM Product p WHERE p.status = 1 ORDER BY p.createDate DESC LIMIT 5")
    List<Product> findTop5ByOrderByCreateDateDesc();

    @Query("SELECT p FROM Product p WHERE p.status = 1 ORDER BY p.createDate DESC LIMIT 10")
    List<Product> findTop10ByOrderByCreateDateDesc();

    @Query(value = """
        SELECT DISTINCT p.* FROM products p 
        LEFT JOIN product_has_category pc ON p.id = pc.product_id 
        WHERE p.status = 1 
        AND p.id NOT IN (:excludeProductIds) 
        AND (pc.category_id IN (:categoryIds) OR p.brand_id IN (:brandIds)) 
        ORDER BY RAND() 
        LIMIT 10
        """, nativeQuery = true)
    List<Product> findRelatedProducts(@Param("categoryIds") List<Long> categoryIds, 
                                     @Param("brandIds") List<Long> brandIds, 
                                     @Param("excludeProductIds") List<Long> excludeProductIds);

    @Query(value = """
    SELECT p.* FROM products p
    JOIN user_order_has_product uohp ON p.id = uohp.product_id
    GROUP BY p.id
    ORDER BY COUNT(uohp.id) DESC
    LIMIT 5
    """, nativeQuery = true)
    List<Product> findTop5OrderedProductsNative();

    @Query("""
    SELECT p FROM Product p
    JOIN p.productCategories pc
    LEFT JOIN pc.category c
    LEFT JOIN p.brand b
    WHERE p.status = 1 AND (
        LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        CAST(p.price AS string) LIKE CONCAT('%', :keyword, '%') OR
        LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(b.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
    )
""")
    List<Product> searchProducts(@Param("keyword") String keyword);

    @Query("""
    SELECT DISTINCT p FROM Product p
    JOIN p.productCategories pc
    LEFT JOIN pc.category c
    LEFT JOIN p.brand b
    WHERE p.status = 1 AND (
        LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(p.productCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        CAST(p.price AS string) LIKE CONCAT('%', :keyword, '%') OR
        LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(b.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
    )
    ORDER BY 
        CASE 
            WHEN LOWER(p.productName) LIKE LOWER(CONCAT(:keyword, '%')) THEN 1
            WHEN LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%')) THEN 2
            WHEN LOWER(c.name) LIKE LOWER(CONCAT(:keyword, '%')) THEN 3
            WHEN LOWER(b.name) LIKE LOWER(CONCAT(:keyword, '%')) THEN 4
            ELSE 5
        END,
        p.createDate DESC
""")
    List<Product> searchProductsComprehensive(@Param("keyword") String keyword);

    @Query("""
    SELECT DISTINCT p FROM Product p
    JOIN p.productCategories pc
    LEFT JOIN pc.category c
    LEFT JOIN p.brand b
    WHERE p.status = 1 AND (
        LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(p.productCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        CAST(p.price AS string) LIKE CONCAT('%', :keyword, '%') OR
        LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
        LOWER(b.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
    )
    ORDER BY p.createDate DESC
    LIMIT 20
""")
    List<Product> liveSearch(@Param("keyword") String keyword);
}

