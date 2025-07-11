package com.Ojt.Ecommerce.controller;

import com.Ojt.Ecommerce.dto.DiscountDTO;
import com.Ojt.Ecommerce.dto.UserOrderDTO;
import com.Ojt.Ecommerce.dto.UserOrderListDTO;
import com.Ojt.Ecommerce.entity.DeliveryMethod;
import com.Ojt.Ecommerce.entity.UserOrder;
import com.Ojt.Ecommerce.service.DeliveryService;
import com.Ojt.Ecommerce.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/order")
public class OrderController {
    @Autowired
    private OrderService service;

    @Autowired
    private DeliveryService deliveryService;

    //delivery method
    @GetMapping("/getdelimethod")
    public List<DeliveryMethod> getAllDeliveryMethod(){
        return deliveryService.findAllDelivery();
    }

    //discount
    @GetMapping("/getdiscount/{userId}/{code}")
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

    @PostMapping("/create")
    public ResponseEntity<?> createOrder(@RequestBody UserOrderDTO dto){
        UserOrder order = service.createOrder(dto);
        if (order == null) {
            return ResponseEntity.badRequest().body("fail");
        }
        else {
            return ResponseEntity.ok("success");
        }
    }

    //add for discount  preview by pmk july 9
    @PostMapping("/preview")
    public ResponseEntity<?> previewOrder(@RequestBody UserOrderDTO dto) {
        return ResponseEntity.ok(service.previewOrder(dto));
    }

    @GetMapping("/getorderbyuserid/{userId}")
    public ResponseEntity<List<UserOrderListDTO>> getOrdersByUserId(@PathVariable Long userId) {
        List<UserOrderListDTO> orders = service.getOrdersByUserId(userId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/getallorder")
    public ResponseEntity<List<UserOrderListDTO>> getAllOrder(){
        List<UserOrderListDTO> orders = service.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    @PutMapping("/updatestatus/{orderId}")
    public ResponseEntity<String> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> request) {
        String status = request.get("status");
        boolean updated = service.updateOrderStatus(orderId, status);

        if (updated) {
            return ResponseEntity.ok("Order status updated successfully.");
        } else {
            return ResponseEntity.badRequest().body("Invalid order ID or status.");
        }
    }

    @GetMapping("/getorderbyid/{orderId}")
    public ResponseEntity<?> getOrderById(@PathVariable Long orderId) {
            UserOrderListDTO order = service.getOrderById(orderId);
            return ResponseEntity.ok(order);
    }

    // Test endpoint to check if user is first-time buyer
    @GetMapping("/test/firsttimebuyer/{userId}")
    public ResponseEntity<?> testFirstTimeBuyer(@PathVariable Long userId) {
        boolean isFirstTime = service.isUserFirstTimeBuyer(userId);
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "isFirstTimeBuyer", isFirstTime
        ));
    }

    // Test endpoint to get user's discount status
    @GetMapping("/test/discountstatus/{userId}")
    public ResponseEntity<?> testDiscountStatus(@PathVariable Long userId) {
        String status = service.getUserDiscountStatus(userId);
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "discountStatus", status
        ));
    }
}
