---
title: "Javascript Framework With Spring Backend"
date: 2019-12-22T01:20:59+01:00
toc: false
tags:
 - javascript
categories:
 - spring
description: Running a javascript application alongside your spring boot backend can be bit of a conendrum. Here are
    several ways to tackle this problem
draft: true
---

Assumptions:

- Your backend serve the API (REST, graphQL)
- You build your javascript with a separate bundler (parcel, webpack)
- Your frontend uses a push state (HTML 5 history) router
- You want hot module reload (HMR) for the best developer experience

# 1. Embed javascript into backend

Requirements:

Run your bundler in watch mode `parcel -watch index.html --out backend/src/main/resources/static` and

```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {
	override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
		registry.addResourceHandler("/**")
            // In production
//			.addResourceLocations("classpath:/static/")
            // For proper HMR, otherwise we would have to manually re-trigger the process resources phase of gradle 
			.addResourceLocations("file:./embedded/src/main/resources/static/")
			.setCacheControl(CacheControl.noCache())
	}
}

```

Where it gets complicated is when you have to handle the router.

Basically you have to redirect every requests asking for an html request that `Accept`  to `index.html` while the rest normally
redirects to the static resources.

```kotlin
val acceptsHtmlOnly: RequestPredicate = RequestPredicate { request ->
	request.headers().accept().contains(MediaType.TEXT_HTML) &&
		!request.headers().accept().contains(MediaType.ALL)
}

@Configuration
class RouterConfig {
  @Bean
  fun indexRoutes(@Value("classpath:/static/index.html") indexHtml: Resource) = router {
    (GET("*") and acceptsHtmlOnly) {
      ServerResponse.ok().contentType(MediaType.TEXT_HTML).bodyValue(indexHtml)
    }
  }
}
```

code:
backend/src/main/java/react/config/SinglePageAppConfig.java

If you want proper hmr, you also gave to 

![](/assets/images/articles/2019-12-22-javascript-framework-with-spring-backend/hmr-errors.png)


2 processes

Pros:
- Simple to distribute
- No CORS 

Cons:
- A lot of code to handle routing
- Clunky hot reloading and resource reloading
- Cannot scale the backend and the frontend independently

# 2. Javascript proxy



```javascript
const Bundler = require('parcel');
const express = require('express');
const proxy = require('http-proxy-middleware');
const history = require('connect-history-api-fallback');

const bundler = new Bundler('src/index.html');
const app = express();

app.use(history());
app.use(proxy('/api', {target: 'http://localhost:8080', changeOrigin: true}));

app.use(bundler.middleware());

app.listen(3000, 'localhost', (err) => {
    if (err) {
        console.log(err);
        return;
    }

    console.log('Listening at http://localhost:3000');
});
```

2 processes

Pros:
- No CORS

Cons:
- Not a production solution (needs to be )

# 3. Reverse proxy

```yaml
version: "3"
services:
  nginx:
    image: nginx:latest
    container_name: brginx
    volumes:
      - ./server.conf:/etc/nginx/conf.d/default.conf
      - ../frontend/dist:/usr/share/nginx/html
    ports:
      - 8081:8081
```

```
server {
    listen       8081;
    server_name  localhost;

    location /api {
        proxy_pass   http://host.docker.internal:8080;
    }

    location / {
        root /usr/share/nginx/html;
        set $fallback_file /index.html;
        if ($http_accept !~ text/html) {
            set $fallback_file /null;
        }
        try_files $uri $fallback_file;
    }
}
```

Pros:
- Close to a production environment
- Flexible
- Scales

Cons:
- 3 processes

# 4. CORS

```kotlin
@Bean
fun corsConfigurationSource(corsProperties: CorsProperties): CorsConfigurationSource {
    val configuration = CorsConfiguration().apply {
      allowedOrigins = "http://localhost:1234" // <- your frotend dev server
      allowedMethods = listOf("*")
      allowedHeaders = listOf("*")
      allowCredentials = true
    }
    val source = UrlBasedCorsConfigurationSource()
    source.registerCorsConfiguration("/api/**", configuration)
    return source
}
```

Pros:
- Close to a production environment
- Simple enough

Cons:
- CORS?

Sources:
- 
