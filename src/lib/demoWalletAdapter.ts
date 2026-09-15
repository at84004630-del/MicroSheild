import {
  BaseSignerWalletAdapter,
  WalletName,
  WalletReadyState,
  WalletConnectionError,
} from "@solana/wallet-adapter-base";
import {
  Keypair,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";

export const DemoWalletName = "Devnet Demo Wallet (1-Click)" as WalletName<"Devnet Demo Wallet (1-Click)">;

// Pre-funded Devnet Keypair with 3.8+ SOL & initialized USDC account
const DEFAULT_DEVNET_SECRET = [
  230, 11, 115, 203, 189, 201, 69, 72, 185, 84, 64, 220, 101, 184, 110, 210,
  186, 33, 138, 209, 13, 66, 2, 26, 132, 55, 175, 18, 155, 167, 246, 95,
  254, 198, 106, 109, 196, 20, 171, 161, 117, 171, 193, 226, 100, 13, 108,
  101, 76, 26, 245, 14, 108, 27, 127, 99, 60, 37, 179, 117, 45, 13, 52, 255
];

export class DevnetDemoWalletAdapter extends BaseSignerWalletAdapter {
  name = DemoWalletName;
  url = "https://microshield.fi";
  icon = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2334d399' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/><path d='m9 12 2 2 4-4'/></svg>";
  supportedTransactionVersions = new Set(["legacy", 0] as const);

  private _keypair: Keypair | null = null;
  private _publicKey: PublicKey | null = null;
  private _connecting = false;

  get publicKey(): PublicKey | null {
    return this._publicKey;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get readyState(): WalletReadyState {
    return WalletReadyState.Installed;
  }

  async autoConnect(): Promise<void> {
    await this.connect();
  }

  async connect(): Promise<void> {
    if (this._connecting) return;
    if (this._keypair && this._publicKey) {
      this.emit("connect", this._publicKey);
      return;
    }
    this._connecting = true;
    try {
      let secretKeyBytes: number[];
      const stored = typeof window !== "undefined" ? localStorage.getItem("microshield_demo_wallet_secret") : null;
      if (stored) {
        try {
          secretKeyBytes = JSON.parse(stored);
        } catch {
          secretKeyBytes = DEFAULT_DEVNET_SECRET;
        }
      } else {
        secretKeyBytes = DEFAULT_DEVNET_SECRET;
        if (typeof window !== "undefined") {
          localStorage.setItem("microshield_demo_wallet_secret", JSON.stringify(secretKeyBytes));
        }
      }

      const kp = Keypair.fromSecretKey(Uint8Array.from(secretKeyBytes));
      this._keypair = kp;
      this._publicKey = kp.publicKey;
      this.emit("connect", kp.publicKey);
    } catch (err: unknown) {
      const error =
        err instanceof Error
          ? new WalletConnectionError(err.message, err)
          : new WalletConnectionError(String(err));
      this.emit("error", error);
      throw error;
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    this._keypair = null;
    this._publicKey = null;
    this.emit("disconnect");
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
    if (!this._keypair) throw new Error("Devnet Demo Wallet not connected");
    if ("version" in transaction) {
      (transaction as VersionedTransaction).sign([this._keypair]);
    } else {
      (transaction as Transaction).partialSign(this._keypair);
    }
    return transaction;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
    return Promise.all(transactions.map((tx) => this.signTransaction(tx)));
  }
}
