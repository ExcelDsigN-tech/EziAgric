/**
 * Trade Service
 */

import { appLogger } from "../middleware/logger";
import { sendSms } from "./smsService";

export interface DisputeParty {
  name: string;
  phone?: string | null;
}

export interface DisputedTrade {
  id: string;
  buyer: DisputeParty;
  seller: DisputeParty;
}

/**
 * SMS both parties when a dispute is opened. Delivery failures are logged,
 * never thrown, so they cannot block dispute creation.
 * Call after the dispute record is created.
 */
export async function notifyDisputeOpened(trade: DisputedTrade): Promise<void> {
  const link = `${process.env.APP_URL ?? ""}/trades/${trade.id}/dispute`;
  const parties: Array<[DisputeParty, DisputeParty]> = [
    [trade.buyer, trade.seller],
    [trade.seller, trade.buyer],
  ];

  await Promise.all(
    parties.map(async ([recipient, other]) => {
      if (!recipient.phone) return;
      const message = `Trade ${trade.id}: ${other.name} has opened a dispute. Respond promptly to avoid a default ruling: ${link}`;
      try {
        await sendSms(recipient.phone, message);
      } catch (err) {
        appLogger.error("Dispute-opened SMS failed", {
          tradeId: trade.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }),
  );
}
