package org.acme;

import org.eclipse.microprofile.graphql.Description;
import org.eclipse.microprofile.graphql.GraphQLApi;
import org.eclipse.microprofile.graphql.Query;
import org.springframework.beans.factory.annotation.Autowired;

@GraphQLApi
public class GraphQLGreetingController {

    @Autowired
    private GreetingService greetingService;


    @Query("sayHello")
    @Description("Greets a person by saying hello to them")
    public String sayHello(String name) {
        return greetingService.greeting(name);
    }
}
