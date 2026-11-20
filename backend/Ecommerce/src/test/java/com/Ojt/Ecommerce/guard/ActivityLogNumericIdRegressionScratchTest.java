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
 * Isolated scratch: pre-#29 activity log paired literal {@code /recent} with bare {@code /{id}}.
 *
 * <p>Spring does not guarantee that a literal segment wins over an unconstrained {@code {id}}
 * pattern; the production failure was dispatch/conversion on the catch-all id route.
 */
class ActivityLogNumericIdRegressionScratchTest {

    @RestController
    @RequestMapping("/scratch/activity-logs")
    static class PreFixActivityLogScratchController {
        @GetMapping("/recent")
        void recent() {}

        @GetMapping("/{id}")
        void byId(@PathVariable("id") Long id) {}
    }

    @Test
    void preFixActivityLogBareId_isDetectedByHandlerMappingInspector() throws Exception {
        PreFixActivityLogScratchController controller = new PreFixActivityLogScratchController();
        RequestMappingHandlerMapping mapping = MvcGuardTestContext.mappingForController(controller);

        List<NumericIdPathMappingInspector.Violation> violations =
                NumericIdPathMappingInspector.inspectController(
                        PreFixActivityLogScratchController.class, mapping);

        assertFalse(violations.isEmpty());
        assertTrue(violations.stream().anyMatch(v -> v.pattern().endsWith("/{id}")));
    }
}