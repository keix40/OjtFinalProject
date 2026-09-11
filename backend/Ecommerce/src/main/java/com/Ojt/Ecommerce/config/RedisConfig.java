package com.Ojt.Ecommerce.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

@Configuration
@ConditionalOnProperty(name = "app.redis.enabled", havingValue = "true")
public class RedisConfig {

    @Bean
    public LettuceConnectionFactory redisConnectionFactory(
            org.springframework.core.env.Environment env) {
        String url = env.getProperty("REDIS_URL", env.getProperty("spring.data.redis.url", ""));
        if (url != null && url.startsWith("redis://")) {
            // redis://[:password@]host:port[/db]
            String withoutScheme = url.substring("redis://".length());
            String host = "localhost";
            int port = 6379;
            String password = null;
            if (withoutScheme.contains("@")) {
                String[] authHost = withoutScheme.split("@", 2);
                password = authHost[0].isEmpty() ? null : authHost[0];
                withoutScheme = authHost[1];
            }
            if (withoutScheme.contains(":")) {
                String[] hostPort = withoutScheme.split(":", 2);
                host = hostPort[0];
                port = Integer.parseInt(hostPort[1].split("/")[0]);
            } else {
                host = withoutScheme.split("/")[0];
            }
            RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(host, port);
            if (password != null) {
                config.setPassword(password);
            }
            return new LettuceConnectionFactory(config);
        }
        String host = env.getProperty("spring.data.redis.host", "localhost");
        int port = Integer.parseInt(env.getProperty("spring.data.redis.port", "6379"));
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(host, port);
        String password = env.getProperty("spring.data.redis.password");
        if (password != null && !password.isBlank()) {
            config.setPassword(password);
        }
        return new LettuceConnectionFactory(config);
    }

    @Bean
    public StringRedisTemplate stringRedisTemplate(LettuceConnectionFactory factory) {
        return new StringRedisTemplate(factory);
    }
}
