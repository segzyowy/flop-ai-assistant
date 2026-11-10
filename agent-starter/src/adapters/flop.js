// FLOP protocol adapter boundary. No network values or wire formats are assumed.
export function createFlopAdapter(){return{async status(){return{connected:false,reason:'FLOP Testnet release and public connection details are not verified.'};},async requestInference(){throw new Error('FLOP inference is unavailable: the official public Testnet interface is not verified.');}};}
