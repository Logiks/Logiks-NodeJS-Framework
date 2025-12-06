/*
 * All Security Logic (Express-compatible)
 */

const sha1 = require("sha1");
const { UnauthorizedError } = require("./errors");

if (CONFIG.IPWHITELISTING == null) CONFIG.IPWHITELISTING = {};

module.exports = function (server) {
  server.use(async function (req, res, next) {
    try {
      if (req.method === "OPTIONS") return next();

      const currentPath = req.path;
      const pathVar = currentPath.split("/");

      // No-auth paths
      if (
        CONFIG.NOAUTH.includes(currentPath) ||
        CONFIG.NOAUTH.includes("/" + pathVar[1])
      ) {
        return next();
      }

      // IP whitelist checks
      const remoteIP = MISC.getClientIP(req);
      req.CLIENTIP = remoteIP;

      const pathGroup = currentPath.split("/").slice(0, 3).join("/");

      function ipAllowed(list) {
        return list && (list.includes("*") || list.includes(remoteIP));
      }

      if (ipAllowed(CONFIG.IPWHITELISTING[currentPath])) return next();
      if (ipAllowed(CONFIG.IPWHITELISTING[pathGroup])) return next();
      if (ipAllowed(CONFIG.IPWHITELISTING["/" + pathVar[1]])) return next();

      // Authorization header
      const authorization = req.header("authorization");
      const authKey = authorization.split(" ")[1];
      let appID = req.header("appid");
      let sessKey = req.header("sesskey");

      if (!authorization || !authKey) {
        return next(new UnauthorizedError("Authorization Header Missing"));
      }

      if (!sessKey) {
        sessKey = sha1((authorization || "") + (appID || "") + new moment());
      }

      // Fetch auth info
      AUTHKEY.fetchAuthInfo(authKey, async function (authInfo) {
        if (!authInfo) {
          return next(new UnauthorizedError("Authorization Key Invalid"));
        }

        if (authInfo.guid === "global") {
          authInfo.jwt_token_required = "true";
        }

        // Checksum verification
        if (authInfo.checksum_check === "true") {
          const hashkey = req.header("hashkey");
          const computed = sha1(
            authInfo.auth_secret + JSON.stringify(req.body)
          );

          if (hashkey !== computed) {
            return next(
              new UnauthorizedError("Authorization Failed: Checksum Mismatch")
            );
          }
        }

        // JWT logic
        if (authInfo.jwt_token_required === "true") {
          const jwtToken = req.header("auth-token");
          if (!jwtToken) {
            return next(
              new UnauthorizedError("Authorization Failed: JWT Token Missing")
            );
          }

          try {
            sessKey = sha1(CONFIG.AUTHJWT.secret + jwtToken);

            const userSessData = await _CACHE.fetchDataSync(
              "USERDATA." + sessKey
            );

            if (!userSessData) {
              return next(
                new UnauthorizedError(
                  "Authorization Failed: Session Invalid or Expired"
                )
              );
            }

            authInfo.guid = userSessData.guid;
            authInfo.userid = userSessData.uuid;
            authInfo.privilege = userSessData.privilege || "user";
            authInfo.role = userSessData.role || "user";

            appID = userSessData.appid;
          } catch (err) {
            logger.error("JWT ERROR", err);
            return next(
              new UnauthorizedError("Authorization Failed: Invalid JWT")
            );
          }
        }

        // IP whitelist inside authInfo
        if (authInfo.ipwhitelists && authInfo.ipwhitelists.length > 1) {
          const allowedIPs = authInfo.ipwhitelists.split(",");
          if (!allowedIPs.includes(remoteIP)) {
            return next(
              new UnauthorizedError(
                "Authorization Failed: IP Whitelist Restriction"
              )
            );
          }
        }

        // Scope validation
        if (authInfo.scope && authInfo.scope.length > 0) {
          try {
            authInfo.scope = JSON.parse(authInfo.scope);
            if (!authInfo.scope.APPS) authInfo.scope.APPS = [appID];
          } catch (err) {
            return next(
              new UnauthorizedError(
                "Authorization Failed: Invalid Scope Format"
              )
            );
          }
        } else {
          return next(
            new UnauthorizedError(
              "Authorization Failed: Invalid Scope Setup (2)"
            )
          );
        }

        if (!authInfo.scope.APPS.includes(appID)) {
          return next(
            new UnauthorizedError("Authorization Failed: App Scope Restriction")
          );
        }

        if (authInfo.scope.ROUTES && authInfo.scope.ROUTES.length > 0) {
          if (
            !(
              authInfo.scope.ROUTES.includes(currentPath) ||
              authInfo.scope.ROUTES.includes("/" + pathVar[1])
            )
          ) {
            return next(
              new UnauthorizedError(
                "Authorization Failed: Route Scope Restriction"
              )
            );
          }
        }

        // Save values into Express request object
        req.GUID = authInfo.guid;
        req.APPID = appID;
        req.SESSKEY = sessKey;
        req.USERID = authInfo.userid;
        req.PRIVILEGE = (authInfo.privilege || "user").toLowerCase();
        req.ROLE = (authInfo.role || "user").toLowerCase();
        req.APIUSER = true;
        req.ENV = authInfo.environment?.toUpperCase() || "PROD";
        req.REQ_POLICY = authInfo.policy;
        req.REQ_SCOPE = authInfo.scope;
        req.AUTH_EXPIRY = authInfo.expiry;
        req.AUTH_THRESHOLD = authInfo.threshold;

        HOOKS.runHook("security", { req });

        return next();
      });
    } catch (err) {
      console.error("Security Middleware Error:", err);
      return res.status(500).json({ error: "Security Middleware Failure" });
    }
  });
};
