package com.Ojt.Ecommerce.service;

import com.Ojt.Ecommerce.dto.UserOrderListDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardBroadcastService {
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    @Autowired
    @Lazy
    private OrderService orderService;
    @Autowired
    @Lazy
    private UserActivityService userActivityService;

    // Broadcasts the latest dashboard metrics to /topic/dashboard-metrics
    public void broadcastDashboardMetrics(String timeFrame) {
        List<UserOrderListDTO> orders = orderService.getAllOrders();
        Map<String, Double> groupedTotal = new LinkedHashMap<>();
        Map<String, Integer> groupedCount = new LinkedHashMap<>();
        Map<String, Integer> groupedCustomers = new LinkedHashMap<>();
        Map<String, Integer> activeUsersByPeriod = new LinkedHashMap<>();
        DateTimeFormatter formatter;
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
        switch (timeFrame) {
            case "hour":
                formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH");
                for (int i = 0; i < 24; i++) {
                    LocalDateTime hourStart = now.minusHours(23 - i).withMinute(0).withSecond(0).withNano(0);
                    String key = hourStart.format(formatter);
                    groupedTotal.put(key, 0.0);
                    groupedCount.put(key, 0);
                    groupedCustomers.put(key, 0);
                    activeUsersByPeriod.put(key, 0);
                }
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getTotal() != null) {
                        String key = order.getOrderDate().format(formatter);
                        if (groupedTotal.containsKey(key)) {
                            groupedTotal.put(key, groupedTotal.get(key) + order.getTotal());
                            groupedCount.put(key, groupedCount.get(key) + 1);
                        }
                    }
                }
                Map<String, Set<Long>> customersByHour = new HashMap<>();
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getUser() != null) {
                        String key = order.getOrderDate().format(formatter);
                        if (groupedTotal.containsKey(key)) {
                            customersByHour.computeIfAbsent(key, k -> new HashSet<>()).add(order.getUser().getId());
                        }
                    }
                }
                for (Map.Entry<String, Set<Long>> entry : customersByHour.entrySet()) {
                    groupedCustomers.put(entry.getKey(), entry.getValue().size());
                }
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
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getTotal() != null) {
                        String key = order.getOrderDate().format(formatter);
                        groupedTotal.put(key, groupedTotal.getOrDefault(key, 0.0) + order.getTotal());
                        groupedCount.put(key, groupedCount.getOrDefault(key, 0) + 1);
                    }
                }
                Map<String, Set<Long>> customersByMonth = new HashMap<>();
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getUser() != null) {
                        String key = order.getOrderDate().format(formatter);
                        customersByMonth.computeIfAbsent(key, k -> new HashSet<>()).add(order.getUser().getId());
                    }
                }
                for (Map.Entry<String, Set<Long>> entry : customersByMonth.entrySet()) {
                    groupedCustomers.put(entry.getKey(), entry.getValue().size());
                }
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
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getTotal() != null) {
                        String key = order.getOrderDate().format(formatter);
                        groupedTotal.put(key, groupedTotal.getOrDefault(key, 0.0) + order.getTotal());
                        groupedCount.put(key, groupedCount.getOrDefault(key, 0) + 1);
                    }
                }
                Map<String, Set<Long>> customersByYear = new HashMap<>();
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getUser() != null) {
                        String key = order.getOrderDate().format(formatter);
                        customersByYear.computeIfAbsent(key, k -> new HashSet<>()).add(order.getUser().getId());
                    }
                }
                for (Map.Entry<String, Set<Long>> entry : customersByYear.entrySet()) {
                    groupedCustomers.put(entry.getKey(), entry.getValue().size());
                }
                for (int i = 0; i < 5; i++) {
                    LocalDateTime periodStart = now.minusYears(5 - i).withDayOfYear(1).withHour(0).withMinute(0).withSecond(0);
                    LocalDateTime periodEnd = periodStart.plusYears(1);
                    String key = periodStart.format(formatter);
                    int uniqueUsers = userActivityService.countActiveUsers(periodStart, periodEnd);
                    activeUsersByPeriod.put(key, uniqueUsers);
                }
                break;
            case "week":
                formatter = DateTimeFormatter.ofPattern("yyyy-ww");
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getTotal() != null) {
                        String key = order.getOrderDate().format(formatter);
                        groupedTotal.put(key, groupedTotal.getOrDefault(key, 0.0) + order.getTotal());
                        groupedCount.put(key, groupedCount.getOrDefault(key, 0) + 1);
                    }
                }
                Map<String, Set<Long>> customersByWeek = new HashMap<>();
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getUser() != null) {
                        String key = order.getOrderDate().format(formatter);
                        customersByWeek.computeIfAbsent(key, k -> new HashSet<>()).add(order.getUser().getId());
                    }
                }
                for (Map.Entry<String, Set<Long>> entry : customersByWeek.entrySet()) {
                    groupedCustomers.put(entry.getKey(), entry.getValue().size());
                }
                for (int i = 0; i < 8; i++) {
                    LocalDateTime periodStart = now.minusWeeks(7 - i).withHour(0).withMinute(0).withSecond(0).withNano(0);
                    LocalDateTime periodEnd = periodStart.plusWeeks(1);
                    String key = periodStart.format(formatter);
                    int uniqueUsers = userActivityService.countActiveUsers(periodStart, periodEnd);
                    activeUsersByPeriod.put(key, uniqueUsers);
                }
                break;
            case "day":
            default:
                formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
                for (int i = 0; i < 30; i++) {
                    LocalDateTime dayStart = now.minusDays(29 - i).withHour(0).withMinute(0).withSecond(0).withNano(0);
                    String key = dayStart.format(formatter);
                    groupedTotal.put(key, 0.0);
                    groupedCount.put(key, 0);
                    groupedCustomers.put(key, 0);
                    activeUsersByPeriod.put(key, 0);
                }
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getTotal() != null) {
                        String key = order.getOrderDate().format(formatter);
                        if (groupedTotal.containsKey(key)) {
                            groupedTotal.put(key, groupedTotal.get(key) + order.getTotal());
                            groupedCount.put(key, groupedCount.get(key) + 1);
                        }
                    }
                }
                Map<String, Set<Long>> customersByDay = new HashMap<>();
                for (UserOrderListDTO order : orders) {
                    if (order.getOrderDate() != null && order.getUser() != null) {
                        String key = order.getOrderDate().format(formatter);
                        if (groupedTotal.containsKey(key)) {
                            customersByDay.computeIfAbsent(key, k -> new HashSet<>()).add(order.getUser().getId());
                        }
                    }
                }
                for (Map.Entry<String, Set<Long>> entry : customersByDay.entrySet()) {
                    groupedCustomers.put(entry.getKey(), entry.getValue().size());
                }
                for (int i = 0; i < 30; i++) {
                    LocalDateTime periodStart = now.minusDays(29 - i).withHour(0).withMinute(0).withSecond(0).withNano(0);
                    LocalDateTime periodEnd = periodStart.plusDays(1);
                    String key = periodStart.format(formatter);
                    int uniqueUsers = userActivityService.countActiveUsers(periodStart, periodEnd);
                    activeUsersByPeriod.put(key, uniqueUsers);
                }
                break;
        }
        List<Map<String, Object>> result = groupedTotal.entrySet().stream()
            .map(e -> {
                Map<String, Object> map = new HashMap<>();
                map.put("label", e.getKey());
                map.put("total", e.getValue());
                map.put("orderCount", groupedCount.getOrDefault(e.getKey(), 0));
                map.put("customersCount", groupedCustomers.getOrDefault(e.getKey(), 0));
                map.put("activeUserCount", activeUsersByPeriod.getOrDefault(e.getKey(), 0));
                return map;
            })
            .collect(Collectors.toList());
        messagingTemplate.convertAndSend("/topic/dashboard-metrics", result);
    }
} 