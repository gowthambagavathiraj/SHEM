package com.info.shems.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping(value = { "/", "/{x:[\\w\\-]+}", "/{x:^(?!api$).*$}/*/{y:[\\w\\-]+}" })
    public String redirect() {
        return "forward:/index.html";
    }
}
