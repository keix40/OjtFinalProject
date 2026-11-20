package com.Ojt.Ecommerce.guard;

import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Isolated scratch: pre-#37 delivery used bare {@code /{id}} (no literal sibling required).
 */
class DeliveryNumericIdRegressionScratchTest {

    @RestController
    @RequestMapping("/scratch/delivery")
    static class PreFixDeliveryScratchController {
        @GetMapping("/{id}")
        Long byId(@PathVariable("id") Long id) {
            return id;
        }
    }

    @Test
    void preFixBareDeliveryId_isDetectedByHandlerMappingInspector() throws Exception {
        PreFixDeliveryScratchController controller = new PreFixDeliveryScratchController();
        RequestMappingHandlerMapping mapping = MvcGuardTestContext.mappingForController(controller);

        List<NumericIdPathMappingInspector.Violation> violations =
                NumericIdPathMappingInspector.inspectController(
                        PreFixDeliveryScratchController.class, mapping);

        assertFalse(violations.isEmpty(), "bare /{id} Long mapping must be flagged");
        assertTrue(
                violations.stream().anyMatch(v -> "id".equals(v.pathVariable())),
                () -> "violations: " + violations);
    }
}