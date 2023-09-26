import { ConfirmedTransactionMeta, Connection, Finality, Keypair, LAMPORTS_PER_SOL, Message, PublicKey, SystemInstruction, Transaction, TransactionInstruction, TransactionResponse, TransactionSignature, clusterApiUrl } from "@solana/web3.js";
import { QUARTZ_SPEND_ADDRESS, USDC_MINT_ADDRESS, checkCanAfford, getCardTokenMint, getRequiredTokenAmount } from "./balance";
import { encodeURL, createQR, findReference, FindReferenceError, ValidateTransferError, ValidateTransferFields, Recipient, Reference, SPLToken, validateTransfer } from '@solana/pay';
import BigNumber from 'bignumber.js';
import { getFcmMessage } from "./message";

var FCM = require('fcm-node');
var serverKey = process.env.NEXT_PUBLIC_FCM;
var fcm = new FCM(serverKey);

console.log("server key: ", serverKey);

let connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

console.log("connection: ", connection);

export const RESPONSE_TIME_LIMIT = 15000;
export const CONFIRMATION_TIME_BUFFER = 10000;

export async function sendMessage(appToken: string, fiat: number, label: string, location: string) {
    console.log(`\n[server] Received card authentication request for ${appToken.slice(0, 5)}...`);

    let userId = 1;
    let paymentStatus = "sending";

    let cardTokenMint = await getCardTokenMint(userId);
    const amountToken = await getRequiredTokenAmount(cardTokenMint, fiat);

    console.log(`[server] Checking if user can afford transaction... (Required: ${amountToken})`);
    let canAfford = await checkCanAfford(connection, cardTokenMint, amountToken, userId);

    if (!canAfford) {
        declineTransaction('[server] Insufficient funds for transaction');
        return;
    }

    const reference = new Keypair().publicKey;
    console.log("[server] User has sufficient funds");
    console.log(`[server] Creating payment request link... (reference: ${reference}`);

    const amount = new BigNumber(fiat); // TODO - Fix
    const url = encodeURL({ 
        recipient: QUARTZ_SPEND_ADDRESS, 
        amount, 
        splToken: cardTokenMint, 
        reference, 
        label, 
        message: location
    });

    // Create FCM message
    let fcmMessage = await getFcmMessage(url, fiat, userId, appToken, RESPONSE_TIME_LIMIT);

    // Send transaction notification to user for approval
    await fcm.send(fcmMessage, function (err: any, response: any) {
        if (err) {
            declineTransaction("[server] Failed to send app notification: " + err);
            return;
        }
        else console.log("[server] App notification successfully sent");
    });
    
    console.log('[server] Awaiting transaction confirmation...');
    paymentStatus = 'pending';

    const refreshInterval = 250;
    let waitTime = 0;

    const signature = await new Promise<string>((resolve, reject) => {
        const interval = setInterval(async () => {
            if (waitTime > RESPONSE_TIME_LIMIT + CONFIRMATION_TIME_BUFFER) {
                paymentStatus = 'timeout';
                clearInterval(interval);
                reject("Time limit exceeded");
            }

            if (waitTime % 1000 == 0) console.log(`[server] ${waitTime / 1000}s`);  

            waitTime += refreshInterval;
            
            try {
                const signature = (
                    await findReference(connection, reference, { finality: 'confirmed' })
                ).signature;

                clearInterval(interval);
                resolve(signature);
            } catch (error: any) {
                if (!(error instanceof FindReferenceError)) {
                    console.error(error);
                    clearInterval(interval);
                    reject(error);
                }
            }
        }, refreshInterval);
    }).catch((error) => {
        console.error("[server] Error finding instruction: " + error);
    });

    if (typeof signature !== 'string') {
        declineTransaction();
        return;
    }

    paymentStatus = 'confirmed';
    console.log("[server] Validating transaction...");

    let splToken: PublicKey | undefined;
    if (cardTokenMint !== USDC_MINT_ADDRESS) splToken = undefined;
    else splToken = cardTokenMint;

    try {
        await validateTransfer(
            connection, 
            signature, 
            { 
                recipient: QUARTZ_SPEND_ADDRESS, 
                amount: amount,
                splToken: splToken
            }
        );

        paymentStatus = 'validated';
        acceptTransaction();
    } catch (error: any) {
        paymentStatus = 'invalid';
        declineTransaction(error.toString());
    }
}

function declineTransaction(message: string = "") {
    if (message != "") console.log(`[server] ${message}`);
    console.log('[server] ❌ Decline debit card transaction');
}

function acceptTransaction() {
    console.log('\n[server] Payment validated');
    console.log('[server] ✅ Accept debit card transaction');
}