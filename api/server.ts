import express from "express";
import { createWalletClient, http, verifyMessage } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

const app = express();
app.use(express.json());

// Relayer'ın kendi cüzdanı (Gaz parasını ödeyecek olan backend hesabı)
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY as `0x${string}`;
const relayerAccount = privateKeyToAccount(RELAYER_PRIVATE_KEY);

const relayerClient = createWalletClient({
  account: relayerAccount,
  chain: sepolia,
  transport: http("https://rpc.sepolia.org")
});

app.post("/api/relay-tx", async (req, res) => {
  try {
    const { sessionSigner, payload, signature } = req.body;

    // 1. İmzayı doğrula: Mesajı gerçekten o oturum anahtarı mı imzaladı?
    const isValidSignature = await verifyMessage({
      address: sessionSigner,
      message: JSON.stringify(payload),
      signature
    });

    if (!isValidSignature) {
      return res.status(401).json({ error: "Geçersiz oturum imzası!" });
    }

    console.log(`İmza doğrulandı. İşlem zincire basılıyor: Kullanıcı harcaması: ${payload.spendAmount}`);

    // 2. İşlemi zincire gönder (Gaz ücretini relayerAccount karşılar)
    // Gerçek senaryoda burada doğrudan hedef sözleşmeyi veya Paymaster'ı çağırırsınız:
    /*
    const hash = await relayerClient.writeContract({
      address: "0xGameEngineContract",
      abi: [...],
      functionName: "executePlayerAction",
      args: [sessionSigner, payload.spendAmount]
    });
    */

    // Simülasyon cevabı
    return res.json({
      success: true,
      message: "İşlem gaz ücreti sübvanse edilerek zincire iletildi."
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Relayer 3000 portunda çalışıyor...");
});