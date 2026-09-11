package com.Ojt.Ecommerce;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/** Full context load requires MySQL schema; unit tests cover security/order paths. */
@SpringBootTest
@ActiveProfiles("test")
@Disabled("Integration context load — run manually against MySQL; CI uses focused unit tests")
class EcommerceApplicationTests {

	@Test
	void contextLoads() {
	}

}
