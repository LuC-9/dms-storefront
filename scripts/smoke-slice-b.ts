import { computeOrderTotals, generateOrderNumber, parseOrderAddress, snapshotAddress } from "@/lib/orders";
import { selectPaymentProvider } from "@/lib/payments/select";
import {
  applyTransitionTimestamps,
  assertTransition,
  canTransition,
  OrderStateError,
} from "@/lib/state-machine";

function run() {
  const generated = generateOrderNumber();
  const totals = computeOrderTotals({
    items: [
      { quantity: 2, unitPriceInPaise: 1599 },
      { quantity: 1, unitPriceInPaise: 999 },
    ],
    shippingInPaise: 100,
    taxInPaise: 0,
  });

  const snapshot = snapshotAddress({
    label: "Home",
    fullName: "Demo User",
    phone: "9876543210",
    line1: "Street 1",
    line2: null,
    city: "Coimbatore",
    state: "Tamil Nadu",
    pincode: "641001",
  });
  const parsed = parseOrderAddress({
    shippingAddressJson: JSON.stringify(snapshot),
  });

  const transitions = {
    pendingToConfirmed: canTransition("PENDING", "CONFIRMED"),
    shippedToCancelled: canTransition("SHIPPED", "CANCELLED"),
  };

  let customerCancelDenied = false;
  try {
    assertTransition("CONFIRMED", "CANCELLED", "customer");
  } catch (error) {
    customerCancelDenied = error instanceof OrderStateError;
  }

  const pendingCancelStamp = applyTransitionTimestamps({ status: "PENDING" }, "CANCELLED");

  console.log("smoke.sliceB.orderNumber", generated);
  console.log("smoke.sliceB.totals", totals);
  console.log("smoke.sliceB.address.city", parsed.city);
  console.log("smoke.sliceB.transitions", transitions);
  console.log("smoke.sliceB.customerCancelDenied", customerCancelDenied);
  console.log("smoke.sliceB.cancelledTimestampSet", Boolean(pendingCancelStamp.cancelledAt));
  console.log("smoke.sliceB.provider", selectPaymentProvider());
}

run();
