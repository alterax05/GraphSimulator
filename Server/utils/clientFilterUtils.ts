import { IncomingMessage } from "http";

class ClientFilterUtils {
  static isValidId(id: string): boolean {
    // id must start with A, B or C and must be followed by a number between 0 and 25
    const idPattern =
      /^[ABC]([0-9]|1[0-9]|2[0-9]|3[0-2])$|inspector[0-9][0-9][0-9][0-9]$/;

    return idPattern.test(id);
  }
  
  static getIpRequest(req: IncomingMessage): string {
    let ip: string;
    if (req.headers["x-forwarded-for"]) {
      if(typeof req.headers["x-forwarded-for"] === "string")
        ip = req.headers["x-forwarded-for"].split(",")[0];
      else
        ip = req.headers["x-forwarded-for"][0];
    } else {
      ip = req.socket.remoteAddress || "";
    }
    return ip;
  }
}

export default ClientFilterUtils;
