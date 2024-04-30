import { IncomingMessage } from "http";

class ClientFilterUtils {
  /**
   * Checks if the provided ID is valid using a regular expression.
   *
   * The ID must start with A, B, or C followed by a number between 0 and 32.
   *
   * @param id - The ID to validate.
   * @returns `true` if the ID is valid, `false` otherwise.
   */
  static isValidId(id: string): boolean {
    const idPattern =
      /^[ABC]([0-9]|1[0-9]|2[0-9]|3[0-2])$|inspector[0-9][0-9][0-9][0-9]$/;

    return idPattern.test(id);
  }

  /**
   * Retrieves the IP address from the request object or the x-forwarded-for header.
   * @param req - The incoming request object.
   * @returns The IP address as a string or an empty string if not found.
   */
  static getIpRequest(req: IncomingMessage): string {
    let ip: string;
    // check if x-forwarded-for exists in the headers (provided by nginx)
    if (req.headers["x-forwarded-for"]) {
      if (typeof req.headers["x-forwarded-for"] === "string")
        ip = req.headers["x-forwarded-for"].split(",")[0];
      else ip = req.headers["x-forwarded-for"][0];
    } else {
      ip = req.socket.remoteAddress || "";
    }
    return ip;
  }
}

export default ClientFilterUtils;
