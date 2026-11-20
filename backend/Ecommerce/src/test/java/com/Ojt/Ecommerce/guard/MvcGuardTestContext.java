package com.Ojt.Ecommerce.guard;

import org.springframework.mock.web.MockServletContext;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.context.support.StaticWebApplicationContext;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import com.Ojt.Ecommerce.controller.ActivityLogController;
import com.Ojt.Ecommerce.controller.DeliveryServiceController;
import com.Ojt.Ecommerce.service.ActivityLogService;
import com.Ojt.Ecommerce.service.DeliveryService;

import static org.mockito.Mockito.mock;

/**
 * Builds {@link RequestMappingHandlerMapping} metadata without a full Boot context or database.
 */
public final class MvcGuardTestContext {

    private MvcGuardTestContext() {}

    public static RequestMappingHandlerMapping remediatedControllersMapping() throws Exception {
        DeliveryServiceController delivery = new DeliveryServiceController(mock(DeliveryService.class));
        ActivityLogController activity = new ActivityLogController();
        ReflectionTestUtils.setField(activity, "activityLogService", mock(ActivityLogService.class));
        return mappingForControllers(delivery, activity);
    }

    public static RequestMappingHandlerMapping mappingForController(Object controller) throws Exception {
        return mappingForControllers(controller);
    }

    private static RequestMappingHandlerMapping mappingForControllers(Object... controllers) throws Exception {
        StaticWebApplicationContext context = new StaticWebApplicationContext();
        context.setServletContext(new MockServletContext());
        for (int i = 0; i < controllers.length; i++) {
            context.getBeanFactory().registerSingleton("controller" + i, controllers[i]);
        }
        context.refresh();

        RequestMappingHandlerMapping mapping = new RequestMappingHandlerMapping();
        mapping.setApplicationContext(context);
        mapping.afterPropertiesSet();
        return mapping;
    }
}