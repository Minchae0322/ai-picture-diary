package com.jellydiary;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class JellyDiaryApplication {
    public static void main(String[] args) {
        SpringApplication.run(JellyDiaryApplication.class, args);
    }
}
