'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/atoms';
import { MessageIcon } from '@/icons';
import { startOrderConversation } from '@/lib/data/messages';

type OrderMessageButtonsProps = {
  sellerId?: string | null;
  orderId: string;
  buttonClassNames?: string;
};

/**
 * Order-scoped conversation entry points: message the seller about this
 * order, or open the shared marketplace support thread with the order as
 * context. Both open the messages page with the thread selected.
 */
export const OrderMessageButtons = ({
  sellerId,
  orderId,
  buttonClassNames,
}: OrderMessageButtonsProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const open = (mode: 'seller' | 'support') => {
    if (isPending) return;
    setError(null);

    startTransition(async () => {
      const res = await startOrderConversation({
        mode,
        sellerId: mode === 'seller' ? sellerId : null,
      });

      if (res.success && res.conversationId) {
        router.push(
          `/user/messages?c=${res.conversationId}&order=${orderId}`
        );
        return;
      }

      setError(res.message || 'Unable to start the conversation.');
    });
  };

  return (
    <div
      className="flex flex-col items-end gap-2"
      data-testid="order-message-buttons"
    >
      <div className="flex items-center gap-3">
        {sellerId && (
          <Button
            variant="tonal"
            size="small"
            disabled={isPending}
            onClick={() => open('seller')}
            className={buttonClassNames}
            data-testid="contact-seller-button"
          >
            <span className="flex items-center gap-2">
              <MessageIcon size={16} />
              Contact seller
            </span>
          </Button>
        )}
        <Button
          variant="text"
          size="small"
          disabled={isPending}
          onClick={() => open('support')}
          className={buttonClassNames}
          data-testid="contact-support-button"
        >
          <span className="flex items-center gap-2">
            <MessageIcon size={16} />
            Contact support
          </span>
        </Button>
      </div>
      {error && (
        <p className="label-sm text-negative" data-testid="contact-error">
          {error}
        </p>
      )}
    </div>
  );
};
