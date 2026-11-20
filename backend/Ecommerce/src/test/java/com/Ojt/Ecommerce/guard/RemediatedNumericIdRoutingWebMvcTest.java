package com.Ojt.Ecommerce.guard;

import com.Ojt.Ecommerce.controller.ActivityLogController;
import com.Ojt.Ecommerce.controller.DeliveryServiceController;
import com.Ojt.Ecommerce.exception.GlobalExceptionHandler;
import com.Ojt.Ecommerce.service.DeliveryService;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerExecutionChain;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Dispatcher routing checks. {@link com.Ojt.Ecommerce.exception.GlobalExceptionHandlerNumericIdTest}
 * only calls the advice directly; these tests use handler mappings and/or MockMvc.
 */
class RemediatedNumericIdRoutingWebMvcTest {

    @Nested
    class DeliveryConstrainedDispatcherMatching {
        @Test
        void nonNumericSegment_hasNoHandlerMatch() throws Exception {
            DeliveryServiceController controller = new DeliveryServiceController(mock(DeliveryService.class));
            RequestMappingHandlerMapping mapping = MvcGuardTestContext.mappingForController(controller);

            assertNull(handlerForGet(mapping, "/deliveryservice/not-numeric"));
        }

        @Test
        void numericSegment_resolvesGetByIdHandler() throws Exception {
            DeliveryServiceController controller = new DeliveryServiceController(mock(DeliveryService.class));
            RequestMappingHandlerMapping mapping = MvcGuardTestContext.mappingForController(controller);

            HandlerExecutionChain chain = handlerForGet(mapping, "/deliveryservice/42");
            assertNotNull(chain);
            assertNotNull(chain.getHandler());
        }
    }

    @Nested
    class ActivityLogConstrainedDispatcherMatching {
        @Test
        void recentLiteral_resolvesRecentHandler_notGetById() throws Exception {
            ActivityLogController controller = new ActivityLogController();
            ReflectionTestUtils.setField(controller, "activityLogService", mock(com.Ojt.Ecommerce.service.ActivityLogService.class));
            RequestMappingHandlerMapping mapping = MvcGuardTestContext.mappingForController(controller);

            HandlerExecutionChain chain = handlerForGet(mapping, "/api/activity-logs/recent");
            assertNotNull(chain);
            HandlerMethod handlerMethod = (HandlerMethod) chain.getHandler();
            assertEquals("getRecentActivityLogs", handlerMethod.getMethod().getName());
        }
    }

    @Nested
    class DeliveryScratchRoutingContrast {
        @Test
        void bareIdPattern_acceptsAlphabeticSegment_conversionHandledAs400() throws Exception {
            DeliveryNumericIdRegressionScratchTest.PreFixDeliveryScratchController controller =
                    new DeliveryNumericIdRegressionScratchTest.PreFixDeliveryScratchController();
            MockMvc mockMvc =
                    MockMvcBuilders.standaloneSetup(controller)
                            .setControllerAdvice(new GlobalExceptionHandler())
                            .build();

            mockMvc.perform(get("/scratch/delivery/abc")).andExpect(status().isBadRequest());
        }

        @Test
        void bareIdPattern_resolvesHandlerForAlphabeticSegment() throws Exception {
            DeliveryNumericIdRegressionScratchTest.PreFixDeliveryScratchController controller =
                    new DeliveryNumericIdRegressionScratchTest.PreFixDeliveryScratchController();
            RequestMappingHandlerMapping mapping = MvcGuardTestContext.mappingForController(controller);

            assertNotNull(handlerForGet(mapping, "/scratch/delivery/abc"));
        }
    }

    private static HandlerExecutionChain handlerForGet(
            RequestMappingHandlerMapping mapping, String path) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
        request.setServletPath(path);
        return mapping.getHandler(request);
    }
}