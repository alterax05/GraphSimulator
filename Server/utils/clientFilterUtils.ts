class ClientFilterUtils {
  static isValidId(id: string): boolean {
    // id must start with A, B or C and must be followed by a number between 0 and 25
    const idPattern =
      /^[ABC]([0-9]|1[0-9]|2[0-5])$|inspector[0-9][0-9][0-9][0-9]$/;

    return idPattern.test(id);
  }
}

export default ClientFilterUtils;
