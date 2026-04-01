package com.info.shems;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@org.springframework.scheduling.annotation.EnableScheduling
@SpringBootApplication
public class SmartHomeEnergyManagementSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(SmartHomeEnergyManagementSystemApplication.class, args);
	}

}
