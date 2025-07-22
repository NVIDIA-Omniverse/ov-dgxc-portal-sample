

export class HttpError extends Error {
  public constructor(message: string, public status: number) {
    super(message);
  }
}