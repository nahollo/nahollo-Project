package com.nahollo.homelab;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HomelabApplication {

	public static void main(String[] args) {
		SpringApplication.run(HomelabApplication.class, args);
	}

}
