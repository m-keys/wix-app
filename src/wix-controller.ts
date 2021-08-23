import express from "express";
import axios from "axios";
import debug from "debug";
import { DB } from "./db";

const log: debug.IDebugger = debug("app:wix-controller");
const AUTH_PROVIDER_BASE_URL = 'https://www.wix.com/oauth';
const INSTANCE_API_URL = "https://www.wixapis.com/apps/v1";
// Other Endpoints
// const STORE_CATALOG_API_URL = 'https://www.wixapis.com/stores/v1';
// const STORE_ORDERS_API_URL = 'https://www.wixapis.com/stores/v2';
// const PAYMENTS_API_URL = 'https://cashier.wix.com/_api/payment-services-web/merchant/v2';

const db = new DB();

async function getAccessTokenFromWix(authCode: string) {
  try {
    log("Requesting Access and Refresh Tokens");
    const { APP_SECRET, APP_ID } = process.env;
    const res = await axios.post(`${AUTH_PROVIDER_BASE_URL}/access`, {
      code: authCode,
      client_secret: APP_SECRET,
      client_id: APP_ID,
      grant_type: "authorization_code",
    });
    return res.data;
  } catch (err) {
    log("Error when calling for access token ", { err });
  }
}

async function refreshTokens(appId: string, refreshToken: string) {
  try {
    const { APP_SECRET } = process.env;
    const { data } = await axios.post(`${AUTH_PROVIDER_BASE_URL}/access`, {
      refresh_token: refreshToken,
      client_secret: APP_SECRET,
      client_id: appId,
      grant_type: "refresh_token",
    });
    if (!data || !data["refresh_token"] || !data["access_token"]) {
      log("Error when getting refresh and access tokens");
      return;
    }
    return data;
  } catch (err) {
    log("Error when calling for refresh token: ", { err });
  }
}

async function getAppInstance() {
  try {
    const accessToken = db.getAccessToken();
    log("Getting App Instance");

    const body = {
      // *** PUT YOUR PARAMS HERE ***
      //query: {limit: 10},
    };
    const appInstance = axios.create({
      baseURL: INSTANCE_API_URL,
      headers: { authorization: accessToken }
    });
    const { data } = await appInstance.get("instance", body);
    return data;
  } catch (e) {
    log("Error getting App Instance");
    log({ e });
  }
};

export function configureRoutes(app: express.Application) {
  // Signup 
  app.get("/signup", (req, res) => {
    const { APP_ID } = process.env;
    const permissionRequestUrl = "https://www.wix.com/app-oauth-installation/consent";
    const redirectUrl = `https://${req.get("host")}/login`;
    const token = req.query.token;
    const url = `${permissionRequestUrl}?token=${token}&appId=${APP_ID}&redirectUrl=${redirectUrl}`;

    log(`Redirect to: ${url}`);
    res.redirect(url);
  });

  // Login
  app.get("/login", async (req, res) => {
    const authorizationCode = String(req.query.code);
    log(`Authorization Code: ${authorizationCode}`);
    db.setAccessCode(authorizationCode);

    try {
      const { refresh_token, access_token } = await getAccessTokenFromWix(authorizationCode);

      if (!refresh_token || !access_token) {
        res.status(403).send({});
      }

      log(`refreshToken = ${refresh_token}`);
      log(`accessToken = ${access_token}`);

      db.setAccessToken(access_token);
      db.setRefreshToken(refresh_token);

      const instance = await getAppInstance();
      log("=============================");
      log("Wix App Instance", instance);
      log("=============================");
      db.setAppInstanceId(instance?.instance?.instanceId);

      const data = {
        authorizationCode,
        ...instance,
      }

      res.send({ data });
    } catch (wixError) {
      console.log("Error getting token from Wix");
      console.log({ wixError });
      res.status(500);
      return;
    }
  });

  // Get Access Token with Refresh Token
  app.get("/access-token", async (req, res) => {
    const appId = String(req.query.appId ?? "");
    const refreshToken = String(req.query.refreshToken ?? "");
    // Validate params
    if (!appId || !refreshToken) {
      const message = "appId and refreshToken are required";
      log(message);
      res.status(400).send({ message });
      return;
    }
    try {
      const data = await refreshTokens(appId, refreshToken);
      db.setRefreshToken(data["refresh_token"]);
      res.send({ data });
    } catch (err) {
      log({ err });
    }
  });
}