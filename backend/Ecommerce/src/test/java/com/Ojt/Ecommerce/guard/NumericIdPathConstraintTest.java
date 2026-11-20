package com.Ojt.Ecommerce.guard;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NumericIdPathConstraintTest {

  private static final String PRE_FIX_ACTIVITY_LOG_SNIPPET =
      """
          @RestController
          class Example {
              @GetMapping("/recent")
              void recent() {}

              @GetMapping("/{id}")
              void byId(Long id) {}
          }
          """;

  @Test
  void preFixActivityLogPattern_isDetectedAsViolation() {
    var violations = NumericIdPathConstraint.findViolations(PRE_FIX_ACTIVITY_LOG_SNIPPET);
    assertEquals(1, violations.size());
    assertEquals("/{id}", violations.get(0));
  }

  @Test
  void numericConstrainedIdPath_isAllowed() {
    String fixed =
        """
            @GetMapping("/recent")
            void recent() {}
            @GetMapping("/{id:\\\\d+}")
            void byId(Long id) {}
            """;
    assertTrue(NumericIdPathConstraint.findViolations(fixed).isEmpty());
  }

  @Test
  void bracketNumericConstraint_isAllowed() {
    assertTrue(NumericIdPathConstraint.pathConstrainsNumericId("/{id:[0-9]+}"));
  }

  @Test
  void nestedPathSegments_areNotSubjectToSiblingRule() {
    String source =
        """
            @GetMapping("/user/{userId}")
            void byUser() {}
            @GetMapping("/recent")
            void recent() {}
            """;
    assertTrue(NumericIdPathConstraint.findViolations(source).isEmpty());
  }

  @Test
  void remediatedControllers_haveNoViolations() throws Exception {
    Path controllerDir =
        Path.of("src/main/java/com/Ojt/Ecommerce/controller");
    assertTrue(Files.isDirectory(controllerDir));

    Path activityLog = controllerDir.resolve("ActivityLogController.java");
    Path delivery = controllerDir.resolve("DeliveryServiceController.java");

    assertTrue(
        NumericIdPathConstraint.findViolations(Files.readString(activityLog)).isEmpty(),
        "ActivityLogController must keep digit-only /{id} paths");
    assertTrue(
        NumericIdPathConstraint.findViolations(Files.readString(delivery)).isEmpty(),
        "DeliveryServiceController must keep digit-only id paths");
  }

  @Test
  void unconstrainedIdWithoutLiteralSibling_isNotFlagged() {
    String onlyId =
        """
            @GetMapping("/{id}")
            void byId() {}
            """;
    assertFalse(NumericIdPathConstraint.hasLiteralTopLevelSegment("/{id}"));
    assertTrue(NumericIdPathConstraint.findViolations(onlyId).isEmpty());
  }
}