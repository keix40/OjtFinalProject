package com.Ojt.Ecommerce.repository;

import com.Ojt.Ecommerce.entity.UserOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<UserOrder, Long> {
    boolean existsByOrderCode(String orderCode);

    List<UserOrder> findByUserId(Long userId);

    @EntityGraph(attributePaths = {
            "orderProducts",
            "orderStatusHistory"
    })
    @Query("SELECT o FROM UserOrder o WHERE o.id = :id")
    UserOrder findByIdWithEntity(@Param("id") Long id);

    // Analytics queries for pie charts (all orders)
        @Query("SELECT b.name as name, COUNT(uohp.id) as value " +
           "FROM UserOrder uo " +
           "JOIN uo.orderProducts uohp " +
           "JOIN uohp.product p " +
           "JOIN p.brand b " +
           "WHERE uo.orderDate BETWEEN :startDate AND :endDate " +
           "GROUP BY b.id, b.name " +
           "ORDER BY value DESC")
    List<Object[]> getBrandSalesData(@Param("startDate") LocalDateTime startDate,
                                    @Param("endDate") LocalDateTime endDate);

    @Query("SELECT c.name as name, COUNT(uohp.id) as value " +
           "FROM UserOrder uo " +
           "JOIN uo.orderProducts uohp " +
           "JOIN uohp.product p " +
           "JOIN p.productCategories phc " +
           "JOIN phc.category c " +
           "WHERE uo.orderDate BETWEEN :startDate AND :endDate " +
           "GROUP BY c.id, c.name " +
           "ORDER BY value DESC")
    List<Object[]> getCategorySalesData(@Param("startDate") LocalDateTime startDate,
                                       @Param("endDate") LocalDateTime endDate);

    @Query("SELECT p.productName as name, COUNT(uohp.id) as value " +
           "FROM UserOrder uo " +
           "JOIN uo.orderProducts uohp " +
           "JOIN uohp.product p " +
           "WHERE uo.orderDate BETWEEN :startDate AND :endDate " +
           "GROUP BY p.id, p.productName " +
           "ORDER BY value DESC " +
           "LIMIT 10")
    List<Object[]> getProductSalesData(@Param("startDate") LocalDateTime startDate,
                                      @Param("endDate") LocalDateTime endDate);

    @Query("SELECT ds.name as name, COUNT(uo.id) as value " +
           "FROM UserOrder uo " +
           "JOIN uo.deliveryService ds " +
           "WHERE uo.orderDate BETWEEN :startDate AND :endDate " +
           "GROUP BY ds.id, ds.name " +
           "ORDER BY value DESC")
    List<Object[]> getDeliveryServiceData(@Param("startDate") LocalDateTime startDate,
                                         @Param("endDate") LocalDateTime endDate);

    // Alternative queries for completed orders only (if you want to filter by status)
    @Query("SELECT b.name as name, COUNT(uohp.id) as value " +
           "FROM UserOrder uo " +
           "JOIN uo.orderProducts uohp " +
           "JOIN uohp.product p " +
           "JOIN p.brand b " +
           "JOIN uo.orderStatusHistory osh " +
           "JOIN osh.status s " +
           "WHERE uo.orderDate BETWEEN :startDate AND :endDate " +
           "AND s.name IN ('DELIVERED', 'SHIPPED', 'COMPLETED') " +
           "GROUP BY b.id, b.name " +
           "ORDER BY value DESC")
    List<Object[]> getBrandSalesDataCompleted(@Param("startDate") LocalDateTime startDate,
                                             @Param("endDate") LocalDateTime endDate);

    // Debug queries
    @Query("SELECT COUNT(DISTINCT uo.id) FROM UserOrder uo " +
           "JOIN uo.orderStatusHistory osh " +
           "JOIN osh.status s " +
           "WHERE s.name = 'DELIVERED'")
    long countDeliveredOrders();

    @Query("SELECT COUNT(DISTINCT b.id) FROM Brand b")
    long countBrands();
}
