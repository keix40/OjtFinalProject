package com.Ojt.Ecommerce.guard;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

/**
 * CI guard for controllers where non-numeric {@code /{id}} collisions caused production
 * 500s (activity logs #29 and delivery service #37/#38).
 */
class RestControllerNumericIdGuardTest {

  private static final List<String> REMEDIATED_CONTROLLERS =
      List.of("ActivityLogController.java", "DeliveryServiceController.java");

  @Test
  void remediatedControllers_keepNumericIdPathConstraints() throws IOException {
    Path controllerDir =
        Path.of("src/main/java/com/Ojt/Ecommerce/controller").toAbsolutePath().normalize();
    List<String> failures = new java.util.ArrayList<>();

    for (String name : REMEDIATED_CONTROLLERS) {
      Path file = controllerDir.resolve(name);
      if (!Files.isRegularFile(file)) {
        fail("Expected controller missing: " + name);
      }
      String source = Files.readString(file);
      List<String> violations = NumericIdPathConstraint.findViolations(source);
      if (!violations.isEmpty()) {
        failures.add(name + " unconstrained id paths: " + violations);
      }
    }

    if (!failures.isEmpty()) {
      fail(
          "Numeric id path guard failed (see commits d5f606a7, e98d8b65):\n"
              + String.join("\n", failures));
    }
    assertTrue(true);
  }
}