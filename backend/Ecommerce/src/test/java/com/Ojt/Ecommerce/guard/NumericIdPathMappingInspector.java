package com.Ojt.Ecommerce.guard;

import org.springframework.core.MethodParameter;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Uses Spring MVC registered path patterns (not source parsing) to ensure numeric
 * {@code @PathVariable Long id} segments declare a digit regex ({@code \\d+} or {@code [0-9]+}).
 */
public final class NumericIdPathMappingInspector {

    private static final String GUARDED_SEGMENT = "id";

    private static final Pattern BARE_VARIABLE = Pattern.compile("\\{([a-zA-Z_][a-zA-Z0-9_]*)\\}");
    private static final Pattern CONSTRAINED_VARIABLE =
            Pattern.compile("\\{([a-zA-Z_][a-zA-Z0-9_]*):([^}]+)\\}");

    private NumericIdPathMappingInspector() {}

    public record Violation(String httpMethods, String pattern, String pathVariable, String detail) {}

    public static List<Violation> inspectController(
            Class<?> controllerType, RequestMappingHandlerMapping handlerMapping) {
        List<Violation> violations = new ArrayList<>();
        for (Map.Entry<RequestMappingInfo, HandlerMethod> entry :
                handlerMapping.getHandlerMethods().entrySet()) {
            HandlerMethod handlerMethod = entry.getValue();
            if (!controllerType.equals(handlerMethod.getBeanType())) {
                continue;
            }
            Set<String> patterns = patternsFor(entry.getKey());
            Set<String> methods = httpMethods(entry.getKey());
            String methodsLabel = methods.isEmpty() ? "REQUEST" : String.join(",", methods);
            if (!hasGuardedNumericIdParameter(handlerMethod)) {
                continue;
            }
            List<String> names = guardedIdParameterNames(handlerMethod);
            if (names.isEmpty()) {
                for (String pattern : patterns) {
                    if (patternContainsVariable(pattern, GUARDED_SEGMENT)
                            && !variableHasDigitConstraint(pattern, GUARDED_SEGMENT)) {
                        violations.add(violation(methodsLabel, pattern, GUARDED_SEGMENT));
                    }
                }
                continue;
            }
            for (String name : names) {
                for (String pattern : patterns) {
                    if (!patternContainsVariable(pattern, name)) {
                        continue;
                    }
                    if (!variableHasDigitConstraint(pattern, name)) {
                        violations.add(violation(methodsLabel, pattern, name));
                    }
                }
            }
        }
        return violations;
    }

    private static Violation violation(String methodsLabel, String pattern, String name) {
        return new Violation(
                methodsLabel,
                pattern,
                name,
                "numeric @PathVariable requires {"
                        + name
                        + ":\\\\d+} or {"
                        + name
                        + ":[0-9]+} in registered pattern");
    }

    private static boolean hasGuardedNumericIdParameter(HandlerMethod handlerMethod) {
        return !guardedIdParameterNames(handlerMethod).isEmpty()
                || hasUnnamedNumericIdPathVariable(handlerMethod);
    }

    private static boolean hasUnnamedNumericIdPathVariable(HandlerMethod handlerMethod) {
        Method method = handlerMethod.getMethod();
        for (int i = 0; i < method.getParameterCount(); i++) {
            MethodParameter parameter = new MethodParameter(method, i);
            if (!parameter.hasParameterAnnotation(PathVariable.class)) {
                continue;
            }
            if (!isNumericPathType(parameter.getParameterType())) {
                continue;
            }
            PathVariable pathVariable = parameter.getParameterAnnotation(PathVariable.class);
            String name = resolvePathVariableName(pathVariable, parameter);
            if (name == null || name.isEmpty()) {
                return true;
            }
            if (GUARDED_SEGMENT.equalsIgnoreCase(name)) {
                return true;
            }
        }
        return false;
    }

    private static List<String> guardedIdParameterNames(HandlerMethod handlerMethod) {
        List<String> names = new ArrayList<>();
        Method method = handlerMethod.getMethod();
        for (int i = 0; i < method.getParameterCount(); i++) {
            MethodParameter parameter = new MethodParameter(method, i);
            if (!parameter.hasParameterAnnotation(PathVariable.class)) {
                continue;
            }
            if (!isNumericPathType(parameter.getParameterType())) {
                continue;
            }
            PathVariable pathVariable = parameter.getParameterAnnotation(PathVariable.class);
            String name = resolvePathVariableName(pathVariable, parameter);
            if (GUARDED_SEGMENT.equalsIgnoreCase(name)) {
                names.add(GUARDED_SEGMENT);
            }
        }
        return names;
    }

    private static String resolvePathVariableName(PathVariable pathVariable, MethodParameter parameter) {
        String name = pathVariable.name();
        if (name == null || name.isEmpty()) {
            name = pathVariable.value();
        }
        if (name == null || name.isEmpty()) {
            name = parameter.getParameterName();
        }
        return name;
    }

    static boolean variableHasDigitConstraint(String pattern, String varName) {
        if (pattern == null) {
            return false;
        }
        Matcher bare = BARE_VARIABLE.matcher(pattern);
        while (bare.find()) {
            if (varName.equals(bare.group(1))) {
                return false;
            }
        }
        Matcher constrained = CONSTRAINED_VARIABLE.matcher(pattern);
        while (constrained.find()) {
            if (!varName.equals(constrained.group(1))) {
                continue;
            }
            String regex = constrained.group(2);
            if (regex.contains("\\d") || regex.contains("[0-9]")) {
                return true;
            }
        }
        return false;
    }

    private static boolean patternContainsVariable(String pattern, String varName) {
        return pattern.contains("{" + varName + "}") || pattern.contains("{" + varName + ":");
    }

    private static boolean isNumericPathType(Class<?> type) {
        if (type == long.class || type == int.class || type == short.class) {
            return true;
        }
        return Number.class.isAssignableFrom(type);
    }

    private static Set<String> patternsFor(RequestMappingInfo info) {
        if (info.getPathPatternsCondition() != null) {
            return info.getPathPatternsCondition().getPatternValues();
        }
        if (info.getPatternsCondition() != null) {
            return info.getPatternsCondition().getPatterns();
        }
        return Set.of();
    }

    private static Set<String> httpMethods(RequestMappingInfo info) {
        if (info.getMethodsCondition() == null) {
            return Set.of();
        }
        return info.getMethodsCondition().getMethods().stream()
                .map(Enum::name)
                .collect(java.util.stream.Collectors.toSet());
    }
}