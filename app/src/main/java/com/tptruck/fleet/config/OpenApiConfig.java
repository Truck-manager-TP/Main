package com.tptruck.fleet.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI truckFleetOpenApi() {
        return new OpenAPI().info(new Info()
                .title("TP-Truck Fleet & Logistics API")
                .version("1.0.0")
                .description("Fleet/Expense, Route Tracking, Driver Management and Marketing modules.")
                .license(new License().name("Proprietary").url("https://truck-manager-tp.example")));
    }
}
