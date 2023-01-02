import { MessageModel, MessagePermissions, MessageReadReceiptModel } from '@tenlastic/mongoose';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const credentials = { ...ctx.state };
  const message = await MessagePermissions.findOne(
    credentials,
    { where: { _id: ctx.params._id } },
    {},
  );
  if (!message) {
    throw new RecordNotFoundError('Message');
  }

  const readReceipt = new MessageReadReceiptModel({
    createdAt: new Date(),
    userId: ctx.state.user._id,
  });
  const result = await MessageModel.findOneAndUpdate(
    { _id: ctx.params._id },
    [
      {
        $set: {
          readReceipts: {
            $concatArrays: [
              '$readReceipts',
              {
                $cond: {
                  if: {
                    $anyElementTrue: {
                      $map: {
                        input: '$readReceipts',
                        as: 'readReceipt',
                        in: { $eq: ['$$readReceipt.userId', readReceipt.userId] },
                      },
                    },
                  },
                  then: [],
                  else: [readReceipt],
                },
              },
            ],
          },
        },
      },
    ],
    { new: true },
  );
  const record = await MessagePermissions.read(credentials, result);

  ctx.response.body = { record };
}
