// backend/src/interfaces/http/controllers/consumer/ToggleConsumerStatusController.ts
import { Request, Response } from 'express';
import { ToggleConsumerStatusUseCase } from '../../../../application/consumer/ToggleConsumerStatusUseCase';

export class ToggleConsumerStatusController {
  constructor(private readonly toggleStatusUseCase: ToggleConsumerStatusUseCase) {}

  async execute(req: Request, res: Response): Promise<Response> {
    try {
      const requestedByUserId = (req as any).user?.sub;
      if (!requestedByUserId) {
        return res.status(401).json({ error: 'Não autorizado.' });
      }

      const { targetUserId, action, reason } = req.body;
      const target = targetUserId || requestedByUserId;

      if (!action || !['ACTIVATE', 'DEACTIVATE'].includes(action)) {
        return res.status(400).json({ error: 'Ação inválida. Use ACTIVATE ou DEACTIVATE.' });
      }

      const result = await this.toggleStatusUseCase.execute({
        targetUserId: target,
        requestedByUserId,
        action,
        reason,
      });

      if (result.isFailure) {
        return res.status(400).json({ error: result.getError() });
      }

      const consumer = result.getValue();
      return res.status(200).json({
        id: consumer.id,
        userId: consumer.userId,
        status: consumer.status,
        statusChangedAt: consumer.statusChangedAt,
        statusChangedBy: consumer.statusChangedBy,
        statusChangeReason: consumer.statusChangeReason,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao alterar status do consumidor.' });
    }
  }
}
