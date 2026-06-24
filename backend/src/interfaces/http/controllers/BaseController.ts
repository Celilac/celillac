// backend/src/interfaces/http/controllers/BaseController.ts
export abstract class BaseController {
  protected abstract executeImpl(): Promise<void | any>;
  
  public async execute(req: any, res: any): Promise<void> {
    try {
      await this.executeImpl();
    } catch (err) {
      console.log(`[BaseController]: Uncaught controller error`);
      console.log(err);
    }
  }
}
