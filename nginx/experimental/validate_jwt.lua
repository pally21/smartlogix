local jwt = require "resty.jwt"
local cjson = require "cjson"

local function respond(code, body)
  ngx.status = code
  ngx.header.content_type = 'application/json'
  ngx.say(cjson.encode(body))
  return ngx.exit(code)
end

-- If JWT_MANDATORY is set to '1', enforce validation strictly.
-- Otherwise (default for dev), allow requests without Authorization and inject a dev payload.
local mandatory = os.getenv('JWT_MANDATORY') == '1'
local auth_header = ngx.var.http_authorization or ''

if auth_header == '' then
  if not mandatory then
    -- Dev mode: inject a lightweight dev payload so downstream services see a user
    ngx.req.set_header('X-Auth-Payload', cjson.encode({ sub = 'dev', role = 'dev' }))
    return
  end
  return respond(401, { error = 'No token provided' })
end

local _, _, token = string.find(auth_header, "Bearer%s+(.+)")
if not token then
  if not mandatory then
    ngx.req.set_header('X-Auth-Payload', cjson.encode({ sub = 'dev', role = 'dev' }))
    return
  end
  return respond(401, { error = 'No token provided' })
end

local secret = os.getenv('JWT_SECRET') or 'dev_secret_for_tests_only'
local jwt_obj = jwt:verify(secret, token)
if not jwt_obj.verified then
  if not mandatory then
    ngx.req.set_header('X-Auth-Payload', cjson.encode({ sub = 'dev', role = 'dev' }))
    return
  end
  if jwt_obj.reason == 'expired' then
    return respond(401, { error = 'TOKEN_EXPIRED' })
  end
  return respond(401, { error = 'TOKEN_INVALID' })
end

-- Attach decoded payload to header for BFF to consume (as JSON)
ngx.req.set_header('X-Auth-Payload', cjson.encode(jwt_obj.payload))

-- allow request to continue
return
