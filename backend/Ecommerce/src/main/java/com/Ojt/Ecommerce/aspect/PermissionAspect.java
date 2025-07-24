package com.Ojt.Ecommerce.aspect;

import com.Ojt.Ecommerce.annotations.RequiresPermission;
import com.Ojt.Ecommerce.service.AuthService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class PermissionAspect {
    @Autowired
    private AuthService authService;

    @Around("@annotation(requiresPermission)")
    public Object checkPermission(ProceedingJoinPoint joinPoint, RequiresPermission requiresPermission) throws Throwable {
        String requiredKey = requiresPermission.value();
        if (!authService.currentUserHasPermission(requiredKey)) {
            throw new AccessDeniedException("Missing permission: " + requiredKey);
        }
        return joinPoint.proceed();
    }
} 