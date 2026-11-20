package com.Ojt.Ecommerce.guard;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Detects Spring MVC mappings where a bare {@code /{id}} (or similar) can steal
 * requests meant for literal paths such as {@code /recent}, which previously
 * caused HTTP 500s on Activity Log and Delivery Service routes.
 */
public final class NumericIdPathConstraint {

    private static final Pattern MAPPING =
            Pattern.compile("@(?:Get|Put|Post|Delete|Patch)Mapping\\(\\s*(?:value\\s*=\\s*)?\"([^\"]+)\"");

    /** Single-segment Long capture, e.g. "/{id}" but not "/user/{userId}". */
    private static final Pattern SINGLE_SEGMENT_ID =
            Pattern.compile("^/\\{(\\w+)\\}$");

    private NumericIdPathConstraint() {}

    public static boolean pathConstrainsNumericId(String mappingPath) {
        if (mappingPath == null) {
            return false;
        }
        Matcher single = SINGLE_SEGMENT_ID.matcher(mappingPath);
        if (!single.matches()) {
            return true;
        }
        return mappingPath.contains("\\d+") || mappingPath.contains("[0-9]+");
    }

    public static boolean hasLiteralTopLevelSegment(String mappingPath) {
        if (mappingPath == null || mappingPath.isBlank() || "/".equals(mappingPath)) {
            return false;
        }
        if (mappingPath.startsWith("/{")) {
            return false;
        }
        return !mappingPath.contains("{");
    }

    public static List<String> findViolations(String controllerSource) {
        List<String> paths = extractMappingPaths(controllerSource);
        boolean hasLiteralSibling = paths.stream().anyMatch(NumericIdPathConstraint::hasLiteralTopLevelSegment);
        if (!hasLiteralSibling) {
            return List.of();
        }
        List<String> violations = new ArrayList<>();
        for (String path : paths) {
            if (!pathConstrainsNumericId(path) && SINGLE_SEGMENT_ID.matcher(path).matches()) {
                violations.add(path);
            }
        }
        return violations;
    }

    static List<String> extractMappingPaths(String source) {
        List<String> paths = new ArrayList<>();
        Matcher matcher = MAPPING.matcher(source);
        while (matcher.find()) {
            paths.add(matcher.group(1));
        }
        return paths;
    }
}