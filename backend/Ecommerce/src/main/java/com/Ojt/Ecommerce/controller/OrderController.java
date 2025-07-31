package com.Ojt.Ecommerce.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.Ojt.Ecommerce.dto.CustomerSummaryDTO;
import com.Ojt.Ecommerce.annotations.LogActivity;
import com.Ojt.Ecommerce.annotations.PermissionCategoryTag;
import com.Ojt.Ecommerce.annotations.RequiresPermission;
import static com.Ojt.Ecommerce.constants.PermissionConstants.ORDERS_CREATE;
import static com.Ojt.Ecommerce.constants.PermissionConstants.ORDERS_UPDATE;
import static com.Ojt.Ecommerce.constants.PermissionConstants.ORDERS_VIEW;
import com.Ojt.Ecommerce.dto.DiscountDTO;
import com.Ojt.Ecommerce.dto.UserOrderDTO;
import com.Ojt.Ecommerce.dto.UserOrderListDTO;
import com.Ojt.Ecommerce.dto.BrandSalesDTO;
import com.Ojt.Ecommerce.dto.CategorySalesDTO;
import com.Ojt.Ecommerce.dto.ProductSalesDTO;
import com.Ojt.Ecommerce.dto.DeliveryServiceDTO;
import com.Ojt.Ecommerce.dto.AddressDTO;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import com.Ojt.Ecommerce.entity.UserOrder;
import com.Ojt.Ecommerce.service.DeliveryService;
import com.Ojt.Ecommerce.service.OrderService;
import com.Ojt.Ecommerce.service.UserActivityService;
import com.Ojt.Ecommerce.service.SessionService;
import com.Ojt.Ecommerce.service.UserService;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/order")
@PermissionCategoryTag(value = "orders", name = "Order Management", icon = "fa-shopping-cart")
public class OrderController {
    @Autowired
    private OrderService service;

    @Autowired
    private DeliveryService deliveryService;


    @Autowired
    private UserActivityService userActivityService;

    @Autowired
    private SessionService sessionService;

    @Autowired
    private UserService userService;

    @GetMapping("/getdeliveryservices")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<?> getAllDeliveryServices() {
        return ResponseEntity.ok(deliveryService.getAll());
    }

    @GetMapping("/preview-delivery-fee")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<?> getDeliveryFee(
            @RequestParam Long deliveryServiceId,
            @RequestParam Long addressId) {
        try {
            double fee = deliveryService.calculateFeeByDistance(deliveryServiceId, addressId);
            return ResponseEntity.ok(Map.of("fee", fee));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Failed to calculate delivery fee: " + e.getMessage());
        }
    }

    @GetMapping("/calculateFeeByDistance")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<?> calculateFeeByDistance(@RequestParam Long deliveryServiceId, @RequestParam Long addressId) {
        try {
            double fee = deliveryService.calculateFeeByDistance(deliveryServiceId, addressId);
            return ResponseEntity.ok(Map.of("fee", fee));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Failed to calculate delivery fee: " + e.getMessage());
        }
    }

    //discount
    @GetMapping("/getdiscount/{userId}/{code}")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<?> getDiscountByCode(@PathVariable Long userId, @PathVariable String code) {
        DiscountDTO disDto = service.getDiscountByCode(code);
        if (disDto == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Discount not found");
        }
        boolean checkUsed = service.checkDiscountUsed(disDto.getId(), userId);
        if (checkUsed) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("used");
        }
        return ResponseEntity.ok(disDto);
    }

    @LogActivity(actionType = "CREATE", entityType = "ORDER", description = "Created order", severityLevel = "MEDIUM")
    @PostMapping("/create")
    @RequiresPermission(value = ORDERS_CREATE, level = "basic")
    public ResponseEntity<?> createOrder(@RequestBody UserOrderDTO dto){
        System.out.println("Received order DTO: " + dto);
        try {
            UserOrder order = service.createOrder(dto);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Order creation failed: " + e.getMessage());
        }
    }

    //add for discount  preview by pmk july 9
    @PostMapping("/preview")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<?> previewOrder(@RequestBody UserOrderDTO dto) {
        return ResponseEntity.ok(service.previewOrder(dto));
    }

    @GetMapping("/getorderbyuserid/{userId}")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<List<UserOrderListDTO>> getOrdersByUserId(@PathVariable Long userId) {
        List<UserOrderListDTO> orders = service.getOrdersByUserId(userId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/getallorder")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic", description = "Get all orders")
    public ResponseEntity<List<UserOrderListDTO>> getAllOrder(){
        List<UserOrderListDTO> orders = service.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/total-sales")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<Double> getTotalSales() {
        double totalSales = service.getAllOrders().stream()
            .mapToDouble(order -> order.getTotal() != null ? order.getTotal() : 0)
            .sum();
        return ResponseEntity.ok(totalSales);
    }

    @GetMapping("/sales-trend")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<List<Map<String, Object>>> getSalesTrend(@RequestParam(defaultValue = "day") String timeFrame) {
        List<UserOrderListDTO> orders = service.getAllOrders();
        Map<String, Double> groupedTotal = new java.util.LinkedHashMap<>();
        Map<String, Integer> groupedCount = new java.util.LinkedHashMap<>();
        Map<String, Integer> groupedCustomers = new java.util.LinkedHashMap<>();
        Map<String, Integer> groupedActiveUsers = new java.util.LinkedHashMap<>();
        DateTimeFormatter formatter;

        // Get active users data for the period
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start;
        switch (timeFrame) {
            case "hour": start = now.minusHours(24); break;
            case "week": start = now.minusWeeks(1); break;
            case "month": start = now.minusMonths(1); break;
            case "year": start = now.minusYears(1); break;
            case "day":
            default: start = now.minusDays(30); break;
        }

        // Get active users per period - we need to count unique users per time period
        Map<String, Integer> activeUsersByPeriod = new java.util.HashMap<>();

        switch (timeFrame) {
            case "hour":
                formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH");
                // Generate all 24 hours with zero values first
                for (int i = 0; i < 24; i++) {
                    LocalDateTime hourStart = now.minusHours(23 - i).withMinute(0).withSecond(0).withNano(0);
                    String key = hourStart.format(formatter);
                    groupedTotal.put(key, 0.0);
                    groupedCount.put(key, 0);
                    groupedCustomers.put(key, 0);
                    activeUsersByPeriod.put(key, 0);
                }
                // Group orders by hour
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getTotal() != null) {
                        String key = order.getOrderDate().format(formatter);
                        if (groupedTotal.containsKey(key)) {
                            groupedTotal.put(key, groupedTotal.get(key) + order.getTotal());
                            groupedCount.put(key, groupedCount.get(key) + 1);
                        }
                    }
                }
                // Count unique customers by hour (users who placed orders)
                Map<String, java.util.Set<Long>> customersByHour = new java.util.HashMap<>();
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getUser() != null) {
                        String key = order.getOrderDate().format(formatter);
                        if (groupedTotal.containsKey(key)) {
                            customersByHour.computeIfAbsent(key, k -> new java.util.HashSet<>()).add(order.getUser().getId());
                        }
                    }
                }
                // Convert to count
                for (Map.Entry<String, java.util.Set<Long>> entry : customersByHour.entrySet()) {
                    groupedCustomers.put(entry.getKey(), entry.getValue().size());
                }
                // Count unique active users by hour
                for (int i = 0; i < 24; i++) {
                    LocalDateTime periodStart = now.minusHours(23 - i).withMinute(0).withSecond(0).withNano(0);
                    LocalDateTime periodEnd = periodStart.plusHours(1);
                    String key = periodStart.format(formatter);
                    int uniqueUsers = userActivityService.countActiveUsers(periodStart, periodEnd);
                    activeUsersByPeriod.put(key, uniqueUsers);
                }
                break;
            case "month":
                formatter = DateTimeFormatter.ofPattern("yyyy-MM");
                // Group orders by month
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getTotal() != null) {
                        String key = order.getOrderDate().format(formatter);
                        groupedTotal.put(key, groupedTotal.getOrDefault(key, 0.0) + order.getTotal());
                        groupedCount.put(key, groupedCount.getOrDefault(key, 0) + 1);
                    }
                }

                // Count unique customers by month
                Map<String, java.util.Set<Long>> customersByMonth = new java.util.HashMap<>();
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getUser() != null) {
                        String key = order.getOrderDate().format(formatter);
                        customersByMonth.computeIfAbsent(key, k -> new java.util.HashSet<>()).add(order.getUser().getId());
                    }
                }
                // Convert to count
                for (Map.Entry<String, java.util.Set<Long>> entry : customersByMonth.entrySet()) {
                    groupedCustomers.put(entry.getKey(), entry.getValue().size());
                }
                // Count unique active users by month
                for (int i = 0; i < 12; i++) {
                    LocalDateTime periodStart = now.minusMonths(12 - i).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
                    LocalDateTime periodEnd = periodStart.plusMonths(1);
                    String key = periodStart.format(formatter);
                    int uniqueUsers = userActivityService.countActiveUsers(periodStart, periodEnd);
                    activeUsersByPeriod.put(key, uniqueUsers);
                }
                break;
            case "year":
                formatter = DateTimeFormatter.ofPattern("yyyy");
                // Group orders by year
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getTotal() != null) {
                        String key = order.getOrderDate().format(formatter);
                        groupedTotal.put(key, groupedTotal.getOrDefault(key, 0.0) + order.getTotal());
                        groupedCount.put(key, groupedCount.getOrDefault(key, 0) + 1);
                    }
                }

                // Count unique customers by year
                Map<String, java.util.Set<Long>> customersByYear = new java.util.HashMap<>();
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getUser() != null) {
                        String key = order.getOrderDate().format(formatter);
                        customersByYear.computeIfAbsent(key, k -> new java.util.HashSet<>()).add(order.getUser().getId());
                    }
                }
                // Convert to count
                for (Map.Entry<String, java.util.Set<Long>> entry : customersByYear.entrySet()) {
                    groupedCustomers.put(entry.getKey(), entry.getValue().size());
                }
                // Count unique active users by year
                for (int i = 0; i < 5; i++) {
                    LocalDateTime periodStart = now.minusYears(5 - i).withMonth(1).withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
                    LocalDateTime periodEnd = periodStart.plusYears(1);
                    String key = periodStart.format(formatter);
                    int uniqueUsers = userActivityService.countActiveUsers(periodStart, periodEnd);
                    activeUsersByPeriod.put(key, uniqueUsers);
                }
                break;
            case "week":
                formatter = DateTimeFormatter.ofPattern("YYYY-ww");
                // Group orders by week
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getTotal() != null) {
                        String key = order.getOrderDate().format(formatter);
                        groupedTotal.put(key, groupedTotal.getOrDefault(key, 0.0) + order.getTotal());
                        groupedCount.put(key, groupedCount.getOrDefault(key, 0) + 1);
                    }
                }

                // Count unique customers by week
                Map<String, java.util.Set<Long>> customersByWeek = new java.util.HashMap<>();
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getUser() != null) {
                        String key = order.getOrderDate().format(formatter);
                        customersByWeek.computeIfAbsent(key, k -> new java.util.HashSet<>()).add(order.getUser().getId());
                    }
                }
                // Convert to count
                for (Map.Entry<String, java.util.Set<Long>> entry : customersByWeek.entrySet()) {
                    groupedCustomers.put(entry.getKey(), entry.getValue().size());
                }
                // Count unique active users by week
                for (int i = 0; i < 52; i++) {
                    LocalDateTime periodStart = now.minusWeeks(52 - i).with(java.time.DayOfWeek.MONDAY).withHour(0).withMinute(0).withSecond(0);
                    LocalDateTime periodEnd = periodStart.plusWeeks(1);
                    String key = periodStart.format(formatter);
                    int uniqueUsers = userActivityService.countActiveUsers(periodStart, periodEnd);
                    activeUsersByPeriod.put(key, uniqueUsers);
                }
                break;
            case "day":
            default:
                formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

                // Generate all 30 days with zero values first
                for (int i = 0; i < 30; i++) {
                    LocalDateTime dayStart = now.minusDays(30 - i).withHour(0).withMinute(0).withSecond(0);
                    String key = dayStart.format(formatter);
                    groupedTotal.put(key, 0.0);
                    groupedCount.put(key, 0);
                    groupedCustomers.put(key, 0);
                }

                // Group orders by day
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getTotal() != null) {
                        String key = order.getOrderDate().format(formatter);
                        if (groupedTotal.containsKey(key)) {
                            groupedTotal.put(key, groupedTotal.get(key) + order.getTotal());
                            groupedCount.put(key, groupedCount.get(key) + 1);
                        }
                    }
                }

                // Count unique customers by day
                Map<String, java.util.Set<Long>> customersByDay = new java.util.HashMap<>();
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getUser() != null) {
                        String key = order.getOrderDate().format(formatter);
                        if (groupedTotal.containsKey(key)) {
                            customersByDay.computeIfAbsent(key, k -> new java.util.HashSet<>()).add(order.getUser().getId());
                        }
                    }
                }
                // Convert to count
                for (Map.Entry<String, java.util.Set<Long>> entry : customersByDay.entrySet()) {
                    groupedCustomers.put(entry.getKey(), entry.getValue().size());
                }
                // Count unique active users by day
                for (int i = 0; i < 30; i++) {
                    LocalDateTime periodStart = now.minusDays(30 - i).withHour(0).withMinute(0).withSecond(0);
                    LocalDateTime periodEnd = periodStart.plusDays(1);
                    String key = periodStart.format(formatter);
                    int uniqueUsers = userActivityService.countActiveUsers(periodStart, periodEnd);
                    activeUsersByPeriod.put(key, uniqueUsers);
                }
                break;
        }

        List<Map<String, Object>> result = groupedTotal.entrySet().stream()
            .map(e -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("label", e.getKey());
                map.put("total", e.getValue());
                map.put("orderCount", groupedCount.getOrDefault(e.getKey(), 0));
                map.put("customersCount", groupedCustomers.getOrDefault(e.getKey(), 0));
                map.put("activeUserCount", activeUsersByPeriod.getOrDefault(e.getKey(), 0));
                return map;
            })
            .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @LogActivity(actionType = "UPDATE", entityType = "ORDER", description = "Updated order status", severityLevel = "HIGH", entityIdParam = "orderId", logChanges = true)
    @PutMapping("/updatestatus/{orderId}")
    @RequiresPermission(value = ORDERS_UPDATE, level = "basic", description = "Update order status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, Object> request) {
        String status = (String) request.get("status");
        Long refundId = null;
        if (request.containsKey("refundId")) {
            Object refundIdObj = request.get("refundId");
            if (refundIdObj instanceof Number) {
                refundId = ((Number) refundIdObj).longValue();
            } else if (refundIdObj instanceof String) {
                try {
                    refundId = Long.parseLong((String) refundIdObj);
                } catch (NumberFormatException ignored) {}
            }
        }
        com.Ojt.Ecommerce.entity.UserOrder updatedOrder = service.updateOrderStatus(orderId, status, refundId);

        if (updatedOrder != null) {
            return ResponseEntity.ok(updatedOrder);
        } else {
            return ResponseEntity.badRequest().body("Invalid order ID or status.");
        }
    }

    @GetMapping("/getorderbyid/{orderId}")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<?> getOrderById(@PathVariable Long orderId) {
            UserOrderListDTO order = service.getOrderById(orderId);
            return ResponseEntity.ok(order);
    }

    // Test endpoint to check if user is first-time buyer
    @GetMapping("/test/firsttimebuyer/{userId}")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<?> testFirstTimeBuyer(@PathVariable Long userId) {
        boolean isFirstTime = service.isUserFirstTimeBuyer(userId);
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "isFirstTimeBuyer", isFirstTime
        ));
    }

    // Test endpoint to get user's discount status
    @GetMapping("/test/discountstatus/{userId}")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<?> testDiscountStatus(@PathVariable Long userId) {
        String status = service.getUserDiscountStatus(userId);
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "discountStatus", status
        ));
    }

    @GetMapping("/count")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<Integer> getOrderCount() {
        int count = service.getAllOrders().size();
        return ResponseEntity.ok(count);
    }

    @GetMapping("/active-users")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<Integer> getActiveUsers(@RequestParam(defaultValue = "day") String timeFrame) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start;
        switch (timeFrame) {
            case "hour": start = now.minusHours(1); break;
            case "week": start = now.minusWeeks(1); break;
            case "month": start = now.minusMonths(1); break;
            case "year": start = now.minusYears(1); break;
            case "day":
            default: start = now.minusDays(1); break;
        }
        int count = userActivityService.countActiveUsers(start, now);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/customers-count")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<Integer> getCustomersCount() {
        List<CustomerSummaryDTO> customers = userService.getAllCustomerSummaries();
        return ResponseEntity.ok(customers.size());
    }

    @GetMapping("/previous-metrics")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<Map<String, Object>> getPreviousMetrics(@RequestParam(defaultValue = "day") String timeFrame) {
        List<UserOrderListDTO> orders = service.getAllOrders();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start, end;
        switch (timeFrame) {
            case "hour":
                end = now.minusHours(1);
                start = end.minusHours(1);
                break;
            case "week":
                end = now.minusWeeks(1);
                start = end.minusWeeks(1);
                break;
            case "month":
                end = now.minusMonths(1);
                start = end.minusMonths(1);
                break;
            case "year":
                end = now.minusYears(1);
                start = end.minusYears(1);
                break;
            case "day":
            default:
                end = now.minusDays(1);
                start = end.minusDays(1);
                break;
        }
        // Filter orders in previous period
        List<UserOrderListDTO> prevOrders = orders.stream()
            .filter(o -> o.getOrderDate() != null && o.getOrderDate().isAfter(start) && o.getOrderDate().isBefore(end))
            .toList();
        double prevTotalSales = prevOrders.stream().mapToDouble(o -> {
            // You may need to sum product line items if not available directly
            return 0.0; // Placeholder, update with your logic
        }).sum();
        int prevOrderCount = prevOrders.size();
        double prevRevenue = prevTotalSales * 0.72;
        double prevAvgOrder = prevOrderCount > 0 ? prevTotalSales / prevOrderCount : 0;
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("totalSales", prevTotalSales);
        result.put("revenue", prevRevenue);
        result.put("orders", prevOrderCount);
        result.put("avgOrder", prevAvgOrder);
        return ResponseEntity.ok(result);
    }

    // Session and Bounce Rate endpoints
    @GetMapping("/session-count")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<Integer> getSessionCount(@RequestParam(defaultValue = "day") String timeFrame) {
        int count = sessionService.getTotalSessionsCount(timeFrame);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/active-sessions")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<Integer> getActiveSessions(@RequestParam(defaultValue = "day") String timeFrame) {
        int count = sessionService.getActiveSessionsCount(timeFrame);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/bounce-rate")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<Double> getBounceRate(@RequestParam(defaultValue = "day") String timeFrame) {
        double bounceRate = sessionService.getBounceRate(timeFrame);
        return ResponseEntity.ok(bounceRate);
    }

    @GetMapping("/session-stats")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<Map<String, Object>> getSessionStats(@RequestParam(defaultValue = "day") String timeFrame) {
        Map<String, Object> stats = sessionService.getSessionStats(timeFrame);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/session-trends")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<List<Map<String, Object>>> getSessionTrends(@RequestParam(defaultValue = "day") String timeFrame) {
        List<Map<String, Object>> trends = sessionService.getSessionTrends(timeFrame);
        return ResponseEntity.ok(trends);
    }

    // Engagement Analytics endpoints
    @GetMapping("/engagement-analytics")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<Map<String, Object>> getEngagementAnalytics(@RequestParam(defaultValue = "day") String timeFrame) {
        Map<String, Object> analytics = sessionService.getEngagementAnalytics(timeFrame);
        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/engagement-trends")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<List<Map<String, Object>>> getEngagementTrends(@RequestParam(defaultValue = "day") String timeFrame) {
        List<Map<String, Object>> trends = sessionService.getEngagementTrends(timeFrame);
        return ResponseEntity.ok(trends);
    }

    // Customer Segmentation endpoints
    @GetMapping("/customer-segmentation")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<List<Map<String, Object>>> getCustomerSegmentation(@RequestParam(defaultValue = "day") String timeFrame) {
        List<Map<String, Object>> segmentation = sessionService.getCustomerSegmentation(timeFrame);
        return ResponseEntity.ok(segmentation);
    }

    @GetMapping("/vip-tier-data")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<List<Map<String, Object>>> getVipTierData(@RequestParam(defaultValue = "day") String timeFrame) {
        List<Map<String, Object>> vipTierData = sessionService.getCustomerSegmentation(timeFrame);
        return ResponseEntity.ok(vipTierData);
    }

    @GetMapping("/customer-acquisition")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<List<Map<String, Object>>> getCustomerAcquisition(@RequestParam(defaultValue = "day") String timeFrame) {
        List<Map<String, Object>> acquisition = sessionService.getCustomerAcquisition(timeFrame);
        return ResponseEntity.ok(acquisition);
    }

    // Analytics endpoints for pie charts
    @GetMapping("/analytics/brand-sales")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<List<BrandSalesDTO>> getBrandSalesData(@RequestParam(defaultValue = "day") String timeFrame) {
        LocalDateTime startDate, endDate;
        LocalDateTime now = LocalDateTime.now();
        
        switch (timeFrame.toLowerCase()) {
            case "hour":
                endDate = now;
                startDate = now.minusHours(1);
                break;
            case "week":
                endDate = now;
                startDate = now.minusWeeks(1);
                break;
            case "month":
                endDate = now;
                startDate = now.minusMonths(1);
                break;
            case "year":
                endDate = now;
                startDate = now.minusYears(1);
                break;
            case "day":
            default:
                endDate = now;
                startDate = now.minusDays(1);
                break;
        }

        List<Object[]> results = service.getBrandSalesData(startDate, endDate);
        List<BrandSalesDTO> brandSales = new ArrayList<>();
        
        String[] colors = {"#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#6B7280", "#EF4444", "#06B6D4", "#84CC16"};
        int colorIndex = 0;
        
        for (Object[] result : results) {
            String name = (String) result[0];
            Long value = (Long) result[1];
            String color = colors[colorIndex % colors.length];
            
            brandSales.add(new BrandSalesDTO(name, value, color));
            colorIndex++;
        }
        
        return ResponseEntity.ok(brandSales);
    }

    @GetMapping("/analytics/category-sales")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<List<CategorySalesDTO>> getCategorySalesData(@RequestParam(defaultValue = "day") String timeFrame) {
        LocalDateTime startDate, endDate;
        LocalDateTime now = LocalDateTime.now();
        
        switch (timeFrame.toLowerCase()) {
            case "hour":
                endDate = now;
                startDate = now.minusHours(1);
                break;
            case "week":
                endDate = now;
                startDate = now.minusWeeks(1);
                break;
            case "month":
                endDate = now;
                startDate = now.minusMonths(1);
                break;
            case "year":
                endDate = now;
                startDate = now.minusYears(1);
                break;
            case "day":
            default:
                endDate = now;
                startDate = now.minusDays(1);
                break;
        }

        List<Object[]> results = service.getCategorySalesData(startDate, endDate);
        List<CategorySalesDTO> categorySales = new ArrayList<>();
        
        String[] colors = {"#EF4444", "#06B6D4", "#84CC16", "#F97316", "#EC4899", "#3B82F6", "#10B981", "#F59E0B"};
        int colorIndex = 0;
        
        for (Object[] result : results) {
            String name = (String) result[0];
            Long value = (Long) result[1];
            String color = colors[colorIndex % colors.length];
            
            categorySales.add(new CategorySalesDTO(name, value, color));
            colorIndex++;
        }
        
        return ResponseEntity.ok(categorySales);
    }

    @GetMapping("/analytics/product-sales")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<List<ProductSalesDTO>> getProductSalesData(@RequestParam(defaultValue = "day") String timeFrame) {
        LocalDateTime startDate, endDate;
        LocalDateTime now = LocalDateTime.now();
        
        switch (timeFrame.toLowerCase()) {
            case "hour":
                endDate = now;
                startDate = now.minusHours(1);
                break;
            case "week":
                endDate = now;
                startDate = now.minusWeeks(1);
                break;
            case "month":
                endDate = now;
                startDate = now.minusMonths(1);
                break;
            case "year":
                endDate = now;
                startDate = now.minusYears(1);
                break;
            case "day":
            default:
                endDate = now;
                startDate = now.minusDays(1);
                break;
        }

        List<Object[]> results = service.getProductSalesData(startDate, endDate);
        List<ProductSalesDTO> productSales = new ArrayList<>();
        
        String[] colors = {"#6366F1", "#059669", "#DC2626", "#7C3AED", "#9CA3AF", "#3B82F6", "#10B981", "#F59E0B"};
        int colorIndex = 0;
        
        for (Object[] result : results) {
            String name = (String) result[0];
            Long value = (Long) result[1];
            String color = colors[colorIndex % colors.length];
            
            productSales.add(new ProductSalesDTO(name, value, color));
            colorIndex++;
        }
        
        return ResponseEntity.ok(productSales);
    }

    @GetMapping("/analytics/delivery-services")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<List<DeliveryServiceDTO>> getDeliveryServiceData(@RequestParam(defaultValue = "day") String timeFrame) {
        LocalDateTime startDate, endDate;
        LocalDateTime now = LocalDateTime.now();
        
        switch (timeFrame.toLowerCase()) {
            case "hour":
                endDate = now;
                startDate = now.minusHours(1);
                break;
            case "week":
                endDate = now;
                startDate = now.minusWeeks(1);
                break;
            case "month":
                endDate = now;
                startDate = now.minusMonths(1);
                break;
            case "year":
                endDate = now;
                startDate = now.minusYears(1);
                break;
            case "day":
            default:
                endDate = now;
                startDate = now.minusDays(1);
                break;
        }

        List<Object[]> results = service.getDeliveryServiceData(startDate, endDate);
        List<DeliveryServiceDTO> deliveryServices = new ArrayList<>();
        
        String[] colors = {"#059669", "#3B82F6", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4", "#84CC16", "#EC4899"};
        int colorIndex = 0;
        
        for (Object[] result : results) {
            String name = (String) result[0];
            Long value = (Long) result[1];
            String color = colors[colorIndex % colors.length];

            deliveryServices.add(new DeliveryServiceDTO(
                    null,              // id
                    name,              // name
                    BigDecimal.ZERO,   // feePerKm
                    null,              // baseAddress
                    null,              // phoneNumber
                    value,             // value
                    color              // color
            ));

            colorIndex++;
        }
        
        return ResponseEntity.ok(deliveryServices);
    }

    // Debug endpoint to test basic data
    @GetMapping("/analytics/debug")
    public ResponseEntity<Map<String, Object>> debugData() {
        Map<String, Object> debugInfo = new HashMap<>();
        
        try {
            // Test basic order count
            long totalOrders = service.getTotalOrderCount();
            debugInfo.put("totalOrders", totalOrders);
            
            // Test delivered orders count
            long deliveredOrders = service.getDeliveredOrderCount();
            debugInfo.put("deliveredOrders", deliveredOrders);
            
            // Test brand count
            long brandCount = service.getBrandCount();
            debugInfo.put("brandCount", brandCount);
            
            debugInfo.put("status", "success");
            debugInfo.put("message", "Debug data retrieved successfully");
            
        } catch (Exception e) {
            debugInfo.put("status", "error");
            debugInfo.put("message", "Error: " + e.getMessage());
            debugInfo.put("exception", e.getClass().getSimpleName());
        }
        
        return ResponseEntity.ok(debugInfo);
    }
}
