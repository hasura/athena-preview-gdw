package org.acme;

import org.springframework.stereotype.Component;

@Component
public class GreetingService {

    public String greeting(String name) {
        return "Hello, " + name + "!";
    }
}
