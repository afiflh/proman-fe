import CryptoJS from "crypto-js";
const encryptPayloadKey = import.meta.env.VITE_ENCRYPT_PAYLOAD_KEY;

function decryptPayload(encryptedBody) {
  try{
    const [ivHex,encryptedData] = encryptedBody.split(":");
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const decrypted = CryptoJS.AES.decrypt(encryptedData,CryptoJS.enc.Hex.parse(encryptPayloadKey),{iv:iv});
    const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
    return decryptedString;
  }catch(error){
    console.log(error);
    throw error;
  }
}

function encryptPayload(text) {
  try{
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(text,CryptoJS.enc.Hex.parse(encryptPayloadKey),{iv:iv});
    const encryptedString = iv.toString(CryptoJS.enc.Hex) + ":" + encrypted.toString();
    return encryptedString;
  }catch(error){
    console.log("Error during encryption",error);
    throw error;
  }
}

export { decryptPayload, encryptPayload };
