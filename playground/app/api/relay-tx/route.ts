import { NextResponse } from "next/server";
import { keccak256, toHex, verifyMessage, type Address, type Hex } from "viem";

export const runtime = "nodejs";

interface RelayRequestBody {
  sessionSigner: Address;
  payload: Record<string, unknown>;
  signature: Hex;
}

export async function POST(request: Request) {
  let body: RelayRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const { sessionSigner, payload, signature } = body;
  if (!sessionSigner || !payload || !signature) {
    return NextResponse.json(
      { message: "Missing sessionSigner, payload, or signature." },
      { status: 400 }
    );
  }

  const message = JSON.stringify(payload);
  const isValid = await verifyMessage({ address: sessionSigner, message, signature }).catch(
    () => false
  );
  if (!isValid) {
    return NextResponse.json({ message: "Signature verification failed." }, { status: 401 });
  }

  // Real on-chain broadcast (using SPONSOR_PRIVATE_KEY / VALIDATOR_ADDRESS) is a
  // deliberate follow-up, not wired here — see PLAYGROUND_PLAN.md §8 scope boundaries.
  // The signature check above is genuine either way; only the broadcast is simulated.
  const txHash = keccak256(toHex(`${sessionSigner}:${signature}:${Date.now()}`));

  return NextResponse.json({
    success: true,
    txHash,
    sponsored: true,
    simulated: true,
  });
}
