import { TransferRequestURL, parseURL } from "@solana/pay";
import { time } from "console";

let getAppToken = async (userId: number) => {
    //TODO
    //Get the app token for the corresponding userId from our database
    return 'flJ2SP6tTayIEyF6tupNjh:APA91bGvO9e_QsWrxt5YQw6xNwHZEENioSnRJWxcNn-fQnZ2STUdM1zZvu6HfcPjjBPUtK5fbgZ0__ZAz_ZU1P2kz2fIASR6JaiwFMnOsCAT-uOhfNHdCk9p1pGFRW2tGGmh31hCpU6P'
}

export let getFcmMessage = async (solanaPayUrl: URL, fiatAmount: number, userId: number, appToken: string, timeLimit: number)=> {
    //get the users application token from database
    // let appToken = await getAppToken(userId);
    
    const stringUrl = stringifyURL(solanaPayUrl);
    const fiatAmountString = Number(fiatAmount).toFixed(2);

    let fcmMessage = {
        to: appToken,
        notification: {
            title: 'Payment Authentication Needed',
            body: 'Please accept or decline this transaction',
        },
        data: {
            navigationFlow: 'Send',
            screenToOpen: 'SpendScreen',
            title: 'Payment Authentication',
            timeLimit: timeLimit.toString(),
            amountFiat: fiatAmount,
            urlObj: stringUrl
        }
    };

    return fcmMessage;
}

function stringifyURL(url: URL) {
    let object = {
        href: url.href,
        origin: url.origin,
        protocol: url.protocol,
        username: url.username,
        password: url.password,
        host: url.host,
        hostname: url.hostname,
        port: url.port,
        pathname: url.pathname,
        search: url.search,
        searchParams: Object.fromEntries(url.searchParams),
        hash: url.hash,
    };
    return JSON.stringify(object);
}