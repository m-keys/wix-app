
export class DB {
  private db = new Map();

  // Access Code
  getAccessCode(): string {
    return this.db.get("accessCode");
  }

  setAccessCode(code: string) {
    this.db.set("accessCode", code);
  }

  // Access Token
  getAccessToken(): string {
    return this.db.get("accessToken");
  }

  setAccessToken(accessToken: string) {
    this.db.set("accessToken", accessToken);
  }

  // Refresh Token
  getRefreshToken(): string {
    return this.db.get("refreshToken");
  }

  setRefreshToken(refreshToken: string) {
    this.db.set("refreshToken", refreshToken);
  }

  // App Instance Id
  getAppInstanceId(): string {
    return this.db.get("instanceId");
  }

  setAppInstanceId(instanceId: string) {
    this.db.set("instanceId", instanceId);
  }
}