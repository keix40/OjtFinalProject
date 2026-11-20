package com.Ojt.Ecommerce.guard;

import com.Ojt.Ecommerce.controller.ActivityLogController;
import com.Ojt.Ecommerce.controller.DeliveryServiceController;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.List;

import static org.junit.jupiter.api.Assertions.fail;

/**
 * CI guard on Spring-registered patterns for endpoints fixed in PRs #29 and #37/#38.
 */
class RemediatedNumericIdMappingGuardTest {

    @Test
    void remediatedControllers_registerDigitConstrainedLongIdPaths() throws Exception {
        RequestMappingHandlerMapping mapping = MvcGuardTestContext.remediatedControllersMapping();

        List<NumericIdPathMappingInspector.Violation> delivery =
                NumericIdPathMappingInspector.inspectController(DeliveryServiceController.class, mapping);
        List<NumericIdPathMappingInspector.Violation> activity =
                NumericIdPathMappingInspector.inspectController(ActivityLogController.class, mapping);

        if (!delivery.isEmpty() || !activity.isEmpty()) {
            fail(
                    "Remediated numeric id mapping guard failed:\n"
                            + format("DeliveryServiceController", delivery)
                            + format("ActivityLogController", activity));
        }
    }

    private static String format(String label, List<NumericIdPathMappingInspector.Violation> violations) {
        if (violations.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder(label).append(":\n");
        for (NumericIdPathMappingInspector.Violation v : violations) {
            sb.append("  - ")
                    .append(v.httpMethods())
                    .append(" ")
                    .append(v.pattern())
                    .append(" (")
                    .append(v.pathVariable())
                    .append("): ")
                    .append(v.detail())
                    .append('\n');
        }
        return sb.toString();
    }
}