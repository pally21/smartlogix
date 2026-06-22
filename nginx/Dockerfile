FROM openresty/openresty:alpine

# Instala luarocks y librerías necesarias
RUN apk add --no-cache build-base openssl-dev libffi-dev git luarocks ca-certificates && \
    luarocks install lua-resty-jwt

# Copia configuración y scripts Lua
COPY nginx.conf /usr/local/openresty/nginx/conf/nginx.conf
COPY lua /usr/local/openresty/lualib/
COPY certs /etc/nginx/certs

EXPOSE 80 443

CMD ["/usr/local/openresty/bin/openresty", "-g", "daemon off;"]
