import CryptoJS from 'react-native-crypto-js'; // Updated import for react-native-crypto-js

const SECRET_KEY =
  'af2e3a48d1fa3e2d92d23edb8b5245d08a9c5ad45c36d438268b7c53f37f1e57';

// Encrypt password
export const encryptPassword = (password) => {
  try {
    const encryptedPassword = CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
    return {status:true,message: encryptedPassword};
  } catch (error) {
    console.error('Encryption error:', error);
    return {status:false,message: error};
    // throw error;
  }
};

// Decrypt password
export const decryptPassword = (encryptedPassword) => {
  console.log('=========== encryptPassword ===========');
  console.log(encryptPassword);
  console.log('====================================');
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, SECRET_KEY);
    const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);
    return {status:true,message: decryptedPassword};
  } catch (error) {
    console.error('Decryption error:', error);
    return {status:false,message: error};
  }
};
