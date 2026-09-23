import { createWalletClient, custom } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { mainnet, sepolia } from "viem/chains";

const VALIDATOR_ADDRESS = "0xYourValidatorContractAddress";
const VALIDATOR_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_sessionSigner", type: "address" },
      { internalType: "uint256", name: "_duration", type: "uint256" },
      { internalType: "uint256", name: "_maxSpend", type: "uint256" }
    ],
    name: "enableSession",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
] as const;

// 1. ADIM: Oturum Başlatma (Kullanıcı SADECE bir kez cüzdan onayı verir)
async function startSession() {
  // Tarayıcıdaki cüzdanı (MetaMask) bağla
  const browserClient = createWalletClient({
    chain: sepolia,
    transport: custom((window as any).ethereum)
  });
  const [userAddress] = await browserClient.requestAddresses();

  // Tarayıcı belleğinde geçici anahtar üret (Local Private Key)
  const sessionPrivateKey = generatePrivateKey();
  const sessionAccount = privateKeyToAccount(sessionPrivateKey);

  console.log("Geçici Anahtar Adresi:", sessionAccount.address);

  // Ana cüzdan ile akıllı sözleşmeye yetkilendirme işlemini gönder
  // (1 saat geçerli, max 100 harcama limiti)
  const txHash = await browserClient.writeContract({
    address: VALIDATOR_ADDRESS,
    abi: VALIDATOR_ABI,
    functionName: "enableSession",
    args: [sessionAccount.address, BigInt(3600), BigInt(100)],
    account: userAddress
  });

  console.log("Yetkilendirme Onaylandı! TX:", txHash);

  // Bu geçici anahtarı oturum süresince hafızada (veya sessionStorage'da) tutun
  return sessionPrivateKey;
}

// 2. ADIM: Sessiz İşlem İmzala ve Backend'e İlet (SIFIR Cüzdan Popup'ı)
async function executeMove(sessionPrivateKey: `0x${string}`, spendAmount: number) {
  const sessionAccount = privateKeyToAccount(sessionPrivateKey);

  // Hamle verisini hazırla
  const payload = {
    action: "BUY_IN_GAME_ITEM",
    spendAmount: spendAmount,
    timestamp: Date.now()
  };

  // Veriyi geçici anahtarla istemcide imzala
  const messageToSign = JSON.stringify(payload);
  const signature = await sessionAccount.signMessage({ message: messageToSign });

  // İmzalanmış hamleyi arka planda Node.js Relayer'a yolla
  const response = await fetch("http://localhost:3000/api/relay-tx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionSigner: sessionAccount.address,
      payload,
      signature
    })
  });

  const result = await response.json();
  console.log("İşlem Relayer Tarafından Gönderildi:", result);
}