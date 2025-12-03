export class BaseMessageDTO {

  message: string | { key: string; args?: Record<string, any> };

}
