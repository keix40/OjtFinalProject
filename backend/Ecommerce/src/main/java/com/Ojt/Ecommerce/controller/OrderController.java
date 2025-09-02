package com.Ojt.Ecommerce.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
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
            default: start = now.minusDays(7); break; // Show last 7 days for day time frame
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

                // Generate all 7 days with zero values first
                for (int i = 0; i < 7; i++) {
                    LocalDateTime dayStart = now.minusDays(7 - i).withHour(0).withMinute(0).withSecond(0);
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
                for (int i = 0; i < 7; i++) {
                    LocalDateTime periodStart = now.minusDays(7 - i).withHour(0).withMinute(0).withSecond(0);
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
        
        // Debug logging for day time frame
        if (timeFrame.equals("day")) {
            System.out.println("📊 Day Time Frame Sales Trend Data:");
            System.out.println("  - Time Range: " + start + " to " + now);
            System.out.println("  - Total Days: " + result.size());
            System.out.println("  - Data Points: " + result.stream().mapToDouble(r -> (Double) r.get("total")).sum());
        }
        
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
        try {
            UserOrderListDTO updatedOrder = service.updateOrderStatus(orderId, status, refundId);
            return ResponseEntity.ok(updatedOrder);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", e.getMessage(),
                "timestamp", LocalDateTime.now().toString(),
                "status", 400
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "message", "Something went wrong: " + e.getMessage(),
                "timestamp", LocalDateTime.now().toString(),
                "status", 500
            ));
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
            default: start = now.withHour(0).withMinute(0).withSecond(0); break; // Current day only
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
                // For previous day, use the same logic as current day but shifted back by 1 day
                end = LocalDate.now().minusDays(1).atTime(23, 59, 59, 999999999);
                start = LocalDate.now().minusDays(1).atStartOfDay();
                break;
        }
        // Filter orders in previous period
        List<UserOrderListDTO> prevOrders = orders.stream()
            .filter(o -> o.getOrderDate() != null && o.getOrderDate().isAfter(start) && o.getOrderDate().isBefore(end))
            .toList();
        double prevTotalSales = prevOrders.stream().mapToDouble(o -> o.getTotal() != null ? o.getTotal() : 0).sum();
        int prevOrderCount = prevOrders.size();
        double prevRevenue = prevTotalSales * 0.72;
        double prevAvgOrder = prevOrderCount > 0 ? prevTotalSales / prevOrderCount : 0;
        
        // Calculate previous active users for the same period
        int prevActiveUsers = userActivityService.countActiveUsers(start, end);
        
        // Calculate previous customers (unique users who placed orders)
        int prevCustomers = (int) prevOrders.stream()
            .filter(o -> o.getUser() != null)
            .mapToLong(o -> o.getUser().getId())
            .distinct()
            .count();
        
        // Get previous session stats - calculate for the previous period
        int prevSessions = sessionService.getTotalSessionsCountForPeriod(start, end);
        double prevBounceRate = sessionService.getBounceRateForPeriod(start, end);

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("totalSales", prevTotalSales);
        result.put("revenue", prevRevenue);
        result.put("orders", prevOrderCount);
        result.put("avgOrder", prevAvgOrder);
        result.put("activeUsers", prevActiveUsers);
        result.put("customers", prevCustomers);
        result.put("sessions", prevSessions);
        result.put("bounceRate", prevBounceRate);
        
        // Debug logging
        System.out.println("🔍 Previous Metrics for " + timeFrame + ":");
        System.out.println("  - Period: " + start + " to " + end);
        System.out.println("  - Orders found: " + prevOrders.size());
        System.out.println("  - Total Sales: " + prevTotalSales);
        System.out.println("  - Revenue: " + prevRevenue);
        System.out.println("  - Active Users: " + prevActiveUsers);
        System.out.println("  - Customers: " + prevCustomers);
        
        return ResponseEntity.ok(result);
    }

    // Session and Bounce Rate endpoints
    @GetMapping("/session-count")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<Integer> getSessionCount(@RequestParam(defaultValue = "day") String timeFrame) {
        System.out.println("🎯 OrderController: getSessionCount called with timeFrame: " + timeFrame);
        int count = sessionService.getTotalSessionsCount(timeFrame);
        System.out.println("🎯 OrderController: Returning session count: " + count);
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
        System.out.println("🎯 OrderController: getBounceRate called with timeFrame: " + timeFrame);
        double bounceRate = sessionService.getBounceRate(timeFrame);
        System.out.println("🎯 OrderController: Returning bounce rate: " + bounceRate + "%");
        return ResponseEntity.ok(bounceRate);
    }

    @GetMapping("/session-stats")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<Map<String, Object>> getSessionStats(@RequestParam(defaultValue = "day") String timeFrame) {
        System.out.println("⭐ OrderController: getSessionStats called with timeFrame: " + timeFrame);
        Map<String, Object> stats = sessionService.getSessionStats(timeFrame);
        System.out.println("⭐ OrderController: Returning stats: " + stats);
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
        System.out.println("🎯 OrderController: getVipTierData called with timeFrame: " + timeFrame);
        System.out.println("🎯 OrderController: About to call sessionService.getCustomerSegmentation...");
        
        try {
            List<Map<String, Object>> vipTierData = sessionService.getCustomerSegmentation(timeFrame);
            System.out.println("📊 OrderController: VIP Tier Data returned: " + vipTierData.size() + " tiers");
            for (Map<String, Object> tier : vipTierData) {
                System.out.println("📊 OrderController: Tier - " + tier.get("name") + ": " + tier.get("value") + " users");
            }
            System.out.println("🎯 OrderController: Returning VIP tier data successfully");
            return ResponseEntity.ok(vipTierData);
        } catch (Exception e) {
            System.err.println("❌ OrderController: Error in getVipTierData: " + e.getMessage());
            e.printStackTrace();
            // Return empty list on error
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    @GetMapping("/customer-acquisition")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<List<Map<String, Object>>> getCustomerAcquisition(@RequestParam(defaultValue = "day") String timeFrame) {
        List<Map<String, Object>> acquisition = sessionService.getCustomerAcquisition(timeFrame);
        return ResponseEntity.ok(acquisition);
    }

    // New Users endpoints
    @GetMapping("/new-users-count")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<Integer> getNewUsersCount(@RequestParam(defaultValue = "day") String timeFrame) {
        int newUsersCount = userService.getNewUsersCount(timeFrame);
        return ResponseEntity.ok(newUsersCount);
    }

    @GetMapping("/new-users-trends")
    @RequiresPermission(value = ORDERS_VIEW, level = "basic")
    public ResponseEntity<List<Map<String, Object>>> getNewUsersTrends(@RequestParam(defaultValue = "day") String timeFrame) {
        List<Map<String, Object>> newUsersTrends = userService.getNewUsersTrends(timeFrame);
        return ResponseEntity.ok(newUsersTrends);
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
            
            // Test data for different time frames
            LocalDateTime now = LocalDateTime.now();
            Map<String, Object> timeFrameData = new HashMap<>();
            
            // Test hour
            LocalDateTime hourStart = now.minusHours(1);
            List<Object[]> hourBrandData = service.getBrandSalesData(hourStart, now);
            timeFrameData.put("hour", Map.of(
                "brandCount", hourBrandData.size(),
                "totalOrders", hourBrandData.stream().mapToLong(row -> (Long) row[1]).sum()
            ));
            
            // Test day
            LocalDateTime dayStart = now.minusDays(1);
            List<Object[]> dayBrandData = service.getBrandSalesData(dayStart, now);
            timeFrameData.put("day", Map.of(
                "brandCount", dayBrandData.size(),
                "totalOrders", dayBrandData.stream().mapToLong(row -> (Long) row[1]).sum()
            ));
            
            // Test month
            LocalDateTime monthStart = now.minusMonths(1);
            List<Object[]> monthBrandData = service.getBrandSalesData(monthStart, now);
            timeFrameData.put("month", Map.of(
                "brandCount", monthBrandData.size(),
                "totalOrders", monthBrandData.stream().mapToLong(row -> (Long) row[1]).sum()
            ));
            
            // Test year
            LocalDateTime yearStart = now.minusYears(1);
            List<Object[]> yearBrandData = service.getBrandSalesData(yearStart, now);
            timeFrameData.put("year", Map.of(
                "brandCount", yearBrandData.size(),
                "totalOrders", yearBrandData.stream().mapToLong(row -> (Long) row[1]).sum()
            ));
            
            debugInfo.put("timeFrameData", timeFrameData);
            
        } catch (Exception e) {
            debugInfo.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(debugInfo);
    }
    
    @GetMapping("/test/vip-tier")
    public ResponseEntity<Map<String, Object>> testVipTier() {
        System.out.println("🧪 Test: Testing VIP tier data endpoint");
        Map<String, Object> testResult = new HashMap<>();
        
        try {
            List<Map<String, Object>> vipTierData = sessionService.getCustomerSegmentation("day");
            testResult.put("success", true);
            testResult.put("tierCount", vipTierData.size());
            testResult.put("tiers", vipTierData);
            System.out.println("🧪 Test: VIP tier test successful - " + vipTierData.size() + " tiers");
        } catch (Exception e) {
            testResult.put("success", false);
            testResult.put("error", e.getMessage());
            System.err.println("🧪 Test: VIP tier test failed - " + e.getMessage());
            e.printStackTrace();
        }
        
        return ResponseEntity.ok(testResult);
    }
}
