package com.Ojt.Ecommerce.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * GlobalExceptionHandler only (no MockMvc): when a matched handler invokes type conversion,
 * invalid Long values become HTTP 400. Dispatcher path matching is covered by
 * {@link com.Ojt.Ecommerce.guard.RemediatedNumericIdRoutingWebMvcTest}.
 */
class GlobalExceptionHandlerNumericIdTest {

  private GlobalExceptionHandler handler;

  @BeforeEach
  void setUp() {
    handler = new GlobalExceptionHandler();
  }

  @Test
  void longPathVariableTypeMismatch_returns400WithNumericMessage() {
    MethodArgumentTypeMismatchException ex =
        new MethodArgumentTypeMismatchException(
            "recent",
            Long.class,
            "id",
            null,
            new IllegalArgumentException("For input string: \"recent\""));

    ResponseEntity<?> response = handler.handleMethodArgumentTypeMismatch(ex);

    assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    @SuppressWarnings("unchecked")
    Map<String, Object> body = (Map<String, Object>) response.getBody();
    assertEquals(400, body.get("status"));
    assertEquals("Invalid id: must be numeric", body.get("message"));
    assertTrue(body.containsKey("timestamp"));
  }

  @Test
  void numberFormatException_returns400WithNumericMessage() {
    ResponseEntity<?> response = handler.handleNumberFormatException(new NumberFormatException("abc"));

    assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    @SuppressWarnings("unchecked")
    Map<String, Object> body = (Map<String, Object>) response.getBody();
    assertEquals("Invalid id: must be numeric", body.get("message"));
  }
}